"use client";
import React, { useState } from 'react';
import { 
  Bell, BellRing, Sparkles, Heart, MessageCircle, Flame, 
  X, CheckCheck, ChevronRight, ExternalLink, ShieldCheck, Clock
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Reciente';
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return 'Ayer';
    return `Hace ${Math.floor(diff / 86400)} d`;
  } catch {
    return 'Reciente';
  }
}

export const NotificationCenterDrawer = ({ 
  isOpen, 
  onClose, 
  notifications = [], 
  unreadCount = 0,
  onRefresh,
  onNavigate 
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'match' | 'message' | 'like'
  const [markingAll, setMarkingAll] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'match') return n.type === 'match';
    if (filter === 'message') return n.type === 'message';
    if (filter === 'like') return n.type === 'like' || n.type === 'superlike';
    return true;
  });

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiFetch('/api/notifications?mark_read=true');
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.warn('Error al marcar todas como leídas:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Marcar esta como leída
    if (!notif.is_read) {
      apiFetch(`/api/notifications?id=${notif.id}`).catch(() => {});
    }

    onClose();

    // 2. Navegar al objetivo
    if (onNavigate && notif.url) {
      onNavigate(notif.url, notif);
    } else if (notif.url) {
      window.location.href = notif.url;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'match':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sparkles size={18} className="text-white animate-pulse" />
          </div>
        );
      case 'like':
      case 'superlike':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Heart size={18} className="text-white fill-white/30" />
          </div>
        );
      case 'message':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <MessageCircle size={18} className="text-white" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Flame size={18} className="text-white" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex justify-end bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Clic fuera para cerrar */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Panel Deslizante Drawer */}
      <div 
        className="w-full max-w-md h-full bg-[#05060e] border-l border-white/10 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Centro de Notificaciones */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
              <BellRing size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="mystic-font text-base sm:text-lg font-bold text-white tracking-wide">
                  Señales Cósmicas
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                Resonancias, conexiones y mensajes en tu cielo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                title="Marcar todas como leídas"
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition flex items-center gap-1 text-xs"
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'match', label: 'Matches ✨' },
            { id: 'message', label: 'Mensajes 💬' },
            { id: 'like', label: 'Sintonías 💚' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de Notificaciones con Scroll Independiente */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400/60 shadow-inner">
                <Bell size={28} className="opacity-40" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                Tu cielo astral está sereno
              </h4>
              <p className="text-xs text-slate-400 max-w-xs font-light leading-relaxed">
                {filter === 'all'
                  ? 'No hay nuevas perturbaciones en el éter. Cuando alguien sintonice contigo o te envíe un mensaje astral, aparecerá aquí.'
                  : 'No tienes notificaciones en esta categoría por ahora.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group relative ${
                    isUnread
                      ? 'bg-cyan-950/25 border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Icono temático */}
                  {getTypeIcon(n.type)}

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition">
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0 font-light">
                        <Clock size={10} /> {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-300 font-light mt-0.5 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Ver detalles <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>

                  {/* Punto luminoso de No Leído */}
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pie de Drawer con recordatorio místico */}
        <div className="p-3 border-t border-white/5 bg-black/40 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-cyan-400" />
            Las estrellas se alinean con tu vibración actual
          </p>
        </div>
      </div>
    </div>
  );
};
