'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Users, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ShieldCheck,
  Search
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function AdminMessagingPage() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'private'
  
  // Broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Private state
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [privateMsg, setPrivateMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    // Cargar usuarios para el selector de mensajes privados
    const loadUsers = async () => {
      try {
        const res = await apiFetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
        if (data.users && data.users.length > 0) {
          setSelectedUserId(data.users[0].id);
        }
      } catch (e) {
        console.error('Error loading users for messaging:', e);
      }
    };
    loadUsers();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    if (!confirm('¿Estás seguro de enviar este comunicado a TODOS los usuarios registrados de Zodia?')) {
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'broadcast',
          message: broadcastMsg.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          type: 'success',
          text: `¡Comunicado enviado con éxito a ${data.sentCount || 'todos los'} sintonizadores!`
        });
        setBroadcastMsg('');
      } else {
        setSendResult({ type: 'error', text: data.error || 'Error al emitir el mensaje masivo.' });
      }
    } catch {
      setSendResult({ type: 'error', text: 'Fallo de conexión al enviar el comunicado.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPrivate = async (e) => {
    e.preventDefault();
    if (!privateMsg.trim() || !selectedUserId) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'private',
          targetUserId: selectedUserId,
          message: privateMsg.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          type: 'success',
          text: `Mensaje oficial enviado exitosamente a ${selectedUserId}.`
        });
        setPrivateMsg('');
      } else {
        setSendResult({ type: 'error', text: data.error || 'Error al enviar el mensaje privado.' });
      }
    } catch {
      setSendResult({ type: 'error', text: 'Fallo de conexión con el servidor.' });
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.id?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-amber-400" />
          <span>Centro de Difusión y Mensajería Oficial</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Envía comunicados a todos los usuarios de la red o mantén conversaciones de soporte oficial individuales.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveTab('broadcast'); setSendResult(null); }}
          className={`
            pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all
            ${activeTab === 'broadcast'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-white'}
          `}
        >
          <Radio className="w-4 h-4" />
          <span>Mensaje Masivo (Broadcast a Todos)</span>
        </button>

        <button
          onClick={() => { setActiveTab('private'); setSendResult(null); }}
          className={`
            pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all
            ${activeTab === 'private'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-white'}
          `}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mensaje Privado Individual</span>
        </button>
      </div>

      {/* Result Alert */}
      {sendResult && (
        <div className={`
          p-4 rounded-xl text-xs flex items-center gap-3 animate-in fade-in
          ${sendResult.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}
        `}>
          {sendResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{sendResult.text}</span>
        </div>
      )}

      {/* TAB 1: BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Form Composer (7 cols) */}
          <div className="md:col-span-7 bg-[#0a0e22] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-slate-400">Redactor de Comunicado Global</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                Todos los Sintonizadores
              </span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                  Contenido del Mensaje Masivo
                </label>
                <textarea
                  rows={6}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Escribe el anuncio para toda la comunidad... (Ej: ¡La luna llena en Aries potencia las resonancias esta noche! Revisa tus nuevos vínculos cósmicos en Zodia ✨)"
                  required
                  className="w-full p-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Este mensaje aparecerá en la bandeja de entrada de <strong>Vínculos</strong> de todos los usuarios registrado como enviado por <strong>Zodia Oficial ✨</strong> con insignia de verificación.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSending || !broadcastMsg.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Transmitiendo a la Red...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Emitir Comunicado Global (1-Clic)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Inbox Preview (5 cols) */}
          <div className="md:col-span-5 bg-[#0a0e22] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400 mb-4">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vista Previa en el Teléfono del Usuario</span>
              </div>

              {/* Chat bubble mock */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-inner">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                    ✨
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>Zodia Oficial</span>
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">Ahora mismo</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {broadcastMsg || 'Tu mensaje masivo aparecerá aquí tal como lo verán los usuarios en su pantalla de chat...'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Destinatarios estimados: Toda la base de datos de sintonizadores activos.
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRIVATE MESSAGE */}
      {activeTab === 'private' && (
        <div className="bg-[#0a0e22] border border-slate-800/80 rounded-2xl p-6 max-w-2xl shadow-xl">
          <form onSubmit={handleSendPrivate} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                Seleccionar Destinatario
              </label>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Filtrar por nombre o ID..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                >
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.sign || 'Sin signo'}) - {u.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                Mensaje Oficial Directo
              </label>
              <textarea
                rows={4}
                value={privateMsg}
                onChange={(e) => setPrivateMsg(e.target.value)}
                placeholder="Escribe el mensaje privado al usuario..."
                required
                className="w-full p-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !privateMsg.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Enviando mensaje...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensaje Oficial al Usuario</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
