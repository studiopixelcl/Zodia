"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, Sparkles, UserCheck, Bot } from 'lucide-react';
import { getZodiacSymbol } from '../../lib/astrology';

export const TabVinculos = ({ selectedUserId, onClearSelection }) => {
  const [vinculos, setVinculos]       = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeUser, setActiveUser]   = useState(null);

  const [messages, setMessages]       = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText]     = useState('');
  const [sending, setSending]         = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const chatEndRef = useRef(null);

  const fetchVinculos = async () => {
    try {
      const res = await fetch('/api/vinculos');
      if (res.ok) {
        const data = await res.json();
        setVinculos(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchVinculos();
  }, []);

  useEffect(() => {
    if (selectedUserId && vinculos.length > 0) {
      const found = vinculos.find(v => v.id === selectedUserId);
      if (found) {
        setActiveUser(found);
      } else {
        setActiveUser({ id: selectedUserId, name: 'Sintonizador Guía', sign: 'Eter', affinity: '90%' });
      }
    }
  }, [selectedUserId, vinculos]);

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/messages?with=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (!activeUser) return;
    setLoadingChat(true);
    fetchMessages(activeUser.id);

    const interval = setInterval(() => {
      fetchMessages(activeUser.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser || sending) return;

    const contentToSend = inputText.trim();
    setInputText('');
    setSending(true);

    // Añadir mensaje optimista del usuario
    const optimisticMsg = {
      id: Date.now(),
      sender_id: 'me',
      receiver_id: activeUser.id,
      content: contentToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const isGuideOrBot = activeUser.id.startsWith('guide_') || activeUser.id === 'zodia_bot';
    if (isGuideOrBot) {
      setIsBotTyping(true);
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeUser.id, content: contentToSend }),
      });

      if (res.ok) {
        setTimeout(async () => {
          await fetchMessages(activeUser.id);
          setIsBotTyping(false);
          fetchVinculos();
        }, isGuideOrBot ? 1200 : 300);
      }
    } catch {
      setIsBotTyping(false);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    setActiveUser(null);
    if (onClearSelection) onClearSelection();
  };

  // ── RENDER 1: CHAT CON SINTONIZADOR / BOT ──────────────────────────────────
  if (activeUser) {
    const zodiacSymbol = getZodiacSymbol(activeUser.sign);

    return (
      <div className="space-y-4 animate-fadeIn px-4 flex flex-col h-[75vh]">
        {/* Cabecera del Chat */}
        <div className="glass-panel p-4 flex items-center justify-between shadow-lg border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 text-gray-400 hover:text-cyan-400 transition rounded-full hover:bg-white/5"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-black border border-cyan-500/40 overflow-hidden flex items-center justify-center shadow-inner">
                {activeUser.image && activeUser.image !== '/assets/default-avatar.png' ? (
                  <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="text-cyan-400" size={22} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold">
                {zodiacSymbol}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                {activeUser.name}
              </h4>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">
                {activeUser.sign} • {activeUser.element}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-3 py-1 rounded-full text-cyan-300 font-extrabold text-xs flex items-center gap-1">
            <Sparkles size={12} /> {activeUser.affinity}
          </div>
        </div>

        {/* Flujo de Mensajes */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl glass-panel bg-black/50 border border-white/5">
          {loadingChat ? (
            <div className="text-center py-12 text-cyan-500 animate-pulse text-xs tracking-widest uppercase">
              Abriendo canal cósmico...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs italic px-6">
              "El canal místico está abierto. Transmite tu primera palabra a {activeUser.name}."
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_id === 'me' || (msg.sender_id !== activeUser.id && msg.sender_id !== 'zodia_bot');
              const formattedTime = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-3 shadow-md ${
                      isMine
                        ? 'btn-mystic text-white rounded-2xl rounded-tr-none'
                        : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-none border border-white/10 backdrop-blur-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-light">{msg.content}</p>
                    {formattedTime && (
                      <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-cyan-200/70' : 'text-gray-400'}`}>
                        {formattedTime}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isBotTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-cyan-300 rounded-2xl rounded-tl-none border border-cyan-500/30 px-4 py-2 text-xs flex items-center gap-2 animate-pulse">
                <Sparkles size={14} className="animate-spin" />
                <span>Zodia está respondiendo...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Formulario de Envío */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder={`Escribe un mensaje a ${activeUser.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition shadow-inner placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="btn-mystic px-5 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-lg"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  // ── RENDER 2: LISTA DE MENSAJES ────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn px-4">
      <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-r from-purple-950/30 via-cyan-950/20 to-black/60 border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulseGlow" />
        <h3 className="mystic-font text-xl text-white mb-2 flex items-center gap-2">
          <MessageCircle className="text-cyan-400" size={20} /> Mensajes & Chats
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-light">
          Conversaciones en tiempo real con usuarios conectados e Inteligencia Astral.
        </p>
      </div>

      <div>
        <h3 className="mystic-font text-lg text-white mb-4 pl-2 flex items-center justify-between">
          <span>Conversaciones</span>
          <span className="text-xs text-cyan-400 font-normal">{vinculos.length} Conectados</span>
        </h3>

        {loadingList ? (
          <div className="text-center py-12 text-cyan-500 animate-pulse uppercase text-xs tracking-widest">
            Cargando tus mensajes...
          </div>
        ) : (
          <div className="space-y-3">
            {vinculos.map((u) => (
              <div
                key={u.id}
                onClick={() => setActiveUser(u)}
                className="glass-panel p-4 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-black border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner">
                      {u.image && u.image !== '/assets/default-avatar.png' ? (
                        <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="text-cyan-400" size={24} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                      {getZodiacSymbol(u.sign)}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                      {u.name}
                    </h4>
                    <p className="text-xs text-gray-400 truncate max-w-[200px] font-light">
                      {u.isSelfSender ? <span className="text-cyan-400 font-semibold">Tú: </span> : ''}
                      {u.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-full text-cyan-300 font-extrabold text-xs">
                    {u.affinity}
                  </span>
                  <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{u.sign}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
