import React from "react";

import { UserQuota } from "@/lib/userManager";

import { AccountTab } from "./tabs/AccountTab";
import { GeneralTab } from "./tabs/GeneralTab";
import { SubscriptionTab } from "./tabs/SubscriptionTab";

interface SubscriptionState {
  active: boolean;
  plan: string;
  status: "active" | "canceled" | "past_due" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string | null;
}

interface TabContentsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
  subscription: SubscriptionState;
  address: string | undefined;
}

const TabContents = ({
  activeTab,
  setActiveTab,
  userQuota,
  subscription,
  address,
}: TabContentsProps) => {
  switch (activeTab) {
    case "subscription":
      return (
        <SubscriptionTab
          userQuota={userQuota}
          subscription={subscription}
          address={address}
        />
      );

    case "account":
      return <AccountTab address={address} />;

    default: // 'general'
      return (
        <GeneralTab
          setActiveTab={setActiveTab}
          userQuota={userQuota}
          subscription={subscription}
        />
      );
  }
};

export default TabContents;
