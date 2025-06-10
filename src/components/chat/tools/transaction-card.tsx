"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { generateId } from "ai";
import {
  CheckCircle,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  Address,
  Hex,
  RawContractError,
  RpcError,
  TransactionExecutionError,
  UserRejectedRequestError,
} from "viem";
import { usePublicClient, useSendTransaction, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";

import {
  BLOCK_EXPLORER_URLS,
  chainIdToName,
  getChainImagePath,
} from "@/lib/chains";

import { useChat } from "@/contexts/chat-context";

interface TransactionCardProps {
  data: Hex;
  to: Address;
  chainId: number;
  value?: string;
  onSubmit: (txHash: Hex) => void;
  onConfirm?: (txHash: Hex) => void;
  onAddAssistantMessage: (payload: {
    id: string;
    content: string;
    role: "assistant";
  }) => void;
  messageMode?: string;
  simulation?: any; // Add simulation prop
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  data,
  to,
  chainId,
  value,
  onSubmit,
  onConfirm,
  onAddAssistantMessage,
  messageMode,
  simulation,
}) => {
  const { sendTransactionAsync, isSuccess, isPending } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const { activeMode } = useChat();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Prioritize the specific messageMode passed from the parent (from the original message)
  // rather than using the global activeMode which can change
  const currentMode = messageMode || activeMode;
  const colorScheme = currentMode === "sentinel" ? "indigo" : "emerald";

  useEffect(() => {
    if (isPending) {
      setStatus("pending");
    } else if (isSuccess) {
      setStatus("success");
    } else if (errorMessage) {
      setStatus("error");
    } else {
      setStatus("idle");
    }
  }, [isPending, isSuccess, errorMessage]);

  const getBlockExplorerUrl = (hash: Hex) => {
    const baseUrl = BLOCK_EXPLORER_URLS[chainIdToName[chainId].toLowerCase()];
    if (!baseUrl) {
      console.warn(`No block explorer URL configured for chain: ${chainId}`);
      return "#";
    }
    return `${baseUrl}/tx/${hash}`;
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await switchChainAsync({
        chainId,
      });
      const hash = await sendTransactionAsync({
        to,
        data,
        value: value ? BigInt(value) : undefined,
      });
      setTxHash(hash);
      onSubmit(hash);
      await publicClient!.waitForTransactionReceipt({ hash });
      onConfirm?.(hash);
    } catch (error: any) {
      console.warn("Transaction send error:", error);

      let errorMessageText = "An unexpected error occurred.";
      if (
        error instanceof UserRejectedRequestError ||
        error.message?.toLowerCase().includes("user rejected")
      ) {
        errorMessageText =
          "Transaction was rejected. Please approve the transaction in your wallet to proceed.";
      } else if (error instanceof RpcError) {
        errorMessageText =
          "Error communicating with the blockchain network. Please check your network connection and try again.";
      } else if (error instanceof TransactionExecutionError) {
        if (error.cause instanceof RawContractError) {
          const revertReason = error.cause.message;
          errorMessageText = revertReason
            ? `Transaction failed on the blockchain with reason: ${revertReason}. Please check transaction details and try again.`
            : "Transaction execution failed on the blockchain (contract revert). Please check transaction details and try again.";
        } else if (error.cause instanceof RpcError) {
          errorMessageText =
            "Error communicating with the blockchain network. Please check your network connection and try again.";
        } else {
          errorMessageText =
            "Transaction failed on the blockchain. Please check your wallet and network, and try again.";
        }
      } else {
        errorMessageText =
          "An unexpected error occurred while sending the transaction. Please try again.";
      }

      setErrorMessage(errorMessageText);
      setStatus("error");
      onAddAssistantMessage({
        id: generateId(),
        content: errorMessageText,
        role: "assistant",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    idle: {
      bg: `bg-${colorScheme}-500 hover:bg-${colorScheme}-600`,
      text: `text-white`,
    },
    pending: {
      bg: `bg-${colorScheme}-500/90`,
      text: `text-white`,
    },
    success: {
      bg: `bg-${colorScheme}-600`,
      text: `text-white`,
    },
    error: {
      bg: `bg-red-500 hover:bg-red-600`,
      text: `text-white`,
    },
  };

  const renderOperationSpecificDetails = () => {
    switch (simulation.operationType?.toLowerCase()) {
      case "supply":
      case "borrow":
      case "repay":
      case "withdraw":
      case "deposit":
        return (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">APY:</span>{" "}
              {simulation.apyPercent
                ? `${simulation.apyPercent.toFixed(2)}%`
                : "N/A"}
            </div>
            {simulation.projectedYearlyEarnings && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Projected Yearly Earnings:</span>{" "}
                {simulation.projectedYearlyEarnings}{" "}
                {simulation.asset?.token?.toUpperCase()}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3" onClick={e => e.stopPropagation()}>
      {/* Header with Chain & Value */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded-full">
            <Image
              src={getChainImagePath(chainIdToName[chainId])}
              alt={`${chainIdToName[chainId]} chain`}
              width={14}
              height={14}
              className="object-contain"
            />
            <span className="capitalize text-sm font-medium">
              {chainIdToName[chainId]}
            </span>
          </div>
        </div>

        {value && (
          <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded-full">
            {value} ETH
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {status !== "idle" && (
        <div
          className={`rounded-md p-2 flex items-center gap-2 ${
            status === "pending"
              ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
              : status === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          }`}
        >
          {status === "pending" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "success" && <CheckCircle className="h-4 w-4" />}
          {status === "error" && <XCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {status === "pending"
              ? "Transaction in progress..."
              : status === "success"
                ? "Transaction successful"
                : "Transaction failed"}
          </span>
        </div>
      )}

      {/* Address Section */}
      <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/30 rounded-md p-2.5">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Recipient Address
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-sm truncate">{to}</span>
            <button
              onClick={() => copyToClipboard(to)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {copied ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {txHash && (
          <a
            href={getBlockExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-${colorScheme}-600 dark:text-${colorScheme}-400 hover:opacity-80 flex items-center gap-1.5`}
          >
            <span className="text-sm">View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Action Button */}
      <Button
        className={`w-full py-2.5 text-sm font-medium rounded-md shadow-sm transition-all ${statusColors[status].bg} ${statusColors[status].text}`}
        onClick={handleConfirm}
        disabled={isPending || isSuccess}
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : isSuccess ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Successful</span>
          </div>
        ) : (
          <span>Confirm Transaction</span>
        )}
      </Button>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-sm p-2.5 rounded-md bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Transaction Details Toggle */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <span>Transaction Details</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expandable Transaction Details */}
        {showDetails && (
          <div className="mt-2 p-2.5 rounded-md bg-gray-50 dark:bg-gray-800/30 space-y-2">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Transaction Data
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-sm break-all">{data}</span>
                <button
                  onClick={() => copyToClipboard(data)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {txHash && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Transaction Hash
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-sm">{txHash}</span>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {renderOperationSpecificDetails()}
          </div>
        )}
      </div>
    </div>
  );
};
