import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TrialBanner = () => {
  const { isTrialActive, trialDaysRemaining, plan } = useSubscription();
  const navigate = useNavigate();

  if (!isTrialActive() || plan !== "free") return null;

  const daysLeft = trialDaysRemaining();

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">Trial Period Active</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          You have <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> remaining in your trial. 
          Upgrade now to unlock all features.
        </span>
        <Button 
          size="sm" 
          className="ml-4"
          onClick={() => navigate('/#pricing')}
        >
          <Zap className="mr-2 h-4 w-4" />
          Upgrade Now
        </Button>
      </AlertDescription>
    </Alert>
  );
};
