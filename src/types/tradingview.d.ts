declare module "@/lib/charting_library" {
  export type ResolutionString = string;

  export interface LibrarySymbolInfo {
    name: string;
    full_name: string;
    description: string;
    exchange: string;
    type: string;
    ticker?: string;
    session: string;
    timezone: string;
    minmov: number;
    pricescale: number;
    has_intraday: boolean;
    has_daily: boolean;
    has_weekly_and_monthly: boolean;
    supported_resolutions: ResolutionString[];
    volume_precision: number;
    data_status: string;
  }

  export interface ChartingLibraryWidgetOptions {
    symbol: string;
    interval: ResolutionString;
    container: string;
    library_path: string;
    locale: string;
    datafeed: any;
    fullscreen?: boolean;
    autosize?: boolean;
    studies_overrides?: Record<string, string>;
    theme?: "Light" | "Dark";
    disabled_features?: string[];
    enabled_features?: string[];
    charts_storage_url?: string;
    client_id?: string;
    user_id?: string;
    loading_screen?: {
      backgroundColor: string;
    };
  }

  export interface TradingViewWidget {
    remove(): void;
    onChartReady(callback: () => void): void;
    setSymbol(
      symbol: string,
      interval: ResolutionString,
      callback: () => void
    ): void;
    chart(): any;
  }

  export const widget: {
    new (options: ChartingLibraryWidgetOptions): TradingViewWidget;
  };
}

declare global {
  interface Window {
    TradingView: {
      widget: typeof import("@/lib/charting_library").widget;
    };
    Datafeeds: {
      UDFCompatibleDatafeed: any;
    };
  }
}
