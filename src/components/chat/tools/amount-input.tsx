"use client";

import { ChangeEvent, useState } from "react";

import { motion } from "framer-motion";
import { CloudLightning, CreditCard, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

import { cn } from "@/lib/utils";

interface AmountInputProps {
  onSubmit: (amount: string) => void;
  disabled?: boolean;
  result?: string;
  maxAmount?: string;
  tokenSymbol?: string;
}

export function AmountInput({
  onSubmit,
  disabled,
  result,
  maxAmount,
  tokenSymbol,
}: AmountInputProps) {
  const styles = {
    border: "border-indigo-300/30 dark:border-indigo-500/30",
    background: "bg-indigo-50/80 dark:bg-indigo-900/30",
    highlight: "text-indigo-900 dark:text-indigo-100 font-semibold",
  };
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [percentValue, setPercentValue] = useState<number[]>([0]);
  const maxAmountValue = maxAmount ? parseFloat(maxAmount) : 0;

  // Update amount when slider changes
  const handleSliderChange = (value: number[]) => {
    if (!maxAmount) return;

    const percent = value[0];
    setPercentValue(value);

    // Calculate amount based on percentage of maxAmount
    const calculatedAmount = ((percent / 100) * maxAmountValue).toFixed(6);
    setAmount(calculatedAmount);
    setError("");
  };

  // Update slider when amount changes directly
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    setError("");

    // Update slider position if valid number and maxAmount exists
    if (newAmount && maxAmount && !isNaN(parseFloat(newAmount))) {
      const newPercentage = Math.min(
        100,
        Math.round((parseFloat(newAmount) / maxAmountValue) * 100)
      );
      setPercentValue([newPercentage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount) {
      if (maxAmount && parseFloat(amount) > parseFloat(maxAmount)) {
        setError(
          `Amount exceeds your balance of ${maxAmount} ${tokenSymbol || ""}`
        );
        return;
      }
      setError("");
      onSubmit(amount);
    }
  };

  // Set to maximum amount
  const setMaxAmount = () => {
    if (maxAmount) {
      setAmount(maxAmount);
      setPercentValue([100]);
      setError("");
    }
  };

  if (result) {
    return (
      <Card
        className={cn(
          "mb-4 relative overflow-hidden z-0 bg-white dark:bg-black rounded-lg shadow",
          styles.border
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-indigo-200/20 to-indigo-100/10 dark:from-indigo-900/20 dark:via-indigo-800/10 dark:to-indigo-900/5 z-0"></div>
        <CardHeader
          className={cn(
            "px-3 py-2 border-b relative z-10",
            styles.background,
            styles.border
          )}
        >
          <CardTitle
            className={cn(
              "text-sm font-medium flex items-center gap-1.5",
              styles.highlight
            )}
          >
            <div className="p-1.5 rounded-md bg-indigo-200 dark:bg-indigo-800">
              <CreditCard className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
            </div>
            Amount Selected
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 px-3 py-2">
          <div className="flex items-center gap-3 px-3 py-3 bg-white/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200/60 dark:border-indigo-700/40">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-7 h-7 rounded-full bg-indigo-200 dark:bg-indigo-700 flex items-center justify-center"
            >
              <DollarSign className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
            </motion.div>
            <span className="text-lg font-semibold text-indigo-900 dark:text-indigo-50">
              {result}{" "}
              {tokenSymbol && (
                <span className="text-indigo-600 dark:text-indigo-300 text-sm ml-1 font-medium">
                  {tokenSymbol}
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "mb-4 relative overflow-hidden bg-white dark:bg-black rounded-lg shadow",
        styles.border
      )}
    >
      <CardHeader
        className={cn("px-3 py-2 border-b relative z-10", styles.border)}
      >
        <CardTitle
          className={cn(
            "text-sm font-medium flex items-center gap-3",
            styles.highlight
          )}
        >
          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40">
            <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          Enter Amount
        </CardTitle>
        {maxAmount && (
          <motion.p
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors pl-10 font-medium"
            onClick={disabled ? undefined : setMaxAmount}
          >
            Available balance:{" "}
            <span className="font-semibold ml-1 bg-indigo-100/80 dark:bg-indigo-700/50 px-1.5 py-0.5 rounded border border-indigo-200/80 dark:border-indigo-600/60 text-indigo-800 dark:text-indigo-100">
              {maxAmount} {tokenSymbol}
            </span>
            <span className="flex items-center text-[10px] ml-2 text-indigo-600 dark:text-indigo-300 font-medium">
              <CloudLightning className="h-3 w-3 mr-0.5" />
              (click to use max)
            </span>
          </motion.p>
        )}
      </CardHeader>

      <CardContent className="relative z-10 pt-3 px-3 pb-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              className="flex-1 bg-white/80 dark:bg-indigo-900/20 border-indigo-200/60 dark:border-indigo-700/40 focus-visible:ring-indigo-500"
              disabled={disabled}
              max={maxAmount}
            />
            <Button
              type="submit"
              disabled={disabled || !amount}
              className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white border-none"
            >
              Submit
            </Button>
          </div>

          {maxAmount && parseFloat(maxAmount) > 0 && (
            <div className="w-full px-4 py-4 bg-white/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200/40 dark:border-indigo-700/30 mt-2">
              <Slider
                value={percentValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                disabled={disabled}
                className="[&>[role=slider]]:bg-indigo-600 [&>[role=slider]]:border-indigo-600 [&>span]:bg-indigo-600/50"
              />
              <div className="relative w-full h-6 mt-2">
                {[0, 25, 50, 75, 100].map(percent => {
                  let leftPosition = `${percent}%`;
                  if (percent === 0) leftPosition = `8px`;
                  if (percent === 100) leftPosition = `calc(100% - 8px)`;
                  return (
                    <div
                      key={percent}
                      className="absolute transform -translate-x-1/2"
                      style={{
                        left: leftPosition,
                      }}
                    >
                      <div
                        className={`w-1 h-2 mx-auto ${
                          percentValue[0] >= percent
                            ? "bg-indigo-500 dark:bg-indigo-400"
                            : "bg-indigo-200 dark:bg-indigo-700"
                        }`}
                      ></div>
                      <div
                        className={`text-xs mt-1 ${
                          percentValue[0] >= percent
                            ? "text-indigo-700 dark:text-indigo-300 font-medium"
                            : "text-indigo-400 dark:text-indigo-500"
                        }`}
                      >
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 mt-1 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800/40"
            >
              {error}
            </motion.p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}