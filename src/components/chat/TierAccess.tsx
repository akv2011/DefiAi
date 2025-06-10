import React, { useEffect, useState } from "react";

import Image from "next/image";

import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Cog,
  Copy,
  Crown,
  Droplets,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useUser } from "@/contexts/user-context";

interface TierService {
  name: string;
  logo?: string;
  icon?: "copy" | "briefcase" | "droplets" | "cog";
  isActive?: boolean;
}

interface TierData {
  title: string;
  icon: "star" | "crown";
  services: TierService[];
  isPremium?: boolean;
}

interface TierAccessProps {
  className?: string;
}

const TIER_DATA: TierData[] = [
  {
    title: "Your Access (limited)",
    icon: "star",
    services: [
      {
        name: "Hyperliquid",
        logo: "/partners-logos/hyperliquid.png",
        isActive: true,
      },
      {
        name: "Tradingview",
        logo: "/partners-logos/tradingview.png",
        isActive: true,
      },
      { name: "LiFi", logo: "/partners-logos/lifi.png", isActive: true },
      { name: "Morpho", logo: "/partners-logos/morpho.png", isActive: true },
      { name: "AAVE", logo: "/partners-logos/aave.png", isActive: true },
      {
        name: "Coingecko",
        logo: "/partners-logos/coingecko.png",
        isActive: true,
      },
    ],
  },
  {
    title: "Premium Access (unlimited)",
    icon: "crown",
    isPremium: true,
    services: [
      { name: "Arkham", logo: "/partners-logos/arkham.png" },
      { name: "Coinglass", logo: "/partners-logos/coinglass.png" },
      { name: "Telegram", logo: "/partners-logos/telegram.jpg" },
      { name: "Twitter", logo: "/partners-logos/twitter.jpg" },
      { name: "DeFi Llama", logo: "/partners-logos/defi-llama.png" },
      { name: "Dex Screener", logo: "/partners-logos/dex-screener.png" },
      { name: "Anthropic", logo: "/partners-logos/anthropic.jpg" },
      { name: "OpenAI", logo: "/partners-logos/openai.jpg" },
      { name: "Xai", logo: "/partners-logos/xai.jpg" },
    ],
  },
  {
    title: "Matrix V2",
    icon: "crown",
    isPremium: true,
    services: [
      { name: "Copy Trading", icon: "copy" },
      { name: "Agent Vaults", icon: "briefcase" },
      { name: "Liquidity Provision", icon: "droplets" },
      { name: "Automation", icon: "cog" },
    ],
  },
];

const STORAGE_KEY = "tierAccess_expanded";

export const TierAccess: React.FC<TierAccessProps> = ({ className = "" }) => {
  const { isPremium } = useUser();

  // Add a min-width style to prevent squishing during transitions
  const containerStyle = {
    minWidth: "200px", // Prevent squishing during sidebar transitions
  };
  // Initialize state from localStorage, default to true if no value exists
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isExpanded));
  }, [isExpanded]);

  const getIcon = (iconType: "star" | "crown") => {
    const className =
      "h-3.5 w-3.5 text-primary transition-transform duration-300";
    return iconType === "star" ? (
      <Star className={className} />
    ) : (
      <Crown className={className} />
    );
  };

  return (
    <div
      className={cn("transition-all duration-300", className)}
      style={containerStyle}
    >
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 group/title px-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary transition-all duration-300 group-hover/title:rotate-12" />
          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover/title:text-primary dark:group-hover/title:text-primary transition-colors duration-300">
            Tier Access
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-primary/70 hover:text-primary transition-all duration-300 hover:translate-y-0.5" />
        ) : (
          <ChevronUp className="h-4 w-4 text-primary/70 hover:text-primary transition-all duration-300 hover:-translate-y-0.5" />
        )}
      </Button>

      <div
        className={cn(
          "space-y-4 overflow-hidden transition-all duration-500",
          isExpanded
            ? "max-h-screen opacity-100 py-4"
            : "max-h-0 opacity-0 py-0"
        )}
      >
        {TIER_DATA.map((tier, tierIndex) => (
          <div
            key={tierIndex}
            className="rounded-md relative overflow-hidden mb-2 transition-all duration-300"
          >
            <div className="relative flex items-center gap-1.5 px-4 py-1.5 group/tier">
              <div className="transition-transform duration-300 group-hover/tier:rotate-12">
                {getIcon(tier.icon)}
              </div>
              <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase transition-all duration-300 group-hover/tier:translate-x-0.5 group-hover/tier:text-primary">
                {tier.title}
                {tier.title === "Matrix V2" && (
                  <span className="ml-1 text-[10px] text-primary inline-flex items-center">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5 animate-pulse" />
                    (coming soon)
                  </span>
                )}
              </h3>
            </div>

            <div className="relative grid grid-cols-2 gap-x-1 gap-y-0.5 px-2 pb-2">
              {tier.services.map((service, index) => (
                <div
                  key={index}
                  className="group/service flex items-center gap-1.5 py-1 px-2 rounded transition-all duration-300 hover:bg-primary/10 dark:hover:bg-primary/15"
                >
                  {service.logo && (
                    <div className="relative h-3.5 w-3.5 flex-shrink-0">
                      <Image
                        src={service.logo}
                        alt={`${service.name} logo`}
                        fill
                        sizes="14px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  {service.icon && (
                    <>
                      {service.icon === "copy" && (
                        <Copy className="h-3.5 w-3.5 text-primary/80 transition-all duration-300 group-hover/service:text-primary group-hover/service:scale-110" />
                      )}
                      {service.icon === "briefcase" && (
                        <Briefcase className="h-3.5 w-3.5 text-primary/80 transition-all duration-300 group-hover/service:text-primary group-hover/service:scale-110" />
                      )}
                      {service.icon === "droplets" && (
                        <Droplets className="h-3.5 w-3.5 text-primary/80 transition-all duration-300 group-hover/service:text-primary group-hover/service:scale-110" />
                      )}
                      {service.icon === "cog" && (
                        <Cog className="h-3.5 w-3.5 text-primary/80 transition-all duration-300 group-hover/service:text-primary group-hover/service:rotate-45" />
                      )}
                    </>
                  )}
                  <span
                    className={cn(
                      "text-xs truncate transition-all duration-300 group-hover/service:translate-x-0.5 group-hover/service:text-primary",
                      service.isActive || (tier.isPremium && isPremium)
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {service.name}
                  </span>
                  {tier.isPremium && !isPremium && (
                    <Lock className="h-2.5 w-2.5 text-primary/70 ml-auto flex-shrink-0 transition-transform duration-300 group-hover/service:rotate-[-8deg] group-hover/service:text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Upgrade button - only show for non-premium users */}
        <div className="px-2.5">
          {/* We need to control this client-side using a state hook */}
          <SubscriptionDialog
            buttonSize="sm"
            buttonClassName="mt-2 w-full"
            hideIfPremium={true}
            source="tier_access_sidebar"
          />
        </div>
      </div>
    </div>
  );
};

export default TierAccess;
