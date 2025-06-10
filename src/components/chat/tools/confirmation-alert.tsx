import { Check, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ConfirmationAlertProps {
  message?: string;
  isAnswered?: boolean;
  result?: boolean;
  onConfirm?: () => void;
  onDecline?: () => void;
}

export function ConfirmationAlert({
  message = "Confirm action?",
  isAnswered,
  result,
  onConfirm,
  onDecline,
}: ConfirmationAlertProps) {
  return (
    <Alert className="mb-4 bg-white dark:bg-black border-emerald-500/50 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <AlertDescription className="dark:text-white">
            {message}
            {isAnswered && (
              <span className="ml-2 text-sm font-medium dark:text-white">
                {result ? "✓ Confirmed" : "✗ Declined"}
              </span>
            )}
          </AlertDescription>
        </div>
        {!isAnswered && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onConfirm}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <Check className="h-4 w-4 mr-2" />
              Yes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDecline}
              className="bg-white hover:bg-gray-100 dark:bg-black dark:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              No
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
}
