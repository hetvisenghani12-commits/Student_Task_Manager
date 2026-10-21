import { useEffect, useState } from "react";

// ---------------------------------------------
// THEME — "Ink & Marigold": an academic-planner palette.
// The same values are mirrored as CSS variables in styles.css;
// these JS copies are for colors chosen at render time.
// ---------------------------------------------
export const THEME = {
  primary: "#2A2160",
  primaryDark: "#1B1544",
  primaryLight: "#ECEAFB",
  secondary: "#1AA398",
  accent: "#FFB100",
  background: "#F6F5FA",
  surface: "#FFFFFF",
  textDark: "#211A3D",
  textMuted: "#8B87A6",
  border: "#E9E7F4",
  success: "#1AA398",
  warning: "#FFB100",
  danger: "#E14545",
  dangerBg: "#FDE7E7",
};

export const PRIORITY_THEMES = {
  High: { bg: "#FDE7E7", text: "#E14545" },
  Medium: { bg: "#FFF3D6", text: "#B9790A" },
  Low: { bg: "#E4F5F3", text: "#1AA398" },
};

export const ROLE_ADMIN = "admin";
export const ROLE_USER = "user";

export const PRIORITIES = ["Low", "Medium", "High"];
export const CATEGORIES = ["Study", "Assignment", "Personal"];

// ---------------------------------------------
// Helpers
// ---------------------------------------------
export const formatDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
  }
  return new Date();
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const showMsg = (title, msg) => alert(`${title}: ${msg}`);

// Responsive breakpoints: phone < 700, tablet 700-999, desktop >= 1000.
export function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (width >= 1000) return "desktop";
  if (width >= 700) return "tablet";
  return "phone";
}

export const itemsPerPageFor = (breakpoint) =>
  breakpoint === "phone" ? 4 : breakpoint === "tablet" ? 6 : 8;
