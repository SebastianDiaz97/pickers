import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [supported] = useState(
    'serviceWorker' in navigator && 'PushManager' in window
  );
  const subscriptionRef = useRef(null);

  // Verificar suscripción existente al montar
  useEffect(() => {
    if (!supported) return;

    async function checkSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          subscriptionRef.current = existing;
          setSubscribed(true);
        }
      } catch (err) {
        console.warn('Error checking push subscription:', err);
      }
    }

    // Esperar a que el SW esté listo
    if (navigator.serviceWorker.controller) {
      checkSubscription();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', checkSubscription, { once: true });
    }
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [supported]);

  const subscribe = useCallback(async (pickerId) => {
    if (!supported || !VAPID_PUBLIC_KEY) {
      console.warn('Push not supported or VAPID key missing');
      return null;
    }

    try {
      // Solicitar permiso si no lo tenemos
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const registration = await navigator.serviceWorker.ready;

      // Si ya hay suscripción activa, la cancelamos primero
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      // Crear nueva suscripción
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      subscriptionRef.current = subscription;
      setSubscribed(true);

      // Guardar en Supabase
      const subscriptionData = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          picker_id: pickerId,
          subscription: subscriptionData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'picker_id' }
      );

      if (error) {
        console.error('Error saving push subscription:', error);
        return null;
      }

      return subscription;
    } catch (err) {
      console.error('Error subscribing to push:', err);
      return null;
    }
  }, [supported, permission, requestPermission]);

  const unsubscribe = useCallback(async (pickerId) => {
    if (!supported) return;

    try {
      // Cancelar suscripción del navegador
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      } else {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
        }
      }

      setSubscribed(false);

      // Eliminar de Supabase
      if (pickerId) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('picker_id', pickerId);
      }
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
    }
  }, [supported]);

  return {
    supported,
    permission,
    subscribed,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
