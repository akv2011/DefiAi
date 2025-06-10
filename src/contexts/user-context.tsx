"use client";

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAccount } from "wagmi";

import { supabaseReadOnly } from "@/lib/supabaseClient";
import { UserQuota, getUserProfile } from "@/lib/userManager";

interface UserContextType {
  address: string | undefined;
  isConnected: boolean;
  isPremium: boolean;
  checkPremiumStatus: () => Promise<void>;
  isLoading: boolean;
  userProfile:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
  isProfileLoading: boolean;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  address: undefined,
  isConnected: false,
  isPremium: false,
  checkPremiumStatus: async () => {},
  isLoading: true,
  userProfile: null,
  isProfileLoading: true,
  fetchUserProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { address, isConnected } = useAccount();

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<
    | (UserQuota & {
        totalMessages?: number;
      })
    | null
  >(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Function to check premium status
  const checkPremiumStatus = async () => {
    if (!address) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/profile/premium-status?address=${address}`
      );
      if (response.ok) {
        const data = await response.json();
        setIsPremium(data.isPremium);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    if (!address) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    try {
      const profile = await getUserProfile(supabaseReadOnly, address);
      // Override the isPremium value with our context value
      profile.isPremium = isPremium;
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Check if we're on a mobile device
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Check premium status when address changes
  useEffect(() => {
    checkPremiumStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Fetch user profile when address or premium status changes
  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isPremium]);

  // Special handling for mobile devices to ensure connection persistence
  useEffect(() => {
    if (isMobile && !isConnected && address) {
      // If we have an address but not connected on mobile, try to reconnect
      console.log(
        "Mobile device detected with wallet address but not connected - attempting reconnection"
      );
      // Force a refresh of the connection status after a delay
      const reconnectTimer = setTimeout(() => {
        window.location.reload();
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [isMobile, isConnected, address]);

  const value = {
    address,
    isConnected,
    isPremium,
    checkPremiumStatus,
    isLoading,
    userProfile,
    fetchUserProfile,
    isProfileLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
