import React from "react";

import { CheckCircle2, Crown } from "lucide-react";

import { Label } from "@/components/ui/label";

export const PremiumBenefits: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <Label className="text-base font-medium flex items-center">
          <Crown className="h-4 w-4 mr-2 text-amber-500" />
          Premium Benefits
        </Label>
        <p className="text-sm text-muted-foreground mt-2">
          Your subscription includes these features
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 mt-0.5" />
          <span>Unlimited requests per day</span>
        </div>
        <div className="flex items-start">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 mt-0.5" />
          <span>All premium data sources</span>
        </div>
        <div className="flex items-start">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 mt-0.5" />
          <span>Multi-model access</span>
        </div>
        <div className="flex items-start">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 mt-0.5" />
          <span>Priority support</span>
        </div>
      </div>
    </div>
  );
};

export default PremiumBenefits;
