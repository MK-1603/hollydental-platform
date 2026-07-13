import { useState, useEffect } from 'react';
import { requestFirebaseNotificationPermission, onMessageListener } from '../lib/firebase';
import { apiRequest } from '@/lib/api';
import { toast } from '@/lib/toast';

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    // Only attempt to register if we have a logged in user token
    const appToken = localStorage.getItem('token');
    if (!appToken) return;

    const setupFirebase = async () => {
      try {
        const token = await requestFirebaseNotificationPermission();
        if (token) {
          setFcmToken(token);
          
          // Detect device roughly
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          const device = isMobile ? "Mobile" : "Desktop";
          
          // Send to backend
          await apiRequest('/notifications/register', {
            method: 'POST',
            body: {
              token,
              device,
              browser: navigator.userAgent.substring(0, 50)
            }
          });
        }
      } catch (error) {
        console.error("Failed to setup Firebase notifications:", error);
      }
    };

    setupFirebase();
  }, []);

  useEffect(() => {
    if (fcmToken) {
      onMessageListener().then((payload: any) => {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body
        });
        
        // Show Toast (if not already handled by SSE)
        // Usually you wouldn't show a toast for FCM if SSE is also active, 
        // because you'll get duplicate toasts. We leave this empty or 
        // conditionally run it if SSE disconnected.
      }).catch(err => console.log('failed: ', err));
    }
  }, [fcmToken]);

  return { fcmToken, notification };
};
