import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupSettings {
  provider: 's3' | 'gcs';
  bucket: string;
  prefix: string;
  access_key: string;
  secret_key: string;
  region?: string;
  enabled: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { org_id } = await req.json();

    if (!org_id) {
      return new Response(
        JSON.stringify({ error: 'Missing org_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch backup settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('backup_settings')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Backup settings not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backupSettings = settings as BackupSettings;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `test-${timestamp}.txt`;
    const filePath = backupSettings.prefix
      ? `${backupSettings.prefix}/${fileName}`
      : fileName;
    const testContent = `Backup test successful at ${new Date().toISOString()}\nOrg: ${org_id}`;

    // Test write based on provider
    if (backupSettings.provider === 's3') {
      await writeToS3(backupSettings, filePath, testContent);
    } else {
      await writeToGCS(backupSettings, filePath, testContent);
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_path: `${backupSettings.bucket}/${filePath}`,
        message: 'Test file written successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in test-backup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function writeToS3(settings: BackupSettings, filePath: string, content: string) {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  
  const url = `https://${settings.bucket}.s3.${settings.region || 'us-east-1'}.amazonaws.com/${filePath}`;
  const date = new Date().toUTCString();
  
  // Create AWS Signature V4
  const stringToSign = `PUT\n\n\n${date}\n/${settings.bucket}/${filePath}`;
  const signature = await hmacSHA1(settings.secret_key, stringToSign);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `AWS ${settings.access_key}:${signature}`,
      'Date': date,
      'Content-Type': 'text/plain',
    },
    body: contentBytes,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed: ${response.status} - ${errorText}`);
  }
}

async function writeToGCS(settings: BackupSettings, filePath: string, content: string) {
  // For GCS, we'll use the JSON API with service account credentials
  // This is a simplified version - in production, you'd use proper OAuth2
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${settings.bucket}/o?uploadType=media&name=${encodeURIComponent(filePath)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.access_key}`, // In practice, this would be an OAuth token
      'Content-Type': 'text/plain',
    },
    body: content,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GCS upload failed: ${response.status} - ${errorText}`);
  }
}

async function hmacSHA1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
