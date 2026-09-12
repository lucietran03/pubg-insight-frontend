import { useEffect, useState, type ReactNode } from "react";
import { Box } from "@mui/material";

interface RevealOnMountProps {
  delayMs?: number;
  children: ReactNode;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

// Subtle fade+slide-up used to stagger each major dashboard section into view (Player
// Overview -> Season Performance -> Performance Breakdown -> Recent Matches), one section
// at a time instead of the whole page popping in at once. Skips the animation entirely
// under prefers-reduced-motion (renders visible immediately, no timers).
function RevealOnMount({ delayMs = 0, children }: RevealOnMountProps) {
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    // Reduced-motion case is already `true` from the initial state above - nothing to do.
    if (prefersReducedMotion()) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {children}
    </Box>
  );
}

export default RevealOnMount;
