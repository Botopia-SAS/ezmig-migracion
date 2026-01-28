"use client";

import { useEffect } from "react";

/**
 * Updates CSS variables for the interactive background glow so the radial
 * highlight follows the cursor.
 */
export function BackgroundGrid() {
  useEffect(() => {
    const root = document.documentElement;

    const update = (x: number, y: number) => {
      const percentX = Math.max(0, Math.min(100, (x / window.innerWidth) * 100));
      const percentY = Math.max(0, Math.min(100, (y / window.innerHeight) * 100));
      root.style.setProperty("--bg-mouse-x", `${percentX}%`);
      root.style.setProperty("--bg-mouse-y", `${percentY}%`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      update(event.clientX, event.clientY);
    };

    // Initialize near top-center for immediate effect
    update(window.innerWidth / 2, window.innerHeight * 0.3);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return null;
}
