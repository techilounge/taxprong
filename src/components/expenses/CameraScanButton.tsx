import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { Loader2 } from 'lucide-react';

interface CameraScanButtonProps {
  onScanComplete: (data: {
    merchant?: string;
    amount?: number;
    date?: string;
    vatAmount?: number;
    category?: string;
    imageFile?: File;
  }) => void;
}

export const CameraScanButton = ({ onScanComplete }: CameraScanButtonProps) => {
  const { scanReceipt, isScanning, isProcessing } = useReceiptScanner();

  const handleScan = async () => {
    const result = await scanReceipt();
    if (result) {
      onScanComplete(result);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleScan}
      disabled={isScanning || isProcessing}
      className="w-full"
    >
      {isScanning ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Opening Camera...
        </>
      ) : isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Extracting Data...
        </>
      ) : (
        <>
          <Camera className="w-4 h-4 mr-2" />
          Scan Receipt
        </>
      )}
    </Button>
  );
};
