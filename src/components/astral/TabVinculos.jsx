"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, Sparkles, UserCheck, Bot, Heart, Zap, MapPin } from 'lucide-react';
import { getZodiacSymbol } from '../../lib/astrology';
import { generateAstrologicalIcebreakers } from '../../lib/dating';
import { apiFetch } from '../../lib/api';
import { ZodiacBadge } from './ZodiacBadge';

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
      const res = await apiFetch('/api/vinculos');
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
        setActiveUser({
          id: selectedUserId,
          name: 'Tu Resonancia Cósmica',
          sign: 'Leo',
          element: 'Fuego',
          affinity: '95%',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
        });
      }
    }
  }, [selectedUserId, vinculos]);

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await apiFetch(`/api/messages?with=${encodeURIComponent(userId)}`);
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

  const handleSendMessage = async (textToSend = null) => {
    const content = (textToSend || inputText).trim();
    if (!content || !activeUser || sending) return;

    if (!textToSend) setInputText('');
    setSending(true);

    // Añadir mensaje optimista del usuario
    const optimisticMsg = {
      id: Date.now(),
      sender_id: 'me',
      receiver_id: activeUser.id,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const isSimulated = activeUser.id.startsWith('candidate_') || activeUser.id.startsWith('guide_') || activeUser.id === 'zodia_bot';
    if (isSimulated) {
      setIsBotTyping(true);
    }

    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeUser.id, content }),
      });

      if (res.ok) {
        setTimeout(async () => {
          await fetchMessages(activeUser.id);
          setIsBotTyping(false);
          fetchVinculos();
        }, isSimulated ? 1200 : 300);
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

  // Separar matches recientes de conversaciones existentes
  const newMatches = vinculos.filter(v => v.isNewMatch || !v.lastMessage);
  const activeChats = vinculos.filter(v => v.lastMessage);

  // ── RENDER 1: PANTALLA DE CHAT ACTIVO ──────────────────────────────────────
  if (activeUser) {
    const zodiacSymbol = getZodiacSymbol(activeUser.sign);
    const icebreakers = generateAstrologicalIcebreakers('Capricornio', activeUser.sign, activeUser.name);

    return (
      <div className="space-y-3 animate-fadeIn px-2 sm:px-4 flex flex-col h-[76vh]">
        {/* Cabecera del Chat */}
        <div className="glass-panel p-3.5 flex items-center justify-between shadow-lg border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 text-gray-400 hover:text-cyan-400 transition rounded-full hover:bg-white/5"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-black border-2 border-cyan-400/50 overflow-hidden flex items-center justify-center shadow-inner">
                {activeUser.image && activeUser.image !== '/assets/default-avatar.png' ? (
                  <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="text-cyan-400" size={22} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] text-white font-bold shadow-md">
                {zodiacSymbol}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                {activeUser.name}
              </h4>
              <p className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                {activeUser.sign} • Elemento {activeUser.element}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-full text-cyan-300 font-extrabold text-[11px] flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" /> {activeUser.affinity || '95%'}
          </div>
        </div>

        {/* Flujo de Mensajes */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl glass-panel bg-black/60 border border-white/5">
          {loadingChat ? (
            <div className="text-center py-12 text-cyan-500 animate-pulse text-xs tracking-widest uppercase">
              Abriendo canal cósmico...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">¡Hicieron Match Astral!</h5>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 font-light">
                  Inicia la conversación con un rompehielos sugerido para romper el hielo:
                </p>
              </div>

              {/* Chips de Rompehielos directos */}
              <div className="flex flex-col gap-2 pt-2 max-w-sm mx-auto">
                {icebreakers.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/50 text-left text-xs text-gray-200 hover:text-cyan-300 transition text-[11px] flex items-center justify-between group"
                  >
                    <span>"{prompt}"</span>
                    <Send size={12} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
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
                    className={`max-w-[82%] px-4 py-2.5 shadow-md ${
                      isMine
                        ? 'btn-mystic text-white rounded-2xl rounded-tr-none'
                        : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-none border border-white/10 backdrop-blur-md'
                    }`}
                  >
                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-light">{msg.content}</p>
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
              <div className="bg-white/10 text-cyan-300 rounded-2xl rounded-tl-none border border-cyan-500/30 px-3 py-1.5 text-xs flex items-center gap-2 animate-pulse">
                <Sparkles size={12} className="animate-spin" />
                <span>{activeUser.name.split(' ')[0]} está escribiendo...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Formulario de Envío */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder={`Escribe a ${activeUser.name.split(' ')[0]}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 outline-none transition shadow-inner placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="btn-mystic px-4 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-lg"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  // ── RENDER 2: LISTA DE MATCHES Y MENSAJES ──────────────────────────────────
  return (
    <div className="space-y-5 animate-fadeIn px-2 sm:px-4">
      {/* Cabecera */}
      <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-black/70 border border-cyan-500/20 shadow-md">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -z-10" />
        <h3 className="mystic-font text-xl text-white mb-1.5 flex items-center gap-2">
          <Heart className="text-pink-400 fill-current" size={20} /> Vínculos & Conexiones
        </h3>
        <p className="text-xs text-gray-300 font-light leading-relaxed">
          Tus sintonías mutuas y conversaciones activas guiadas por la astrología.
        </p>
      </div>

      {/* ── 1. CARRUSEL SUPERIOR: NUEVAS RESONANCIAS / MATCHES RECIENTES ── */}
      {newMatches.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400 animate-spin" /> Nuevas Resonancias ({newMatches.length})
            </h4>
            <span className="text-[10px] text-gray-400 font-light">Toca para chatear</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
            {newMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveUser(m)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group space-y-1.5"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-black border border-black">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black/80 border border-cyan-400 rounded-full px-1 py-0.2 text-[9px] text-cyan-300 font-extrabold shadow">
                    {m.affinity || '95%'}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-200 group-hover:text-cyan-300 transition truncate max-w-[65px] text-center block">
                  {m.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. LISTA INFERIOR: CONVERSACIONES ACTIVAS ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 flex items-center justify-between">
          <span>Conversaciones</span>
          <span className="text-cyan-400 font-normal">{activeChats.length} Activas</span>
        </h4>

        {loadingList ? (
          <div className="text-center py-12 text-cyan-500 animate-pulse uppercase text-xs tracking-widest">
            Cargando tus sintonías...
          </div>
        ) : activeChats.length === 0 ? (
          <div className="glass-panel p-6 text-center space-y-2 border border-white/5">
            <p className="text-xs text-gray-400">Aún no tienes mensajes en curso.</p>
            <p className="text-[11px] text-cyan-400 font-light">
              Inicia una conversación tocando una de tus nuevas resonancias arriba o explorando en Sintonía.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeChats.map((u) => (
              <div
                key={u.id}
                onClick={() => setActiveUser(u)}
                className="glass-panel p-3.5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-black border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner">
                      {u.image && u.image !== '/assets/default-avatar.png' ? (
                        <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="text-cyan-400" size={24} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] text-white font-bold shadow-md">
                      {getZodiacSymbol(u.sign)}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-xs group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      {u.name}
                    </h4>
                    <p className="text-[11px] text-gray-300 truncate max-w-[180px] sm:max-w-[280px] font-light mt-0.5">
                      {u.isSelfSender ? <span className="text-cyan-400 font-semibold">Tú: </span> : ''}
                      {u.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-full text-cyan-300 font-extrabold text-[10px]">
                    {u.affinity}
                  </span>
                  <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">{u.sign}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
