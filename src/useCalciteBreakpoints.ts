import { useState, useEffect } from "react";
import type { calciteBreakpoints } from "./calciteBreakpoints";

export const useCalciteBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(
    getBreakpoint(window.innerWidth)
  );

  function getBreakpoint(width: number): keyof typeof calciteBreakpoints {
    if (width <= 320) return "xxs";
    if (width <= 476) return "xs";
    if (width <= 768) return "sm";
    if (width <= 1152) return "md";
    if (width <= 1722) return "lg";
    return "xl";
  }

  useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return breakpoint;
};
