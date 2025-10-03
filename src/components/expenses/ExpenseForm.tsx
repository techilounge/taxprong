import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  merchant: z.string().min(1, "Merchant is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  vat_amount: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  vat_recoverable_pct: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  orgId: string;
  businessId?: string;
  expense?: {
    id: string;
    date: string;
    merchant: string;
    description?: string;
    amount: number;
    vat_amount?: number;
    category: string;
    vat_recoverable_pct?: number;
    receipt_url?: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  "Office Supplies",
  "Marketing",
  "Travel",
  "Professional Fees",
  "Utilities",
  "Rent",
  "Equipment",
  "Software",
  "Other",
];

export function ExpenseForm({ orgId, businessId, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      date: expense.date,
      merchant: expense.merchant,
      description: expense.description || "",
      amount: expense.amount.toString(),
      vat_amount: expense.vat_amount?.toString() || "",
      category: expense.category,
      vat_recoverable_pct: expense.vat_recoverable_pct?.toString() || "100",
    } : {
      date: new Date().toISOString().split("T")[0],
      merchant: "",
      description: "",
      amount: "",
      vat_amount: "",
      category: "",
      vat_recoverable_pct: "100",
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload PDF, PNG, JPG, JPEG, or DOCX files only");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setReceiptFile(file);
    toast.success(`File selected: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("File removed");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadReceipt = async (expenseId: string): Promise<string | null> => {
    if (!receiptFile) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${expenseId}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, receiptFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const amount = parseFloat(data.amount);
      const vatAmount = data.vat_amount ? parseFloat(data.vat_amount) : 0;
      const vatRecoverablePct = data.vat_recoverable_pct
        ? parseFloat(data.vat_recoverable_pct)
        : 100;

      // Check if needs review (VAT amount > total amount)
      const needsReview = vatAmount > amount;

      const expenseData: any = {
        org_id: orgId,
        business_id: businessId || null,
        user_id: session.user.id,
        date: data.date,
        merchant: data.merchant,
        description: data.description || null,
        amount,
        vat_amount: vatAmount,
        vat_recoverable_pct: vatRecoverablePct,
        category: data.category,
        flags_json: needsReview ? { needs_review: true, reason: "VAT amount exceeds total" } : null,
      };

      if (expense) {
        // Update existing expense
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", expense.id);

        if (error) throw error;

        // Upload receipt if new file is selected
        if (receiptFile) {
          const receiptUrl = await uploadReceipt(expense.id);
          if (receiptUrl) {
            await supabase
              .from("expenses")
              .update({ receipt_url: receiptUrl })
              .eq("id", expense.id);
          }
        }

        toast.success("Expense updated successfully!");
      } else {
        // Create new expense
        const { data: newExpense, error } = await supabase
          .from("expenses")
          .insert(expenseData)
          .select()
          .single();

        if (error) throw error;

        // Upload receipt if file is selected
        if (receiptFile && newExpense) {
          const receiptUrl = await uploadReceipt(newExpense.id);
          if (receiptUrl) {
            await supabase
              .from("expenses")
              .update({ receipt_url: receiptUrl })
              .eq("id", newExpense.id);
          }
        }

        toast.success("Expense added successfully!");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Failed to save expense");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="merchant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant</FormLabel>
                <FormControl>
                  <Input placeholder="Merchant name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Expense description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₦)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vat_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Amount (₦)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vat_recoverable_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Recoverable (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Receipt Upload</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG, JPEG, DOCX up to 10MB
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
          {receiptFile && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <p className="text-sm text-foreground flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                {receiptFile.name}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Saving..." : expense ? "Update Expense" : "Save Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
