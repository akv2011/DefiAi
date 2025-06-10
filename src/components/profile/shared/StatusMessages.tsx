import React from "react";

interface StatusMessagesProps {
  error: string | null;
  success: string | null;
}

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  error,
  success,
}) => {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`p-4 border rounded-md ${
        error
          ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
          : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
      }`}
    >
      {error || success}
    </div>
  );
};

export default StatusMessages;
