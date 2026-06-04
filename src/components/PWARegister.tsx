"use client";

import { useEffect } from "react";

// Registers the service worker so the app works offline (PWA / installable).
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
