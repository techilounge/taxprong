import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2 } from "lucide-react";

interface BackupSettingsData {
  provider: 's3' | 'gcs';
  bucket: string;
  prefix: string;
  access_key: string;
  secret_key: string;
  region: string;
  enabled: boolean;
}

export function BackupSettings() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<BackupSettingsData>({
    provider: 's3',
    bucket: '',
    prefix: '',
    access_key: '',
    secret_key: '',
    region: 'us-east-1',
    enabled: false,
  });

  useEffect(() => {
    if (organization?.id) {
      loadSettings();
    }
  }, [organization?.id]);

  const loadSettings = async () => {
    if (!organization?.id) return;

    try {
      // Use the secure function that excludes all credential columns
      const { data, error } = await supabase
        .rpc('get_backup_settings_metadata', { _org_id: organization.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsData = data[0];
        setSettings({
          provider: settingsData.provider as 's3' | 'gcs',
          bucket: settingsData.bucket,
          prefix: settingsData.prefix,
          access_key: '********', // Always masked - credentials never exposed to UI
          secret_key: '********', // Always masked - credentials never exposed to UI
          region: settingsData.region || '',
          enabled: settingsData.enabled,
        });
      }
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      // Update metadata using secure function (prevents credential manipulation)
      const { error: metadataError } = await supabase
        .rpc('update_backup_metadata', {
          _org_id: organization.id,
          _provider: settings.provider,
          _bucket: settings.bucket,
          _prefix: settings.prefix,
          _region: settings.region,
          _enabled: settings.enabled,
        });

      if (metadataError) throw metadataError;

      // If credentials were changed (not masked), encrypt and store them securely
      if (settings.access_key && settings.secret_key && settings.secret_key !== '********') {
        const { error: credError } = await supabase
          .rpc('set_backup_credentials', {
            _org_id: organization.id,
            _access_key: settings.access_key,
            _secret_key: settings.secret_key
          });

        if (credError) throw credError;
      }

      toast({
        title: "Settings Saved",
        description: "Backup settings have been saved securely with encrypted credentials.",
      });

      loadSettings(); // Reload to mask the secrets
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!organization?.id) return;

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-backup', {
        body: { org_id: organization.id },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test Successful",
          description: `Test file written to: ${data.file_path}`,
        });
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Settings</CardTitle>
        <CardDescription>
          Configure automated backups to S3 or Google Cloud Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Storage Provider</Label>
          <Select
            value={settings.provider}
            onValueChange={(value: 's3' | 'gcs') =>
              setSettings({ ...settings, provider: value })
            }
          >
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="gcs">Google Cloud Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bucket">Bucket Name</Label>
          <Input
            id="bucket"
            value={settings.bucket}
            onChange={(e) => setSettings({ ...settings, bucket: e.target.value })}
            placeholder="my-backup-bucket"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prefix">Prefix Path</Label>
          <Input
            id="prefix"
            value={settings.prefix}
            onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
            placeholder="backups/prod"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access_key">Access Key / Client ID</Label>
          <Input
            id="access_key"
            value={settings.access_key}
            onChange={(e) => setSettings({ ...settings, access_key: e.target.value })}
            placeholder="AKIAIOSFODNN7EXAMPLE"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret_key">Secret Key / Client Secret</Label>
          <Input
            id="secret_key"
            type="password"
            value={settings.secret_key}
            onChange={(e) => setSettings({ ...settings, secret_key: e.target.value })}
            placeholder="Enter secret key"
          />
        </div>

        {settings.provider === 's3' && (
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={settings.region}
              onChange={(e) => setSettings({ ...settings, region: e.target.value })}
              placeholder="us-east-1"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enabled: checked })
            }
          />
          <Label htmlFor="enabled">Enable Automated Backups</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
          <Button onClick={handleTest} variant="outline" disabled={testing || !settings.bucket}>
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>
        </div>

        <div className="text-sm text-muted-foreground pt-4 border-t">
          <p className="font-semibold mb-2">Tables backed up:</p>
          <p className="text-xs leading-relaxed">
            users (PII masked), orgs, org_users, businesses, invoices, vat_returns, expenses, 
            bank_txns, pit_profiles, cit_calcs, cgt_events, stamp_instruments, docs (metadata only), 
            tasks, subscriptions, audit_logs, engagements, pro_invoices, messages (metadata only)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
