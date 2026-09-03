"use client";
import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Sparkles, MessageCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLyCUhTrXFc6wgy8nbDf6yfIzJzv0dcnYMqZvOUchXYn77SbXIPZrtWi8mXOwwirZs3euEGo-IL1mSZzsrikEVA';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationManager = ({ onNavigateToChat }) => {
  const [permissionState, setPermissionState] = useState('default');
  const [showPrompt, setShowPrompt]           = useState(false);
  const [isSubscribing, setIsSubscribing]     = useState(false);
  const [activeToast, setActiveToast]         = useState(null);
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState(null);

  // 1. Detectar soporte y estado de permisos de notificación
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);

      // Si el permiso aún no se ha decidido y no se descartó recientemente en esta sesión
      const dismissed = sessionStorage.getItem('zodia_notif_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        // Mostrar aviso con un leve retraso para no abrumar al entrar
        const timer = setTimeout(() => setShowPrompt(true), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // 2. Registrar Service Worker silenciosamente si está soportado
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Registro de Service Worker:', err.message);
      });
    }
  }, []);

  // 3. Polling de notificaciones no leídas para Toasts en vivo en pantalla
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await apiFetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const unreadList = data.notifications?.filter(n => !n.is_read) || [];

          if (unreadList.length > 0) {
            const latest = unreadList[0];
            if (latest.id !== lastSeenNotificationId) {
              setLastSeenNotificationId(latest.id);
              setActiveToast(latest);

              // Auto descartar a los 7 segundos
              setTimeout(() => {
                setActiveToast(prev => (prev?.id === latest.id ? null : prev));
              }, 7000);
            }
          }
        }
      } catch {}
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 8000);
    return () => clearInterval(interval);
  }, [lastSeenNotificationId]);

  // 4. Solicitar permiso y registrar suscripción Web Push
  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones Web Push.');
      return;
    }

    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription && VAPID_PUBLIC_KEY) {
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
            });
          } catch (subErr) {
            console.warn('Error en pushManager.subscribe:', subErr.message);
          }
        }

        if (subscription) {
          await apiFetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
          });
        }

        setShowPrompt(false);
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('Error al solicitar notificaciones:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem('zodia_notif_dismissed', 'true');
  };

  const handleToastClick = async () => {
    if (!activeToast) return;
    const targetUrl = activeToast.url || '/zodia/dashboard';
    
    // Marcar como leída
    try {
      await apiFetch('/api/notifications?mark_read=true');
    } catch {}

    setActiveToast(null);

    // Si tiene callback para saltar a chat
    if (onNavigateToChat && targetUrl.includes('userId=')) {
      const match = targetUrl.match(/userId=([^&]+)/);
      if (match && match[1]) {
        onNavigateToChat(match[1]);
        return;
      }
    }

    window.location.href = targetUrl;
  };

  return (
    <>
      {/* ── TOAST FLOTANTE CÓSMICO (MENSAJE / MATCH EN TIEMPO REAL) ── */}
      {activeToast && (
        <div 
          className="fixed top-3 z-[999999] w-[92%] max-w-sm animate-bounce"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div
            onClick={handleToastClick}
            className="p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.4)] flex items-center gap-3 cursor-pointer hover:bg-black transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shrink-0 shadow-inner">
              {activeToast.type === 'match' ? (
                <Sparkles size={20} className="text-white animate-spin" />
              ) : (
                <MessageCircle size={20} className="text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-white font-bold text-xs truncate flex items-center gap-1.5">
                {activeToast.title}
              </h5>
              <p className="text-[11px] text-gray-300 truncate mt-0.5 font-light">
                {activeToast.body}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-1 text-gray-400 hover:text-white rounded-full transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── BANNER DISCRETO DE PERMISO PUSH CÓSMICO ── */}
      {showPrompt && permissionState === 'default' && (
        <div 
          className="fixed bottom-20 sm:bottom-24 z-[9999] w-[92%] max-w-md animate-fadeIn"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="p-4 rounded-2xl bg-[#090d1f]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.25)] flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
              <BellRing size={20} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
                Activar Notificaciones Cósmicas
              </h5>
              <p className="text-[11px] text-gray-300 font-light mt-1 leading-relaxed">
                Recibe avisos inmediatos en tu móvil cuando alguien haga <strong>Match</strong> contigo o te envíe un <strong>mensaje</strong>.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={isSubscribing}
                  onClick={handleEnableNotifications}
                  className="btn-mystic px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-md disabled:opacity-50"
                >
                  <Bell size={13} /> {isSubscribing ? 'Conectando...' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={handleDismissPrompt}
                  className="px-3 py-1.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold hover:bg-white/5 transition"
                >
                  Más tarde
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissPrompt}
              className="text-gray-400 hover:text-white p-1 rounded-full transition"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
