import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ScannedReceiptData {
  merchant?: string;
  amount?: number;
  date?: string;
  vatAmount?: number;
  category?: string;
  imageFile?: File;
}

export const useReceiptScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scanReceipt = async (): Promise<ScannedReceiptData | null> => {
    try {
      setIsScanning(true);

      // Request camera permission and capture image
      // Use Camera for native platforms, Prompt for web (allows camera or gallery)
      const isNative = Capacitor.isNativePlatform();
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: isNative ? CameraSource.Camera : CameraSource.Prompt,
      });

      setIsScanning(false);
      setIsProcessing(true);

      if (!image.dataUrl) {
        toast({
          title: "Error",
          description: "Failed to capture image",
          variant: "destructive",
        });
        return null;
      }

      // Convert base64 to blob
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to Supabase storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to scan receipts",
          variant: "destructive",
        });
        return null;
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Failed",
          description: "Could not upload receipt image",
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(uploadData.path);

      // Call OCR webhook to extract data
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-webhook', {
        body: {
          receiptUrl: publicUrl,
          expenseId: 'temp-scan-' + Date.now(), // Temporary ID for scan
        },
      });

      if (ocrError) {
        console.error('OCR error:', ocrError);
        toast({
          title: "Processing Complete",
          description: "Receipt saved, but data extraction failed. Please fill details manually.",
        });
        return { imageFile: file };
      }

      toast({
        title: "Receipt Scanned!",
        description: "Expense details extracted successfully",
      });

      return {
        merchant: ocrData.merchant,
        amount: ocrData.amount,
        date: ocrData.date,
        vatAmount: ocrData.vatAmount,
        category: ocrData.category,
        imageFile: file,
      };
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Could not scan receipt",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsScanning(false);
      setIsProcessing(false);
    }
  };

  return {
    scanReceipt,
    isScanning,
    isProcessing,
  };
};
