import { FC, Fragment, useCallback, useState } from "react";

import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Address } from "viem";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cn, formatNumber, getModeStyling } from "@/lib/utils";

import { useChat } from "@/contexts/chat-context";

import { TransactionCard } from "./transaction-card";

interface TransactionDataBase {
  to: Address;
  data: Address; // Transaction data is also a hex string
  value: string; // Value is typically represented as a string
  functionName?: string;
  functionSignature?: string;
  description?: string;
}

interface ParsedResult {
  transactionData: TransactionDataBase;
  approvalTransactions?: TransactionDataBase[];
  simulation?: {
    // Aave specific
    market?: string;
    operations?: {
      type: string;
      token: string;
      function: string;
    }[];
    // Morpho Vault specific
    vault?: Address;
    operationType?: string;
    walletBalance?: string;
    apyPercent?: number;
    projectedMonthlyEarnings?: string;
    projectedYearlyEarnings?: string;
    vaultName?: string;
    vaultSymbol?: string;
    curatorName?: string;
    // Common
    asset?: {
      token: string;
      address: Address;
      amount: string;
      decimals: number;
    };
    message?: string;
  };
  chainId?: string;
}

// Define the expected type for onAddAssistantMessage based on TransactionCard's needs
// Updated to match the specific expected type
type AddAssistantMessagePayload = {
  id: string;
  content: string;
  role: "assistant";
};

interface MultiStepTransactionHandlerProps {
  parsedResult: ParsedResult;
  toolCallId: string;
  messageMode?: string;
  onAddAssistantMessage?: (payload: AddAssistantMessagePayload) => void; // Keep it optional here
}

// Default empty function for onAddAssistantMessage if not provided
const defaultOnAddAssistantMessage = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: AddAssistantMessagePayload
) => {};

export const MultiStepTransactionHandler: FC<
  MultiStepTransactionHandlerProps
> = ({
  parsedResult,
  toolCallId,
  messageMode = "morpheus",
  onAddAssistantMessage = defaultOnAddAssistantMessage, // Provide default function
}) => {
  const {
    transactionData,
    approvalTransactions = [],
    simulation,
  } = parsedResult;
  const totalSteps = approvalTransactions.length + 1; // Approvals + final transaction
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<any[]>([]); // Store results of each step
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { addToolResult } = useChat();
  const modeStyles = getModeStyling(messageMode);

  // Safely parse chainId
  const numericChainId = parseInt(parsedResult.chainId || "1", 10); // Default to 1 (Ethereum Mainnet) if undefined
  const chainIdToUse = isNaN(numericChainId) ? 1 : numericChainId; // Use default if parsing fails

  const handleStepComplete = useCallback(
    (stepResult: any) => {
      setStepResults(prev => [...prev, stepResult]);
      const nextStepIndex = currentStepIndex + 1;

      if (stepResult?.error) {
        setError(`Error in step ${currentStepIndex + 1}: ${stepResult.error}`);
        return;
      }

      if (nextStepIndex < totalSteps) {
        setCurrentStepIndex(nextStepIndex);
      } else {
        // All steps completed, call the final addToolResult
        addToolResult?.({
          toolCallId,
          result: {
            // Structure the final result as needed
            finalTransactionResult: stepResult, // Result of the last step (main tx)
            approvalResults: stepResults.slice(0, -1), // Results of approvals
          },
        });
        setIsComplete(true);
      }
    },
    [currentStepIndex, totalSteps, addToolResult, toolCallId, stepResults]
  );

  const currentTransaction =
    currentStepIndex < approvalTransactions.length
      ? approvalTransactions[currentStepIndex]
      : transactionData;

  const getStepTitle = (index: number) => {
    if (index < approvalTransactions.length) {
      return `Step ${index + 1}/${totalSteps}: Approval ${index + 1}`;
    }
    return `Step ${index + 1}/${totalSteps}: Execute Transaction`;
  };

  const renderSimulationDetails = () => {
    if (!simulation) return null;

    const isMorphoVault = simulation.vault && simulation.operationType;

    return (
      <Alert className={cn("mb-4", modeStyles.background, modeStyles.border)}>
        <Info className={cn("h-4 w-4", modeStyles.text)} />
        <AlertDescription className={cn("space-y-1", modeStyles.text)}>
          <strong className={cn("font-medium", modeStyles.highlight)}>
            Transaction Summary
          </strong>
          {/* Main simulation message */}
          {simulation.message && (
            <div className="text-sm mt-1">{simulation.message}</div>
          )}
          {/* Morpho Vault Details */}
          {isMorphoVault && (
            <div
              className="text-xs space-y-1 pt-2 mt-2 border-t border-[var(--border-color)]"
              style={{
                borderColor: modeStyles.border
                  .split(" ")
                  .pop()
                  ?.replace("border-", "")
                  ? `var(--color-${modeStyles.border.split(" ").pop()?.replace("border-", "")})`
                  : "currentColor",
              }}
            >
              {simulation.vaultName && (
                <div className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Vault:
                  </strong>
                  <span>
                    {simulation.vaultName} ({simulation.vaultSymbol})
                  </span>
                </div>
              )}
              {simulation.curatorName && (
                <div className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Curator:
                  </strong>
                  <span>{simulation.curatorName}</span>
                </div>
              )}
              {simulation.apyPercent !== undefined &&
                simulation.apyPercent !== null && (
                  <div className="flex justify-between">
                    <strong className={cn("font-semibold", modeStyles.subtle)}>
                      Est. APY:
                    </strong>
                    <span>{formatNumber(simulation.apyPercent, 2)}%</span>
                  </div>
                )}
              {simulation.walletBalance && (
                <div className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Your Balance:
                  </strong>
                  <span>
                    {formatNumber(simulation.walletBalance)}{" "}
                    {simulation.asset?.token.toUpperCase()}
                  </span>
                </div>
              )}
              {simulation.projectedMonthlyEarnings && (
                <div className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Est. Monthly:
                  </strong>
                  <span>
                    ${formatNumber(simulation.projectedMonthlyEarnings, 2)}
                  </span>
                </div>
              )}
              {simulation.projectedYearlyEarnings && (
                <div className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Est. Yearly:
                  </strong>
                  <span>
                    ${formatNumber(simulation.projectedYearlyEarnings, 2)}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Aave Market Details */}
          {!isMorphoVault && simulation.market && (
            <div
              className="text-xs space-y-1 pt-2 mt-2 border-t border-[var(--border-color)]"
              style={{
                borderColor: modeStyles.border
                  .split(" ")
                  .pop()
                  ?.replace("border-", "")
                  ? `var(--color-${modeStyles.border.split(" ").pop()?.replace("border-", "")})`
                  : "currentColor",
              }}
            >
              <div className="flex justify-between">
                <strong className={cn("font-semibold", modeStyles.subtle)}>
                  Market:
                </strong>
                <span>{simulation.market}</span>
              </div>
              {/* Render operations if they exist */}
              {simulation.operations?.map((op, idx) => (
                <div key={idx} className="flex justify-between">
                  <strong className={cn("font-semibold", modeStyles.subtle)}>
                    Operation {idx + 1}:
                  </strong>
                  <span>
                    {op.type} {op.token}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-4">
      {renderSimulationDetails()}

      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(currentStepIndex)}</CardTitle>
          {currentTransaction.description && (
            <CardDescription>{currentTransaction.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isComplete ? (
            <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                All steps completed successfully!
              </p>
            </div>
          ) : (
            !error && (
              <TransactionCard
                key={currentStepIndex}
                data={currentTransaction.data}
                to={currentTransaction.to}
                chainId={chainIdToUse} // Pass parsed numeric chainId
                value={currentTransaction.value}
                onSubmit={handleStepComplete} // Use onSubmit to signal step completion
                onAddAssistantMessage={onAddAssistantMessage} // Pass down the potentially defaulted function
                messageMode={messageMode} // Pass mode down to TransactionCard
              />
            )
          )}
        </CardContent>
      </Card>

      {/* Optional: Display progress/status */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Fragment key={index}>
            <div
              className={cn(
                `flex items-center`,
                index <= currentStepIndex && !error ? modeStyles.text : ""
              )}
            >
              {index < stepResults.length && !stepResults[index]?.error ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : error && index === currentStepIndex ? (
                <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <div
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    index === currentStepIndex && !isComplete
                      ? `${modeStyles.ring === "ring-indigo-500" ? "bg-indigo-500" : "bg-emerald-500"} animate-pulse`
                      : index < currentStepIndex || isComplete
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
              )}
              Step {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
