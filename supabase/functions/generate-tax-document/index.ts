import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  templateId: string;
  period: string;
  businessId?: string;
  orgId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { templateId, period, businessId, orgId }: DocumentRequest = await req.json();

    console.log(`Generating document: ${templateId} for period ${period}`);

    // Fetch organization data
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('name, type')
      .eq('id', orgId)
      .single();

    if (orgError) throw orgError;

    // Fetch business data if businessId provided
    let business = null;
    if (businessId) {
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (bizError) throw bizError;
      business = bizData;
    }

    // Fetch relevant data based on template type
    let documentData: any = {
      organization: org,
      business: business,
      period: period,
      generatedDate: new Date().toISOString(),
    };

    if (templateId === 'vat-return' && businessId) {
      // Fetch invoices for the period
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .gte('issue_date', `${period}-01`)
        .lte('issue_date', `${period}-31`)
        .order('issue_date');

      // Calculate VAT summary
      const outputVAT = invoices?.filter(i => i.type === 'sales')
        .reduce((sum, i) => sum + (Number(i.vat) || 0), 0) || 0;
      
      const inputVAT = invoices?.filter(i => i.type === 'purchase')
        .reduce((sum, i) => sum + (Number(i.vat) || 0), 0) || 0;

      documentData.vatSummary = {
        outputVAT,
        inputVAT,
        netVAT: outputVAT - inputVAT,
        salesCount: invoices?.filter(i => i.type === 'sales').length || 0,
        purchaseCount: invoices?.filter(i => i.type === 'purchase').length || 0,
      };
      documentData.invoices = invoices;
    } else if (templateId === 'cit-return' && businessId) {
      // Fetch CIT calculation
      const { data: citCalc } = await supabase
        .from('cit_calcs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      documentData.citCalculation = citCalc;
    } else if (templateId === 'expense-report') {
      // Fetch expenses for the period
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('org_id', orgId)
        .eq('business_id', businessId)
        .gte('date', `${period}-01`)
        .lte('date', `${period}-31`)
        .order('date');

      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const categorySummary = expenses?.reduce((acc: any, e) => {
        const cat = e.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + Number(e.amount);
        return acc;
      }, {});

      documentData.expenses = expenses;
      documentData.expenseSummary = {
        total: totalExpenses,
        count: expenses?.length || 0,
        byCategory: categorySummary,
      };
    }

    // Generate HTML content
    const htmlContent = generateHTMLDocument(templateId, documentData);

    // Convert HTML to PDF (simplified - using HTML as PDF content)
    // In production, you would use a proper PDF generation library
    const pdfBuffer = new TextEncoder().encode(htmlContent);

    // Upload to storage
    const fileName = `${orgId}/${templateId}-${period}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tax-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Save document record
    const { data: docRecord, error: docError } = await supabase
      .from('generated_documents')
      .insert({
        org_id: orgId,
        business_id: businessId,
        template_id: templateId,
        period: period,
        file_url: fileName,
        file_size: pdfBuffer.length,
        status: 'completed',
        document_metadata: documentData,
        created_by: user.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Get signed URL for download
    const { data: signedUrl } = await supabase.storage
      .from('tax-documents')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    return new Response(
      JSON.stringify({
        success: true,
        document: docRecord,
        downloadUrl: signedUrl?.signedUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Document generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTMLDocument(templateId: string, data: any): string {
  const { organization, business, period, generatedDate } = data;

  let content = '';

  if (templateId === 'vat-return') {
    const { vatSummary } = data;
    content = `
      <h2>VAT Return</h2>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Business:</strong> ${business?.name || 'N/A'}</p>
      <p><strong>TIN:</strong> ${business?.tin || 'N/A'}</p>
      
      <h3>VAT Summary</h3>
      <table>
        <tr><td>Output VAT (Sales):</td><td>₦${vatSummary.outputVAT.toLocaleString()}</td></tr>
        <tr><td>Input VAT (Purchases):</td><td>₦${vatSummary.inputVAT.toLocaleString()}</td></tr>
        <tr><td><strong>Net VAT Payable:</strong></td><td><strong>₦${vatSummary.netVAT.toLocaleString()}</strong></td></tr>
      </table>
      
      <h3>Transaction Summary</h3>
      <p>Sales Invoices: ${vatSummary.salesCount}</p>
      <p>Purchase Invoices: ${vatSummary.purchaseCount}</p>
    `;
  } else if (templateId === 'cit-return') {
    const { citCalculation } = data;
    content = `
      <h2>Corporate Income Tax Return</h2>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Business:</strong> ${business?.name || 'N/A'}</p>
      <p><strong>TIN:</strong> ${business?.tin || 'N/A'}</p>
      
      <h3>Tax Computation</h3>
      <table>
        <tr><td>Assessable Profits:</td><td>₦${citCalculation?.assessable_profits?.toLocaleString() || '0'}</td></tr>
        <tr><td>CIT Rate:</td><td>${citCalculation?.cit_rate || '0'}%</td></tr>
        <tr><td><strong>CIT Payable:</strong></td><td><strong>₦${citCalculation?.cit_payable?.toLocaleString() || '0'}</strong></td></tr>
        ${citCalculation?.etr_topup ? `<tr><td>ETR Top-up:</td><td>₦${citCalculation.etr_topup.toLocaleString()}</td></tr>` : ''}
        ${citCalculation?.development_levy ? `<tr><td>Development Levy:</td><td>₦${citCalculation.development_levy.toLocaleString()}</td></tr>` : ''}
      </table>
    `;
  } else if (templateId === 'expense-report') {
    const { expenseSummary, expenses } = data;
    content = `
      <h2>Expense Report</h2>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Organization:</strong> ${organization.name}</p>
      ${business ? `<p><strong>Business:</strong> ${business.name}</p>` : ''}
      
      <h3>Summary</h3>
      <p><strong>Total Expenses:</strong> ₦${expenseSummary.total.toLocaleString()}</p>
      <p><strong>Number of Transactions:</strong> ${expenseSummary.count}</p>
      
      <h3>By Category</h3>
      <table>
        ${Object.entries(expenseSummary.byCategory).map(([cat, amount]: [string, any]) => 
          `<tr><td>${cat}:</td><td>₦${amount.toLocaleString()}</td></tr>`
        ).join('')}
      </table>
    `;
  } else {
    content = `
      <h2>${templateId.replace(/-/g, ' ').toUpperCase()}</h2>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Organization:</strong> ${organization.name}</p>
      ${business ? `<p><strong>Business:</strong> ${business.name}</p>` : ''}
      
      <p><em>Document data will be populated based on template requirements.</em></p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${templateId} - ${period}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
        }
        h1, h2, h3 { color: #333; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #333;
          font-size: 0.9em;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Nigeria Tax Document</h1>
      ${content}
      
      <div class="footer">
        <p><strong>Generated:</strong> ${new Date(generatedDate).toLocaleString()}</p>
        <p><strong>Generated by:</strong> TaxProNG Platform</p>
        <p><em>This is an auto-generated document. Please verify all information before submission.</em></p>
      </div>
    </body>
    </html>
  `;
}