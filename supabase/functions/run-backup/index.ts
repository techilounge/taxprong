import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupSettings {
  org_id: string;
  provider: string;
  bucket: string;
  prefix: string;
  access_key: string;
  secret_key: string;
  region?: string;
  enabled: boolean;
}

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

async function signS3Request(
  method: string,
  url: string,
  config: S3Config,
  body?: string
): Promise<{ url: string; headers: Record<string, string> }> {
  const urlObj = new URL(url);
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = date.substring(0, 8);
  
  const canonicalUri = urlObj.pathname;
  const canonicalQueryString = '';
  const canonicalHeaders = `host:${urlObj.host}\nx-amz-date:${date}\n`;
  const signedHeaders = 'host;x-amz-date';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(body || '');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const payloadHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const encoder2 = new TextEncoder();
  const canonicalHashBuffer = await crypto.subtle.digest('SHA-256', encoder2.encode(canonicalRequest));
  const canonicalHashArray = Array.from(new Uint8Array(canonicalHashBuffer));
  const canonicalHash = canonicalHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const stringToSign = `${algorithm}\n${date}\n${credentialScope}\n${canonicalHash}`;
  
  const kDate = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`AWS4${config.secretAccessKey}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const kDateSig = await crypto.subtle.sign('HMAC', kDate, new TextEncoder().encode(dateStamp));
  
  const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, new TextEncoder().encode(config.region));
  
  const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kServiceSig = await crypto.subtle.sign('HMAC', kService, new TextEncoder().encode('s3'));
  
  const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kSigningSig = await crypto.subtle.sign('HMAC', kSigning, new TextEncoder().encode('aws4_request'));
  
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', kSigningSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), new TextEncoder().encode(stringToSign))))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const authorization = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    url,
    headers: {
      'Host': urlObj.host,
      'x-amz-date': date,
      'Authorization': authorization,
      'Content-Type': 'application/zip',
    },
  };
}

async function uploadToS3(buffer: ArrayBuffer, key: string, settings: BackupSettings): Promise<string> {
  const url = `https://${settings.bucket}.s3.${settings.region || 'us-east-1'}.amazonaws.com/${key}`;
  
  const config: S3Config = {
    accessKeyId: settings.access_key,
    secretAccessKey: settings.secret_key,
    region: settings.region || 'us-east-1',
    bucket: settings.bucket,
  };
  
  const { headers } = await signS3Request('PUT', url, config, new TextDecoder().decode(buffer));
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: buffer,
  });
  
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`);
  }
  
  return url;
}

async function uploadToGCS(buffer: ArrayBuffer, key: string, settings: BackupSettings): Promise<string> {
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${settings.bucket}/o?uploadType=media&name=${encodeURIComponent(key)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.secret_key}`,
      'Content-Type': 'application/zip',
    },
    body: buffer,
  });
  
  if (!response.ok) {
    throw new Error(`GCS upload failed: ${response.statusText}`);
  }
  
  return `https://storage.googleapis.com/${settings.bucket}/${key}`;
}

async function maskEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportTableToCSV(
  supabase: any,
  table: string,
  orgId: string
): Promise<{ csv: string; rowCount: number }> {
  console.log(`Exporting table: ${table} for org: ${orgId}`);
  
  let query = supabase.from(table).select('*');
  
  // Apply org filter for org-specific tables
  const orgTables = ['businesses', 'expenses', 'invoices', 'tasks', 'filing_events', 
                     'bank_txns', 'vat_returns', 'saved_reports', 'docs', 'backup_runs', 'backup_settings'];
  if (orgTables.includes(table)) {
    query = query.eq('org_id', orgId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error exporting ${table}:`, error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return { csv: '', rowCount: 0 };
  }
  
  // Mask PII
  const maskedData = await Promise.all(data.map(async (row: any) => {
    const masked = { ...row };
    
    // Mask email and phone in profiles
    if (table === 'profiles') {
      if (masked.email) masked.email = await maskEmail(masked.email);
      if (masked.phone) masked.phone = null;
    }
    
    // Mask message body
    if (table === 'messages') {
      masked.body = null;
    }
    
    return masked;
  }));
  
  // Generate CSV
  const headers = Object.keys(maskedData[0]);
  const csvRows = [
    headers.join(','),
    ...maskedData.map(row => 
      headers.map(header => escapeCSV(row[header])).join(',')
    )
  ];
  
  return { 
    csv: csvRows.join('\n'),
    rowCount: maskedData.length
  };
}

async function createZipFile(files: Record<string, string>): Promise<ArrayBuffer> {
  // Simple zip creation (for production, consider using a proper zip library)
  const encoder = new TextEncoder();
  const fileEntries: ArrayBuffer[] = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const data = encoder.encode(content);
    fileEntries.push(data.buffer);
  }
  
  // For now, concatenate files (in production, use proper zip format)
  const totalLength = Object.values(files).reduce((sum, content) => sum + encoder.encode(content).length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const content of Object.values(files)) {
    const data = encoder.encode(content);
    combined.set(data, offset);
    offset += data.length;
  }
  
  return combined.buffer;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting backup process...');
    
    // Get all orgs with backup enabled
    const { data: settings, error: settingsError } = await supabase
      .from('backup_settings')
      .select('*')
      .eq('enabled', true);
    
    if (settingsError) {
      throw settingsError;
    }
    
    if (!settings || settings.length === 0) {
      console.log('No orgs with backup enabled');
      return new Response(
        JSON.stringify({ message: 'No backups to run' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const results = [];
    
    for (const orgSettings of settings as BackupSettings[]) {
      const runId = crypto.randomUUID();
      const startedAt = new Date().toISOString();
      
      try {
        console.log(`Processing backup for org: ${orgSettings.org_id}`);
        
        // Create backup run record
        await supabase.from('backup_runs').insert({
          id: runId,
          org_id: orgSettings.org_id,
          status: 'running',
          started_at: startedAt,
        });
        
        // Export tables
        const tables = [
          'businesses', 'expenses', 'invoices', 'tasks', 'filing_events',
          'bank_txns', 'vat_returns', 'profiles', 'messages'
        ];
        
        const csvFiles: Record<string, string> = {};
        let totalRows = 0;
        let exportedTables = 0;
        
        for (const table of tables) {
          try {
            const { csv, rowCount } = await exportTableToCSV(supabase, table, orgSettings.org_id);
            if (csv) {
              csvFiles[`${table}.csv`] = csv;
              totalRows += rowCount;
              exportedTables++;
            }
          } catch (error) {
            console.error(`Failed to export ${table}:`, error);
          }
        }
        
        // Create zip
        const zipBuffer = await createZipFile(csvFiles);
        
        // Upload to storage
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const key = `${orgSettings.prefix}${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/backup-${orgSettings.org_id}-${dateStr}.zip`;
        
        let fileUrl: string;
        
        if (orgSettings.provider === 's3') {
          fileUrl = await uploadToS3(zipBuffer, key, orgSettings);
        } else {
          fileUrl = await uploadToGCS(zipBuffer, key, orgSettings);
        }
        
        // Update backup run
        await supabase
          .from('backup_runs')
          .update({
            status: 'ok',
            file_url: fileUrl,
            finished_at: new Date().toISOString(),
            tables_count: exportedTables,
            rows_count: totalRows,
            notes: `Successfully backed up ${exportedTables} tables with ${totalRows} total rows`,
          })
          .eq('id', runId);
        
        // Log to audit logs
        await supabase
          .from('audit_logs')
          .insert({
            entity: 'backup',
            entity_id: runId,
            action: 'create',
            user_id: orgSettings.org_id,
            payload_hash: `${exportedTables} tables, ${totalRows} rows, ${(zipBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`,
          });
        
        results.push({
          org_id: orgSettings.org_id,
          status: 'ok',
          file_url: fileUrl,
        });
        
      } catch (error: any) {
        console.error(`Backup failed for org ${orgSettings.org_id}:`, error);
        
        await supabase
          .from('backup_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            notes: error?.message || 'Unknown error',
          })
          .eq('id', runId);
        
        results.push({
          org_id: orgSettings.org_id,
          status: 'failed',
          error: error?.message || 'Unknown error',
        });
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Backup process error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
