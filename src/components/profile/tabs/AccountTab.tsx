import React from "react";

import { Check } from "lucide-react";

import ThemeToggle from "@/components/header/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface AccountTabProps {
  address: string | undefined;
}

export const AccountTab: React.FC<AccountTabProps> = ({ address }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
            <div>
              <Label className="text-base font-medium">Connected Wallet</Label>
              <div className="flex items-center gap-3 mt-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {address?.substring(2, 4)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-mono text-muted-foreground break-all mb-1">
                    {address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected on March 12, 2025
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start sm:self-center mt-4 sm:mt-0"
            >
              Disconnect
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
            <div>
              <Label className="text-base font-medium">Theme Settings</Label>
              <p className="text-sm text-muted-foreground mt-2">
                Toggle between light and dark mode
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <ThemeToggle />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
            <div>
              <Label className="text-base font-medium flex items-center">
                Notification Settings
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2 mb-4 sm:mb-0">
                Manage your notification preferences
              </p>
            </div>
            <div className="flex flex-col gap-4 opacity-60">
              <div className="flex items-center justify-between space-x-4 gap-2">
                <Label htmlFor="billing-notifications" className="text-sm">
                  Billing Updates
                </Label>
                <Switch id="billing-notifications" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <Label htmlFor="new-features" className="text-sm">
                  New Features
                </Label>
                <Switch id="new-features" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between space-x-4">
                <Label htmlFor="marketing" className="text-sm">
                  Marketing
                </Label>
                <Switch id="marketing" disabled />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
            <div>
              <Label className="text-base font-medium flex items-center">
                Language Settings
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Currently set to English
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 sm:mt-0 opacity-60"
                  disabled
                >
                  Change Language
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> English
                </DropdownMenuItem>
                <DropdownMenuItem>Spanish</DropdownMenuItem>
                <DropdownMenuItem>French</DropdownMenuItem>
                <DropdownMenuItem>German</DropdownMenuItem>
                <DropdownMenuItem>Japanese</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountTab;
