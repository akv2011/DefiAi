export enum ChatErrorType {
  NONE = "none",
  NETWORK = "network",
  RATE_LIMIT = "rate-limit",
  SERVER = "server",
  PENDING_ACTION = "pending-action",
  GENERIC = "generic",
}

export const ErrorTypeDescriptions: Record<ChatErrorType, string> = {
  [ChatErrorType.NONE]: "No error",
  [ChatErrorType.NETWORK]:
    "Network error occurred. Please check your internet connection and try again.",
  [ChatErrorType.RATE_LIMIT]:
    "Daily message limit exceeded. Upgrade to continue.",
  [ChatErrorType.SERVER]: "Server error occurred. Please try again later.",
  [ChatErrorType.PENDING_ACTION]:
    "It looks like your previous action is still in progress. Please finish it or start a new chat.",
  [ChatErrorType.GENERIC]:
    "An unexpected error occurred. Please try again or reach out to our support team.",
};

export const getErrorTypeFromStatus = (status: number): ChatErrorType => {
  if (status === 0 || (status < 200 && !status)) {
    return ChatErrorType.NETWORK;
  } else if (status === 429) {
    return ChatErrorType.RATE_LIMIT;
  } else if (status >= 500) {
    return ChatErrorType.SERVER;
  } else {
    return ChatErrorType.GENERIC;
  }
};

export const isActionableError = (type: ChatErrorType): boolean => {
  return (
    type === ChatErrorType.PENDING_ACTION ||
    type === ChatErrorType.NETWORK ||
    type === ChatErrorType.RATE_LIMIT
  );
};

export const getErrorAction = (type: ChatErrorType): string => {
  switch (type) {
    case ChatErrorType.RATE_LIMIT:
      return "Upgrade";
    case ChatErrorType.NETWORK:
    case ChatErrorType.SERVER:
    case ChatErrorType.GENERIC:
      return "Retry";
    case ChatErrorType.PENDING_ACTION:
      return "Complete Action";
    default:
      return "";
  }
};
