import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { logAudit } from "@/lib/auditLog";

interface BankTransaction {
  date: string;
  narration: string;
  amount: number;
  direction: "credit" | "debit";
}

interface BankImportProps {
  orgId: string;
  businessId?: string;
  onSuccess?: () => void;
}

export const BankImport = ({ orgId, businessId, onSuccess }: BankImportProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    created: number;
    matched: number;
    failed: number;
  } | null>(null);

  const parseCSV = (text: string): BankTransaction[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const transactions: BankTransaction[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
      
      if (parts.length >= 3) {
        const date = parts[0];
        const narration = parts[1];
        const amountStr = parts[2];
        
        // Determine if credit or debit based on amount sign
        const amount = Math.abs(parseFloat(amountStr));
        const direction: "credit" | "debit" = parseFloat(amountStr) > 0 ? "credit" : "debit";
        
        if (date && narration && !isNaN(amount)) {
          transactions.push({ date, narration, amount, direction });
        }
      }
    }
    
    return transactions;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResults(null);

    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let created = 0;
      let matched = 0;
      let failed = 0;
      const batchId = `import_${Date.now()}`;

      // Process each transaction
      for (const txn of transactions) {
        try {
          // Check if there's a matching expense
          const { data: matchingExpense } = await supabase
            .from('expenses')
            .select('id')
            .eq('org_id', orgId)
            .eq('date', txn.date)
            .eq('amount', txn.amount)
            .ilike('merchant', `${txn.narration.substring(0, 3)}%`)
            .maybeSingle();

          // Insert bank transaction
          const { error: insertError } = await supabase
            .from('bank_txns')
            .insert({
              org_id: orgId,
              business_id: businessId,
              date: txn.date,
              narration: txn.narration,
              amount: txn.amount,
              direction: txn.direction,
              matched_expense_id: matchingExpense?.id || null,
              import_batch_id: batchId
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            failed++;
          } else {
            if (matchingExpense) {
              matched++;
            } else {
              created++;
            }
          }
        } catch (error) {
          console.error('Transaction processing error:', error);
          failed++;
        }
      }

      // Log the import
      await logAudit('bank_import', batchId, 'create', user.id, {
        total: transactions.length,
        created,
        matched,
        failed
      });

      setResults({
        total: transactions.length,
        created,
        matched,
        failed
      });

      toast({
        title: "Import complete",
        description: `Processed ${transactions.length} transactions: ${created} created, ${matched} matched, ${failed} failed`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bank Statement Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with columns: Date, Narration, Amount
          </p>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Processing transactions...</p>
          </div>
        )}

        {results && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Import Results</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span>Total:</span>
                <span className="font-medium">{results.total}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Created: {results.created}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span>Matched: {results.matched}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>Failed: {results.failed}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Match rate: {((results.matched / results.total) * 100).toFixed(0)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};