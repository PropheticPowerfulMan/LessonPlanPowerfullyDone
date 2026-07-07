import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { schoolImage } from "../data/defaults";
import { Language } from "../types/lesson";

interface AppContextValue {
  dark: boolean;
  language: Language;
  imageUrl: string;
  toggleDark: () => void;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [dark, setDark] = useState(() => localStorage.getItem("plp:theme") ? localStorage.getItem("plp:theme") === "dark" : true);
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem("plp:language") as Language) || "en");
  const imageUrl = schoolImage;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("plp:theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("plp:language", language);
  }, [language]);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 48;
      canvas.height = 48;
      ctx.drawImage(img, 0, 0, 48, 48);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
      const derived = rgbToHsl(r / count, g / count, b / count, dark);
      document.documentElement.style.setProperty("--primary", derived.primary);
      document.documentElement.style.setProperty("--secondary", derived.secondary);
    };
  }, [dark, imageUrl]);

  const value = useMemo<AppContextValue>(
    () => ({
      dark,
      language,
      imageUrl,
      toggleDark: () => setDark((value) => !value),
      setLanguage: setLanguageState
    }),
    [dark, language]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
};

const rgbToHsl = (r: number, g: number, b: number, dark: boolean) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h *= 60;
  }
  const hue = Math.round((h + 360) % 360);
  const saturation = Math.max(36, Math.round(s * 100));
  return {
    primary: `${hue} ${saturation}% ${dark ? 58 : Math.max(28, Math.round(l * 100))}%`,
    secondary: `${(hue + 135) % 360} ${Math.max(42, saturation - 8)}% ${dark ? 48 : 38}%`
  };
};
