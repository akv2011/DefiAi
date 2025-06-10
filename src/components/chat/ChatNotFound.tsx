import React from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ChatNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Chat Not Found
      </h2>

      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        The chat you&apos;re looking for might have been deleted or is no longer
        available.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          onClick={() => router.push("/")}
          className="bg-primary hover:bg-primary/90"
        >
          Start a New Chat
        </Button>
      </div>
    </div>
  );
}
