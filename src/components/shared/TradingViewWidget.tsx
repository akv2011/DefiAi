import React, { memo, useEffect, useRef } from "react";

// Chart interval options
type ChartInterval = "1" | "5" | "15" | "30" | "60" | "240" | "D" | "W";

// Define chart height as a constant to use consistently, with mobile adjustment
export const getChartHeight = () => {
  if (typeof window === "undefined") return 400;
  return window.innerWidth < 768 ? 250 : 400;
};

interface TradingViewWidgetProps {
  symbol: string;
  interval?: ChartInterval;
  showDateRanges?: boolean;
  height?: number;
}

// TradingView Widget Component with fixed height
const TradingViewWidget = memo(
  ({
    symbol,
    interval = "60",
    showDateRanges = true,
    height = getChartHeight(),
  }: TradingViewWidgetProps) => {
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!container.current) return;

      // Capture the ref value at the time the effect runs
      const currentContainer = container.current;

      // Clear any existing content in the container first
      currentContainer.innerHTML = `<div class="tradingview-widget-container__widget" style="height: ${height}px !important; width: 100%"></div>`;

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;

      // Determine theme based on system preference
      const isDarkMode =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      // Use valid JSON format for the script content
      script.innerHTML = JSON.stringify({
        autosize: false, // Don't autosize, use fixed height
        width: "100%",
        height: height,
        symbol: `MEXC:${symbol}USDT`,
        interval: interval,
        timezone: "Etc/UTC",
        theme: isDarkMode ? "dark" : "light",
        style: "1",
        locale: "en",
        allow_symbol_change: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
        hide_side_toolbar: false,
        enable_publishing: false,
        withdateranges: showDateRanges,
      });

      currentContainer.appendChild(script);

      // Handle resize events
      const handleResize = () => {
        if (currentContainer) {
          // Force refresh of the chart on resize
          const widget = currentContainer.querySelector(
            ".tradingview-widget-container__widget"
          );
          if (widget) {
            // Apply small style change to trigger reflow
            const currentHeight = height;
            widget.setAttribute(
              "style",
              `height: ${currentHeight}px !important; width: 100%;`
            );

            // On mobile sizes, completely reload the widget to ensure proper sizing
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
              // Clear container and recreate widget
              currentContainer.innerHTML = "";
              currentContainer.innerHTML = `<div class="tradingview-widget-container__widget" style="height: ${currentHeight}px !important; width: 100%"></div>`;

              // Re-add the script (this will completely reload the widget)
              const script = document.createElement("script");
              script.src =
                "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
              script.type = "text/javascript";
              script.async = true;

              const isDarkMode =
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches;

              script.innerHTML = JSON.stringify({
                autosize: false,
                width: "100%",
                height: currentHeight,
                symbol: `CRYPTO:${symbol}USD`,
                interval: interval,
                timezone: "Etc/UTC",
                theme: isDarkMode ? "dark" : "light",
                style: "1",
                locale: "en",
                allow_symbol_change: false,
                calendar: false,
                support_host: "https://www.tradingview.com",
                hide_side_toolbar: false,
                enable_publishing: false,
                withdateranges: showDateRanges,
              });

              currentContainer.appendChild(script);
            }
          }
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        // Use the captured value in the cleanup function
        if (currentContainer && script.parentNode === currentContainer) {
          currentContainer.removeChild(script);
        }
      };
    }, [symbol, interval, height, showDateRanges]);

    return (
      <div className="flex flex-col" onClick={e => e.stopPropagation()}>
        <div
          className="tradingview-widget-container"
          ref={container}
          style={{
            height: `${height}px`,
            width: "100%",
            overflow: "hidden",
            minHeight: `${height}px`, // Enforce minimum height even if container gets squeezed
          }}
        >
          <div
            className="tradingview-widget-container__widget"
            style={{
              height: `${height}px`,
              width: "100%",
            }}
          ></div>
          <div className="tradingview-widget-copyright">
            <a
              href="https://www.tradingview.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="blue-text">
                Track all markets on TradingView
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
);

// Add displayName
TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
