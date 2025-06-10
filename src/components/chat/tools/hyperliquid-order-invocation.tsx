"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { OrderParameters } from "@nktkas/hyperliquid";
import Fuse from "fuse.js";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { type ControllerRenderProps, useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { z } from "zod";

import TradingViewWidget from "@/components/shared/TradingViewWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { useHyperliquidClient } from "@/hooks/use-hyperliquid-client";

const formSchema = z.object({
  market: z.string().min(1, "Market is required"),
  size: z.string().min(1, "Size is required"),
  isBuy: z.boolean(),
  orderType: z.enum(["limit", "market"]),
  price: z.string().optional().nullable(),
  timeInForce: z.enum(["Alo", "Ioc", "Gtc"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type FieldProps<T extends keyof FormValues> = ControllerRenderProps<
  FormValues,
  T
>;

interface HyperliquidOrderInvocationProps {
  onComplete: (result: any) => void;
  args?: {
    market?: string;
    size?: string;
    isBuy?: boolean;
    orderType?: "limit" | "market";
    price?: string | null;
    timeInForce?: "Alo" | "Ioc" | "Gtc";
  };
}

export function HyperliquidOrderInvocation({
  onComplete,
  args,
}: HyperliquidOrderInvocationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([0]);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [allMids, setAllMids] = useState<Record<string, string>>({});
  const {
    publicClient,
    walletClientHL,
    markets,
    isLoading: isLoadingClients,
    error: clientError,
    approveAgentIfNeeded,
    getMarketIndex,
  } = useHyperliquidClient();
  const [calculatedOrderValue, setCalculatedOrderValue] = useState<
    number | null
  >(null);
  const [isOrderValueValid, setIsOrderValueValid] = useState<boolean>(true);
  const [calculatedContractSize, setCalculatedContractSize] = useState<
    string | null
  >(null);
  const [leverageValue, setLeverageValue] = useState<number[]>([1]);
  const [currentMaxLeverage, setCurrentMaxLeverage] = useState<number>(10);
  const [isUpdatingLeverage, setIsUpdatingLeverage] = useState(false);
  const [leverageSuccess, setLeverageSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { isConnected, address } = useAccount();

  const fuse = useMemo(() => {
    return new Fuse(markets || [], {
      keys: ["name"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return markets || [];
    const normalizedQuery = searchQuery.replace(/[\$\@\#]/g, "");
    const results = fuse.search(normalizedQuery);
    return results.map(result => result.item);
  }, [fuse, markets, searchQuery]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      market: undefined,
      size: args?.size || "",
      isBuy: args?.isBuy !== undefined ? args.isBuy : true,
      orderType: args?.orderType || "limit",
      timeInForce: args?.timeInForce || "Gtc",
      price: args?.price || "",
    },
  });

  useEffect(() => {
    const fetchMids = async () => {
      if (!publicClient) return;
      try {
        const midsResponse = await publicClient.allMids();
        setAllMids(midsResponse);
      } catch (err) {
        console.error("Failed to fetch mids:", err);
      }
    };
    fetchMids();
  }, [publicClient]);

  useEffect(() => {
    if (
      isLoadingClients ||
      markets.length === 0 ||
      Object.keys(allMids).length === 0
    )
      return;

    let marketToSet = form.getValues("market");

    if (args?.market && !marketToSet) {
      // First, check for an exact match
      const exactMatch = markets.find(m => m.name === args.market);
      if (exactMatch) {
        marketToSet = exactMatch.name;
        console.log("🚀 ~ useEffect ~ Found exact market match:", marketToSet);
      } else {
        // If no exact match, perform fuzzy search
        const fuseSearch = new Fuse(markets, {
          keys: ["name"],
          threshold: 0.3,
          ignoreLocation: true,
        });
        const results = fuseSearch.search(args.market);
        console.log("🚀 ~ useEffect ~ Fuse search results:", results);
        if (results.length > 0) {
          marketToSet = results[0].item.name;
          console.log(
            "🚀 ~ useEffect ~ Found fuzzy market match:",
            marketToSet
          );
        }
      }
    }

    if (!marketToSet) {
      const btcMarket = markets.find(m => m.name === "BTC");
      if (btcMarket) {
        marketToSet = btcMarket.name;
      }
    }

    if (marketToSet) {
      form.setValue("market", marketToSet);
      const midPrice = allMids[marketToSet];
      if (midPrice) {
        setCurrentPrice(midPrice);
        if (form.getValues("orderType") === "limit" && !args?.price) {
          form.setValue("price", midPrice);
        }
      }
    } else if (markets.length > 0 && !marketToSet) {
      marketToSet = markets[0].name;
      form.setValue("market", marketToSet);
      const midPrice = allMids[marketToSet];
      if (midPrice) {
        setCurrentPrice(midPrice);
        if (form.getValues("orderType") === "limit" && !args?.price) {
          form.setValue("price", midPrice);
        }
      }
    }
  }, [isLoadingClients, markets, allMids, args?.market, args?.price, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "market" && value.market && allMids[value.market]) {
        const midPrice = allMids[value.market];
        setCurrentPrice(midPrice);
        if (form.getValues("orderType") === "limit") {
          form.setValue("price", midPrice);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, allMids]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "orderType" && value.orderType === "limit" && currentPrice) {
        form.setValue("price", currentPrice);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentPrice]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!isConnected || !address || !publicClient) return;
      try {
        const clearinghouse = await publicClient.clearinghouseState({
          user: address,
        });
        const accountValue = clearinghouse.crossMarginSummary?.accountValue;
        if (accountValue) {
          setUserBalance(accountValue);
        }
      } catch (err) {
        console.error("Failed to fetch user balance:", err);
      }
    };
    fetchUserBalance();
  }, [isConnected, address, publicClient]);

  const handleSliderChange = (value: number[]) => {
    if (!userBalance) return;
    const percent = value[0];
    setSliderValue(value);
    const calculatedAmount = (
      (percent / 100) *
      parseFloat(userBalance)
    ).toFixed(6);
    form.setValue("size", calculatedAmount);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = e.target.value;
    if (newSize && userBalance && !isNaN(parseFloat(newSize))) {
      const newPercentage = Math.min(
        100,
        Math.round((parseFloat(newSize) / parseFloat(userBalance)) * 100)
      );
      setSliderValue([newPercentage]);
    }
  };

  const setMaxAmount = () => {
    if (userBalance) {
      form.setValue("size", userBalance);
      setSliderValue([100]);
    }
  };

  const sizeValue = form.watch("size");
  const marketValue = form.watch("market");
  const priceValue = form.watch("price");

  useEffect(() => {
    const size = parseFloat(form.getValues("size") || "0");
    const selectedMarket = markets.find(
      m => m.name === form.getValues("market")
    );
    const price = parseFloat(form.getValues("price") || currentPrice || "0");

    if (size) {
      setCalculatedOrderValue(size);
      setIsOrderValueValid(size >= 10);
      if (price > 0 && selectedMarket) {
        const rawContractSize = size / price;
        setCalculatedContractSize(
          rawContractSize.toFixed(selectedMarket.szDecimals)
        );
      } else {
        setCalculatedContractSize(null);
      }
    } else {
      setCalculatedOrderValue(null);
      setCalculatedContractSize(null);
      setIsOrderValueValid(true);
    }
  }, [sizeValue, marketValue, priceValue, form, markets, currentPrice]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "market" && value.market) {
        const selectedMarket = markets.find(m => m.name === value.market);
        if (selectedMarket) {
          const maxLeverage = (selectedMarket as any).maxLeverage || 10;
          setCurrentMaxLeverage(maxLeverage);
          setLeverageValue([1]);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, markets]);

  const handleUpdateLeverage = async () => {
    if (!isConnected) {
      setError("Wallet not connected");
      return;
    }

    setIsUpdatingLeverage(true);
    setError(null);
    setLeverageSuccess(null);

    try {
      const agentClient = await approveAgentIfNeeded();

      const currentMarketName = form.getValues("market");
      const marketIndex = getMarketIndex(currentMarketName);

      if (marketIndex === undefined) {
        throw new Error(`Market index not found for ${currentMarketName}`);
      }

      console.log("Preparing to update leverage with parameters:", {
        asset: marketIndex,
        leverage: leverageValue[0],
        isCross: true,
      });

      const result = await agentClient.updateLeverage({
        asset: marketIndex,
        leverage: leverageValue[0],
        isCross: true,
      });

      console.log("Leverage updated successfully:", result);
      setLeverageSuccess(
        `Leverage updated to ${leverageValue[0]}x successfully`
      );
    } catch (err) {
      console.error("Failed to update leverage:", err, (err as any).stack);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update leverage";
      setError(errorMsg);
      if (clientError) {
        setError(`${errorMsg}. Client Error: ${clientError}`);
      }
    } finally {
      setIsUpdatingLeverage(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!isConnected) {
      setError("Wallet not connected");
      return;
    }

    const orderSize = parseFloat(data.size);
    const orderPrice = parseFloat(data.price || "0");

    if (orderSize < 10) {
      setError("Order must have minimum value of $10");
      return;
    }
    if (data.orderType === "limit" && !orderPrice) {
      setError("Price is required for limit orders");
      return;
    }
    const effectivePrice = orderPrice || parseFloat(currentPrice || "0");
    if (!effectivePrice) {
      setError("Cannot determine price for order calculation");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const agentClient = await approveAgentIfNeeded();

      const marketIndex = getMarketIndex(data.market);
      const selectedMarket = markets.find(m => m.name === data.market);

      if (marketIndex === undefined || !selectedMarket) {
        throw new Error(`Market data not found for ${data.market}`);
      }

      const rawContractSize = orderSize / effectivePrice;
      const scaledContractSize = rawContractSize.toFixed(
        selectedMarket.szDecimals
      );

      console.log(
        `Market ${selectedMarket.name} has szDecimals: ${selectedMarket.szDecimals}`
      );
      console.log(`Raw contract size: ${rawContractSize}`);
      console.log(`Scaled contract size: ${scaledContractSize}`);

      const order: Partial<OrderParameters["orders"][number]> = {
        a: marketIndex,
        b: data.isBuy,
        s: scaledContractSize,
        r: false,
        p: effectivePrice.toString(),
      };

      if (data.orderType === "limit") {
        order.t = {
          limit: {
            tif: data.timeInForce || "Gtc",
          },
        };
      } else if (data.orderType === "market") {
        order.t = {
          trigger: {
            isMarket: true,
            triggerPx: effectivePrice.toString(),
            tpsl: "tp",
          },
          limit: {
            tif: "Gtc",
          },
        };
      }

      const orderParams: OrderParameters = {
        orders: [order as OrderParameters["orders"][number]],
        grouping: "na",
      };

      console.log("Placing order with parameters:", orderParams);

      const result = await agentClient.order(orderParams);

      setSuccess("Order placed successfully");

      const resultText = JSON.stringify(result);

      onComplete(resultText);
    } catch (err) {
      console.error("Failed to place order:", err, (err as any).stack);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to place order";
      setError(errorMsg);
      if (clientError) {
        setError(`${errorMsg}. Client Error: ${clientError}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingClients) {
    return (
      <Card className="mb-4">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Loading Hyperliquid client...</span>
        </CardContent>
      </Card>
    );
  }

  if (clientError && !walletClientHL) {
    return (
      <Card className="mb-4 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Client Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{clientError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Please ensure your wallet is connected to the Arbitrum network and
            refresh.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Create Hyperliquid Perps Order</CardTitle>
        {args &&
          Object.keys(args).some(
            key => args[key as keyof typeof args] !== undefined
          ) && (
            <p className="text-xs text-muted-foreground mt-1">
              AI has suggested some values for your order
            </p>
          )}
      </CardHeader>
      <CardContent>
        {form.watch("market") && (
          <div className="mb-6">
            <TradingViewWidget
              symbol={
                form.watch("market").startsWith("k")
                  ? form.watch("market").slice(1)
                  : form.watch("market")
              }
              showDateRanges={true}
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="market"
              render={({ field }: { field: FieldProps<"market"> }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Market</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={markets.length === 0}
                        >
                          {field.value
                            ? markets.find(
                                market => market.name === field.value
                              )?.name
                            : "Select a market"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search market..."
                          onValueChange={setSearchQuery}
                        />
                        <CommandEmpty>No market found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {filteredMarkets.map(market => (
                              <CommandItem
                                key={market.index}
                                value={market.name}
                                onSelect={() => {
                                  form.setValue("market", market.name);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    market.name === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {market.name}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Select the market to trade</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }: { field: FieldProps<"size"> }) => (
                <FormItem>
                  <FormLabel className="flex justify-between">
                    <span>Size (USD)</span>
                    {userBalance && (
                      <span
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={setMaxAmount}
                      >
                        Balance: {parseFloat(userBalance).toFixed(4)} (click for
                        max)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter order size in USD"
                      {...field}
                      onChange={e => {
                        field.onChange(e);
                        handleSizeChange(e);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  {userBalance && (
                    <div className="mt-2">
                      <Slider
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="mb-2"
                      />
                      <div className="relative w-full h-6">
                        {[0, 25, 50, 75, 100].map(percent => (
                          <div
                            key={percent}
                            className="absolute transform -translate-x-1/2"
                            style={{ left: `${percent}%` }}
                          >
                            <div className="w-1 h-2 bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {percent}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {calculatedOrderValue !== null && (
                    <div
                      className={`text-xs mt-2 ${
                        isOrderValueValid
                          ? "text-muted-foreground"
                          : "text-red-500"
                      }`}
                    >
                      Order value (USD): ${calculatedOrderValue.toFixed(2)}{" "}
                      {!isOrderValueValid && "(Minimum $10 required)"}
                    </div>
                  )}
                  {calculatedContractSize && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      Contract size: {calculatedContractSize}
                    </div>
                  )}
                  <FormDescription>Enter the order size in USD</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isBuy"
                render={({ field }: { field: FieldProps<"isBuy"> }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Order Side</FormLabel>
                      <FormDescription>
                        Toggle between long and short
                      </FormDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          !field.value
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Short
                      </span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span
                        className={`text-xs ${
                          field.value
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        Long
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }: { field: FieldProps<"orderType"> }) => (
                  <FormItem>
                    <FormLabel>Order Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                      </SelectContent>
                    </Select>
                    {currentPrice && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Current price:{" "}
                        <span className="font-medium">{currentPrice}</span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("orderType") === "limit" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }: { field: FieldProps<"price"> }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={currentPrice || "Enter price"}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeInForce"
                  render={({ field }: { field: FieldProps<"timeInForce"> }) => (
                    <FormItem>
                      <FormLabel>Time in Force</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time in force" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gtc">
                            Good till cancelled
                          </SelectItem>
                          <SelectItem value="Ioc">
                            Immediate or cancel
                          </SelectItem>
                          <SelectItem value="Alo">
                            Allow liquidity only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="mt-4 border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="text-sm font-medium">
                  Leverage: {leverageValue[0]}x
                </FormLabel>
                <span className="text-xs text-muted-foreground">
                  Max: {currentMaxLeverage}x
                </span>
              </div>
              <Slider
                value={leverageValue}
                onValueChange={setLeverageValue}
                max={currentMaxLeverage}
                min={1}
                step={1}
                className="mb-2"
              />
              <div className="relative w-full h-6 mb-2">
                {[
                  1,
                  ...[0.25, 0.5, 0.75, 1].map(f =>
                    Math.round(currentMaxLeverage * f)
                  ),
                ]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .sort((a, b) => a - b)
                  .map(level => (
                    <div
                      key={level}
                      className="absolute transform -translate-x-1/2"
                      style={{
                        left: `${
                          ((level - 1) /
                            (currentMaxLeverage > 1
                              ? currentMaxLeverage - 1
                              : 1)) *
                          100
                        }%`,
                      }}
                    >
                      <div className="w-1 h-2 bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {level}x
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpdateLeverage}
                  disabled={isUpdatingLeverage || !isConnected}
                >
                  {isUpdatingLeverage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Leverage"
                  )}
                </Button>
              </div>
              {leverageSuccess && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-green-600 text-xs">
                  {leverageSuccess}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isOrderValueValid || !isConnected}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
