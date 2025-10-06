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

      // Use native camera on mobile, file picker on web
      const isNative = Capacitor.isNativePlatform();
      
      const cameraPromise = Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: isNative ? CameraSource.Camera : CameraSource.Photos,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Camera request timed out')), 30000)
      );

      const image = await Promise.race([cameraPromise, timeoutPromise]);

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
      
      // Handle specific error cases
      let errorMessage = "Could not scan receipt";
      
      if (error.message?.includes('timeout')) {
        errorMessage = "Camera request timed out. Please try again or use the file upload option.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (error.message?.includes('User cancelled')) {
        // User cancelled - don't show error toast
        return null;
      }
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
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
