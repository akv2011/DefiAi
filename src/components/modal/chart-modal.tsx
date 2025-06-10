"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChartModalProps {
  triggerText: string;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function ChartModal({
  triggerText,
  title,
  children,
  size = "lg",
}: ChartModalProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size]} p-0 overflow-hidden`}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto p-0 max-h-[80vh]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ArticleModal({
  triggerText,
  title,
  content,
}: {
  triggerText: string;
  title: string;
  content: string;
}) {
  return (
    <ChartModal triggerText={triggerText} title={title}>
      <div className="p-6">
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      </div>
    </ChartModal>
  );
}
