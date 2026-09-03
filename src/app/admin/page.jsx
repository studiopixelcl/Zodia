'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Flame, 
  MessageSquare, 
  ShieldAlert, 
  Radio, 
  ArrowUpRight, 
  Clock, 
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Error fetching admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Sintonizadores Totales',
      value: stats?.totalUsers ?? '...',
      sub: `${stats?.activeUsers ?? 0} activos en la red`,
      icon: Users,
      color: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30',
      iconColor: 'text-cyan-400'
    },
    {
      title: 'Resonancias Formadas',
      value: stats?.totalMatches ?? '...',
      sub: 'Afinidades astrales completas',
      icon: Flame,
      color: 'from-rose-500/20 to-amber-500/10',
      border: 'border-rose-500/30',
      iconColor: 'text-rose-400'
    },
    {
      title: 'Mensajes Intercambiados',
      value: stats?.totalMessages ?? '...',
      sub: 'En el éter de Zodia',
      icon: MessageSquare,
      color: 'from-indigo-500/20 to-purple-500/10',
      border: 'border-indigo-500/30',
      iconColor: 'text-indigo-400'
    },
    {
      title: 'Cuentas Sancionadas',
      value: stats?.bannedUsers ?? 0,
      sub: 'Bloqueadas por moderación',
      icon: ShieldAlert,
      color: 'from-amber-500/20 to-red-500/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0c122c] to-indigo-950/30 border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Panel Maestro
            </span>
            <span className="text-xs text-slate-400">v1.2.0 Cósmico</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Centro de Mando Zodia
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Supervisa perfiles astrales, modera interacciones y emite comunicados globales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Métricas
          </button>
          <Link
            href="/admin/messaging"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-medium text-white shadow-md shadow-cyan-500/20 transition-all"
          >
            <Radio className="w-3.5 h-3.5" />
            Nuevo Comunicado Masivo
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl bg-gradient-to-b ${card.color} ${card.border} border backdrop-blur-md relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl bg-slate-900/60 ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight mb-1 font-mono">
                {card.value}
              </div>
              <p className="text-xs text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links / Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-[#0a0e22] border border-cyan-500/15 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Directorio de Sintonizadores
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspecciona perfiles, revisa cartas astrales y aplica suspensiones o baneos.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 font-medium">
            <span>Abrir gestión de cuentas</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/conversations"
          className="p-5 rounded-2xl bg-[#0a0e22] border border-cyan-500/15 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
              Moderación de Conversaciones
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supervisa la interacción en el chat para proteger a los usuarios de spam y acoso.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-medium">
            <span>Revisar chats activos</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/messaging"
          className="p-5 rounded-2xl bg-[#0a0e22] border border-cyan-500/15 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
              Difusión y Mensajería Oficial
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Envía mensajes masivos (broadcast) a toda la plataforma o avisos individuales.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-400 font-medium">
            <span>Redactar comunicado</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Users Table */}
      <div className="rounded-2xl bg-[#0a0e22] border border-slate-800/80 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Últimos Sintonizadores Registrados</h2>
          </div>
          <Link
            href="/admin/users"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Ver todos los usuarios →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Sintonizador</th>
                <th className="px-5 py-3">Signo & Elemento</th>
                <th className="px-5 py-3">Fecha de Registro</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs">
                          {user.name ? user.name[0].toUpperCase() : 'Z'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-300">{user.sign || 'Por manifestar'}</span>
                        {user.element && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {user.element}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Reciente'}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.status === 'banned' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Baneado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detalles</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500">
                    No hay sintonizadores registrados en este ciclo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
