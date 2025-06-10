import React from "react";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTheme } from "@/contexts/theme-context";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="cursor-pointer flex items-center gap-2"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Switch to Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Switch to Light</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
