import { useEffect, useState } from "react";

interface ChartData {
  symbol: string;
  interval: string;
  loading: boolean;
  error: string | null;
}

export const useTradingViewChart = (initialSymbol: string) => {
  const [chartData, setChartData] = useState<ChartData>({
    symbol: initialSymbol,
    interval: "1D",
    loading: false,
    error: null,
  });

  const updateSymbol = (newSymbol: string) => {
    setChartData(prev => ({
      ...prev,
      symbol: newSymbol,
      loading: true,
      error: null,
    }));
  };

  const updateInterval = (newInterval: string) => {
    setChartData(prev => ({
      ...prev,
      interval: newInterval,
    }));
  };

  useEffect(() => {
    if (chartData.loading) {
      // Add any additional data fetching logic here
      setChartData(prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [chartData.loading]);

  return {
    chartData,
    updateSymbol,
    updateInterval,
  };
};
