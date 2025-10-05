import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const businessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  tin: z.string().optional(),
  vat_registered: z.boolean().default(false),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessStepProps {
  onNext: () => void;
}

export const BusinessStep = ({ onNext }: BusinessStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      tin: "",
      vat_registered: false,
    },
  });

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Create or get organization
      let orgId;
      const { data: existingOrg } = await supabase
        .from("orgs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from("orgs")
          .insert({
            name: `${data.name} Organization`,
            owner_id: user.id,
            type: "business",
          })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;

        // Create org_user entry
        await supabase.from("org_users").insert({
          org_id: orgId,
          user_id: user.id,
          role: "owner",
        });
      }

      // Create business
      const { error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: data.name,
          tin: data.tin || null,
          vat_registered: data.vat_registered,
          owner_id: user.id,
          org_id: orgId,
        });

      if (businessError) throw businessError;

      toast({
        title: "Business added!",
        description: "Your business profile has been created.",
      });

      onNext();
    } catch (error: any) {
      console.error("Error creating business:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Add Your First Business</CardTitle>
        <CardDescription className="mt-2">
          Enter your business details to get started with tax tracking
        </CardDescription>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Acme Ltd" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Identification Number (TIN)</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormDescription>
                  You can add this later if you don't have it handy
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vat_registered"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">VAT Registered</FormLabel>
                  <FormDescription>
                    Is your business registered for VAT in Nigeria?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Add Business"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
