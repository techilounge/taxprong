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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTMLDocument(templateId: string, data: any): string {
  const { organization, business, period, generatedDate, vatSummary, invoices, citCalculation, expenseSummary, expenses } = data;
  
  // Enhanced CSS styling
  const styles = `
    @page { margin: 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1a1a1a;
      font-size: 11pt;
    }
    .container { 
      max-width: 210mm; 
      margin: 0 auto; 
      padding: 20px;
      background: white;
    }
    .header { 
      border-bottom: 3px solid #2563eb; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }
    .header-left h1 { 
      color: #2563eb; 
      font-size: 24pt; 
      margin-bottom: 5px;
      font-weight: 700;
    }
    .header-left .subtitle { 
      color: #64748b; 
      font-size: 10pt;
    }
    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #64748b;
    }
    .info-section { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 8px; 
      margin-bottom: 25px;
      border-left: 4px solid #2563eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      margin-bottom: 8px;
    }
    .info-label { 
      font-weight: 600; 
      color: #475569;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 3px;
    }
    .info-value { 
      color: #1e293b;
      font-size: 11pt;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th { 
      background: #2563eb; 
      color: white; 
      padding: 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { 
      padding: 10px 12px; 
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover { 
      background: #f8fafc; 
    }
    .amount { 
      text-align: right; 
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }
    .total-row { 
      background: #f1f5f9; 
      font-weight: 700;
      font-size: 12pt;
    }
    .total-row td {
      padding: 15px 12px;
      border-top: 2px solid #2563eb;
    }
    .section-title { 
      color: #1e293b; 
      font-size: 16pt; 
      margin: 30px 0 15px 0;
      font-weight: 700;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    .declaration-box {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
    }
    .declaration-box p {
      margin: 8px 0;
      font-size: 10pt;
    }
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
    }
    .signature-box {
      border-top: 2px solid #1e293b;
      padding-top: 10px;
    }
    .signature-label {
      font-weight: 600;
      color: #475569;
      font-size: 9pt;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(37, 99, 235, 0.05);
      font-weight: 900;
      pointer-events: none;
      z-index: -1;
    }
  `;

  let content = '';

  if (templateId === 'vat-return') {
    content = `
      <div class="watermark">DRAFT</div>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>VAT Return</h1>
            <div class="subtitle">Value Added Tax Monthly Return</div>
          </div>
          <div class="header-right">
            <div><strong>Period:</strong> ${period}</div>
            <div><strong>Generated:</strong> ${new Date(generatedDate).toLocaleDateString('en-NG')}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Business Name</span>
              <span class="info-value">${business?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">TIN</span>
              <span class="info-value">${business?.tin || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Organization</span>
              <span class="info-value">${organization.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Return Period</span>
              <span class="info-value">${period}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">VAT Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Output VAT (Sales)</td>
              <td class="amount">${(vatSummary?.outputVAT || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Total Input VAT (Purchases)</td>
              <td class="amount">${(vatSummary?.inputVAT || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Net VAT ${(vatSummary?.netVAT || 0) >= 0 ? 'Payable' : 'Refundable'}</strong></td>
              <td class="amount"><strong>₦${Math.abs(vatSummary?.netVAT || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-title">Invoice Schedule (${invoices?.length || 0} invoices)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Counterparty</th>
              <th class="amount">Net (₦)</th>
              <th class="amount">VAT (₦)</th>
            </tr>
          </thead>
          <tbody>
            ${invoices?.map((inv: any) => `
              <tr>
                <td>${new Date(inv.issue_date).toLocaleDateString('en-NG')}</td>
                <td>${inv.type === 'sales' ? 'Sales' : 'Purchase'}</td>
                <td>${inv.counterparty_name || 'N/A'}</td>
                <td class="amount">${(Number(inv.net) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                <td class="amount">${(Number(inv.vat) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No invoices recorded for this period</td></tr>'}
          </tbody>
        </table>

        <div class="declaration-box">
          <p><strong>Declaration:</strong></p>
          <p>I declare that the information provided in this return is true, correct, and complete to the best of my knowledge and belief.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">Signature</div>
            <div style="height: 30px;"></div>
            <div class="signature-label">Date: _________________</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Company Stamp</div>
            <div style="height: 30px;"></div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by TaxProNG - This is a computer-generated document</p>
          <p>For official use, please sign and stamp before submission</p>
        </div>
      </div>
    `;
  } else if (templateId === 'cit-return') {
    content = `
      <div class="watermark">DRAFT</div>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>CIT Annual Return</h1>
            <div class="subtitle">Corporate Income Tax Return</div>
          </div>
          <div class="header-right">
            <div><strong>Tax Year:</strong> ${period}</div>
            <div><strong>Generated:</strong> ${new Date(generatedDate).toLocaleDateString('en-NG')}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Company Name</span>
              <span class="info-value">${business?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">TIN</span>
              <span class="info-value">${business?.tin || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Turnover Band</span>
              <span class="info-value">${citCalculation?.turnover_band || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">MNE Status</span>
              <span class="info-value">${citCalculation?.is_mne ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">Tax Computation</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Assessable Profits</strong></td>
              <td class="amount">₦${(citCalculation?.assessable_profits || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>CIT Rate</td>
              <td class="amount">${(citCalculation?.cit_rate || 0)}%</td>
            </tr>
            <tr>
              <td><strong>CIT Payable</strong></td>
              <td class="amount">₦${(citCalculation?.cit_payable || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Development Levy Rate</td>
              <td class="amount">${(citCalculation?.development_levy_rate || 0)}%</td>
            </tr>
            <tr>
              <td><strong>Development Levy</strong></td>
              <td class="amount">₦${(citCalculation?.development_levy || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
            </tr>
            ${citCalculation?.is_mne ? `
              <tr style="background: #fef3c7;">
                <td><strong>ETR Effective Rate</strong></td>
                <td class="amount">${(citCalculation?.etr_percent || 0)}%</td>
              </tr>
              <tr style="background: #fef3c7;">
                <td><strong>ETR Top-up (Pillar 2)</strong></td>
                <td class="amount">₦${(citCalculation?.etr_topup || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>Total Tax Payable</strong></td>
              <td class="amount"><strong>₦${((citCalculation?.cit_payable || 0) + (citCalculation?.development_levy || 0) + (citCalculation?.etr_topup || 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="declaration-box">
          <p><strong>Declaration:</strong></p>
          <p>I declare that this return and accompanying financial statements are true, correct, and complete.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">Director's Signature</div>
            <div style="height: 30px;"></div>
            <div class="signature-label">Date: _________________</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Company Stamp</div>
            <div style="height: 30px;"></div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by TaxProNG - This is a computer-generated document</p>
          <p>For official use, please sign and stamp before submission</p>
        </div>
      </div>
    `;
  } else if (templateId === 'expense-report') {
    content = `
      <div class="watermark">DRAFT</div>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>Expense Report</h1>
            <div class="subtitle">Detailed Expense Analysis</div>
          </div>
          <div class="header-right">
            <div><strong>Period:</strong> ${period}</div>
            <div><strong>Generated:</strong> ${new Date(generatedDate).toLocaleDateString('en-NG')}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Organization</span>
              <span class="info-value">${organization.name}</span>
            </div>
            ${business ? `
            <div class="info-item">
              <span class="info-label">Business</span>
              <span class="info-value">${business.name}</span>
            </div>
            ` : ''}
            <div class="info-item">
              <span class="info-label">Total Expenses</span>
              <span class="info-value">₦${(expenseSummary?.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Transactions</span>
              <span class="info-value">${expenseSummary?.count || 0}</span>
            </div>
          </div>
        </div>

        <h2 class="section-title">Expenses by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="amount">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(expenseSummary?.byCategory || {}).map(([cat, amount]: [string, any]) => `
              <tr>
                <td>${cat}</td>
                <td class="amount">${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="amount"><strong>₦${(expenseSummary?.total || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-title">Detailed Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Description</th>
              <th class="amount">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            ${expenses?.map((exp: any) => `
              <tr>
                <td>${new Date(exp.date).toLocaleDateString('en-NG')}</td>
                <td>${exp.merchant || 'N/A'}</td>
                <td>${exp.category || 'Uncategorized'}</td>
                <td>${exp.description || '-'}</td>
                <td class="amount">${Number(exp.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No expenses recorded for this period</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by TaxProNG - This is a computer-generated document</p>
        </div>
      </div>
    `;
  } else {
    // Default template
    content = `
      <div class="watermark">DRAFT</div>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>${templateId.toUpperCase().replace(/-/g, ' ')}</h1>
            <div class="subtitle">Tax Document</div>
          </div>
          <div class="header-right">
            <div><strong>Period:</strong> ${period}</div>
            <div><strong>Generated:</strong> ${new Date(generatedDate).toLocaleDateString('en-NG')}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Organization</span>
              <span class="info-value">${organization.name}</span>
            </div>
            ${business ? `
            <div class="info-item">
              <span class="info-label">Business</span>
              <span class="info-value">${business.name}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <p style="padding: 40px 0; text-align: center; color: #64748b;">
          Document content will be generated based on available data
        </p>

        <div class="footer">
          <p>Generated by TaxProNG</p>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${templateId} - ${period}</title>
      <style>${styles}</style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}