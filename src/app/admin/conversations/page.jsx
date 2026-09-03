'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Search, 
  User, 
  Clock, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
      if (!selectedChat && data.conversations && data.conversations.length > 0) {
        loadMessages(data.conversations[0]);
      }
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const loadMessages = async (conv) => {
    setSelectedChat(conv);
    setMessagesLoading(true);
    try {
      const res = await apiFetch(`/api/admin/conversations?userA=${encodeURIComponent(conv.user_a_id)}&userB=${encodeURIComponent(conv.user_b_id)}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Error loading chat messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('¿Deseas eliminar este mensaje por motivos de moderación?')) return;
    try {
      const res = await apiFetch(`/api/admin/conversations?messageId=${messageId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  };

  const filteredConvs = conversations.filter(c => 
    c.user_a_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_b_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <span>Moderación de Conversaciones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión preventiva para garantizar un entorno cósmico seguro, respetuoso y libre de spam.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recargar Chats
        </button>
      </div>

      {/* Split Chat Moderation Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[650px]">
        
        {/* Left: Conversations List (5 cols) */}
        <div className="md:col-span-5 bg-[#0a0e22] border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por sintonizador..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Cargando conversaciones...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No hay conversaciones activas.</div>
            ) : (
              filteredConvs.map((conv, idx) => {
                const isSelected = selectedChat?.user_a_id === conv.user_a_id && selectedChat?.user_b_id === conv.user_b_id;
                return (
                  <div
                    key={idx}
                    onClick={() => loadMessages(conv)}
                    className={`
                      p-3.5 cursor-pointer transition-colors flex items-start gap-3
                      ${isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-400' : 'hover:bg-slate-800/40'}
                    `}
                  >
                    <div className="flex -space-x-2 shrink-0 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                        {conv.user_a_name ? conv.user_a_name[0].toUpperCase() : 'A'}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                        {conv.user_b_name ? conv.user_b_name[0].toUpperCase() : 'B'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {conv.user_a_name} & {conv.user_b_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {conv.message_count} msgs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.last_message || 'Conversación iniciada'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Transcript Viewer (7 cols) */}
        <div className="md:col-span-7 bg-[#0a0e22] border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{selectedChat.user_a_name}</span>
                    <span className="text-slate-500">↔</span>
                    <span>{selectedChat.user_b_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {selectedChat.user_a_id} • {selectedChat.user_b_id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                    Modo Moderador
                  </span>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500">Cargando mensajes del vínculo...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No hay mensajes registrados en este chat.</div>
                ) : (
                  messages.map((msg) => {
                    const isUserA = msg.sender_id === selectedChat.user_a_id;
                    return (
                      <div
                        key={msg.id}
                        className={`
                          p-3 rounded-xl border max-w-[85%] relative group text-xs
                          ${isUserA 
                            ? 'bg-cyan-950/30 border-cyan-500/20 text-slate-200 mr-auto' 
                            : 'bg-indigo-950/30 border-indigo-500/20 text-slate-200 ml-auto'}
                        `}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`font-semibold text-[11px] ${isUserA ? 'text-cyan-300' : 'text-indigo-300'}`}>
                            {msg.sender_name || msg.sender_id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Borrar mensaje"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-300 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Notice */}
              <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 text-[10px] text-slate-500 text-center font-mono">
                Los mensajes eliminados desaparecen instantáneamente de las pantallas de ambos usuarios.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Selecciona una conversación del listado para inspeccionar los mensajes.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
