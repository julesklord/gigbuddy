import { useState, useEffect } from "react";

export type GlobalTheme =
  | "brand-tropic-vibes"
  | "brand-mango"
  | "brand-balandra"
  | "brand-playa"
  | "brand-pitahaya";

export type GlobalMode = "dark" | "light";

export function useTheme() {
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme>(() => {
    const cached = localStorage.getItem("gigbuddy_global_theme");
    return (cached as GlobalTheme) || "brand-tropic-vibes";
  });

  const [globalMode, setGlobalMode] = useState<GlobalMode>(() => {
    const cached = localStorage.getItem("gigbuddy_global_mode");
    return (cached as GlobalMode) || "dark";
  });

  // Apply theme to html element
  useEffect(() => {
    document.documentElement.classList.remove(
      "brand-tropic-vibes",
      "brand-mango",
      "brand-balandra",
      "brand-playa",
      "brand-pitahaya",
    );
    document.documentElement.classList.add(globalTheme);
    localStorage.setItem("gigbuddy_global_theme", globalTheme);
  }, [globalTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", globalMode);
    localStorage.setItem("gigbuddy_global_mode", globalMode);
  }, [globalMode]);

  return {
    globalTheme,
    setGlobalTheme,
    globalMode,
    setGlobalMode,
  };
}
