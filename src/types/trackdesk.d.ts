// Define TrackdeskClickParams and TrackdeskConversionParams types
export type TrackdeskClickParams = {
  eventLabel?: string;
  customParams?: {
    advS1?: string;
    advS2?: string;
    advS3?: string;
    advS4?: string;
    advS5?: string;
  };
  [key: string]: any;
};

// Type for parameter source values
export type TrackdeskParamSource =
  | string
  | number
  | { queryParam: string }
  | { cookieParam: string };

export type TrackdeskConversionParams = {
  conversionType: string;
  externalId?: string | TrackdeskParamSource;
  customerId?: string | TrackdeskParamSource;
  currencyCode?: string | TrackdeskParamSource;
  status?:
    | "CONVERSION_STATUS_APPROVED"
    | "CONVERSION_STATUS_PENDING"
    | "CONVERSION_STATUS_TEST";
  customParams?: {
    advS1?: string | TrackdeskParamSource;
    advS2?: string | TrackdeskParamSource;
    advS3?: string | TrackdeskParamSource;
    advS4?: string | TrackdeskParamSource;
    advS5?: string | TrackdeskParamSource;
  };
  amount: {
    value: number | string | TrackdeskParamSource;
  };
};

// Define TrackdeskFunction type with overloads
export interface TrackdeskFunction {
  (account: string, actionType: "click", data?: TrackdeskClickParams): void;
  (
    account: string,
    actionType: "conversion",
    data: TrackdeskConversionParams
  ): void;
}

// Extend the Window interface globally
declare global {
  interface Window {
    trackdesk: TrackdeskFunction;
  }
}
