"use client";

import { useEffect } from "react";
import { initOfflineSync } from "@/lib/offlineSync";

export default function OfflineSyncManager() {
  useEffect(() => {
    initOfflineSync();
  }, []);
  
  return null;
}
