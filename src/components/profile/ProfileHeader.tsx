import React from "react";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

const ProfileHeader = () => {
  return (
    <div className="mb-6 flex items-center">
      <Button variant="ghost" size="sm" className="mr-3 p-1 sm:p-2">
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
      </Button>
      <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
    </div>
  );
};

export default ProfileHeader;
