"use client";
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme} style={{ minHeight: "100vh" }}>{children}</div>
    </ThemeContext.Provider>
  );
}
