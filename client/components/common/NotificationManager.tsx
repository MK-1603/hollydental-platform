"use client";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationManager() {
  // Mount the hook to handle FCM registration when user logs in
  useNotifications();
  
  // Renders nothing, just manages background effects
  return null;
}
