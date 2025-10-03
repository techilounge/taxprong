import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const invoiceSchema = z.object({
  type: z.enum(["sale", "purchase"]),
  counterparty_name: z.string().min(1, "Counterparty name is required"),
  counterparty_tin: z.string().optional(),
  supply_type: z.enum(["standard", "zero", "exempt"]),
  net: z.string().min(1, "Net amount is required"),
  vat_rate: z.string().optional(),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().optional(),
  description: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ businessId, onSuccess, onCancel }: InvoiceFormProps) {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: "sale",
      supply_type: "standard",
      issue_date: new Date().toISOString().split("T")[0],
      vat_rate: "7.5",
    },
  });

  const supplyType = form.watch("supply_type");
  const netAmount = form.watch("net");
  const vatRate = form.watch("vat_rate");

  const calculateVAT = () => {
    if (supplyType === "exempt" || supplyType === "zero") return 0;
    const net = parseFloat(netAmount || "0");
    const rate = parseFloat(vatRate || "0");
    return (net * rate) / 100;
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const net = parseFloat(data.net);
      const rate = data.vat_rate ? parseFloat(data.vat_rate) : 0;
      const vat = supplyType === "standard" ? calculateVAT() : 0;

      const invoiceData: any = {
        business_id: businessId,
        type: data.type,
        counterparty_name: data.counterparty_name,
        counterparty_tin: data.counterparty_tin || null,
        supply_type: data.supply_type,
        net,
        vat_rate: rate,
        vat,
        issue_date: data.issue_date,
        due_date: data.due_date || null,
        description: data.description || null,
      };

      const { error } = await supabase.from("invoices").insert(invoiceData);

      if (error) throw error;

      toast.success("Invoice created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error(error.message || "Failed to save invoice");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sale">Sales Invoice (Output VAT)</SelectItem>
                  <SelectItem value="purchase">Purchase Invoice (Input VAT)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="counterparty_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("type") === "sale" ? "Customer" : "Supplier"} Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="counterparty_tin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TIN (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tax ID Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supply_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supply Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard">Standard Rated (7.5% VAT)</SelectItem>
                  <SelectItem value="zero">Zero Rated (0% VAT)</SelectItem>
                  <SelectItem value="exempt">Exempt (No VAT)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {supplyType === "standard" && "Standard rated goods/services attract 7.5% VAT"}
                {supplyType === "zero" && "Zero rated (exports, international services)"}
                {supplyType === "exempt" && "Exempt supplies (medical, education, etc.)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="net"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net Amount (₦)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vat_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="7.5"
                    disabled={supplyType !== "standard"}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  VAT: ₦{calculateVAT().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <Textarea placeholder="Invoice description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Invoice</Button>
        </div>
      </form>
    </Form>
  );
}
