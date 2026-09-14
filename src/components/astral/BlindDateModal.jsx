"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Heart, Send, Clock, Shield, Eye, Flame, 
  MessageCircle, Loader2, Compass, CheckCircle2, Star, RefreshCw,
  Info, Quote, Sun
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { ZODIAC_DETAILS, getZodiacSymbol } from '../../lib/astrology';
import { apiFetch } from '../../lib/api';
import { 
  playMatchCelebrationSound, 
  playMessageSentSound, 
  playIncomingChimeSound, 
  playSwipePassSound 
} from '../../lib/sound-effects';

export function BlindDateModal({ isOpen, onClose, onConnectPartner, userProfile }) {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos (300 seg)
  const [isRevealed, setIsRevealed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isSavedToVinculos, setIsSavedToVinculos] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const [infoTab, setInfoTab] = useState('signo'); // 'signo' | 'perfil'

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  // Inicializar o recuperar sesión de cita a ciegas
  const initSession = async () => {
    try {
      setLoadingSession(true);
      const res = await apiFetch('/api/blind-dates');
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          setIsRevealed(Boolean(data.session.isFullyRevealed || data.session.userRevealed));
          setTimeLeft(data.session.durationSeconds || 300);

          // Mensaje informativo inicial de la conexión cósmica real
          const partnerFirst = data.session.partner;
          setMessages([
            {
              id: 'msg_welcome',
              sender: 'system',
              senderName: 'Sintonía Cósmica',
              text: `✨ Conexión iniciada con un sintonizador real de ${partnerFirst.sign} (${partnerFirst.element}). Tienen un ${partnerFirst.affinity} de afinidad astral. Rompe el hielo enviándole un mensaje.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Error cargando cita a ciegas:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initSession();
    } else {
      setSession(null);
      setMessages([]);
      setIsRevealed(false);
      setIsSavedToVinculos(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Temporizador regresivo de 5 minutos
  useEffect(() => {
    if (!isOpen || !session) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTriggerReveal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, session]);

  // Auto-scroll al final de mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Enviar mensaje en el chat de la cita a ciegas
  const handleSendMessage = async (e, textOverride = null) => {
    e?.preventDefault();
    const content = (textOverride || inputMessage).trim();
    if (!content || !session) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      senderName: userProfile?.user_name || 'Tú',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    playMessageSentSound();

    // Transmitir mensaje real al destinatario en /api/messages
    try {
      await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: session.partner.id,
          content: `[Cita a Ciegas Astral] ${content}`
        })
      });
    } catch (err) {
      console.warn('Transmisión de mensaje en cita a ciegas:', err);
    }
  };

  // Acción: Revelar sintonía (Quitar el astral blur)
  const handleTriggerReveal = async (auto = false) => {
    if (isRevealed || !session) return;

    try {
      await apiFetch('/api/blind-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reveal',
          sessionId: session.id
        })
      });

      setIsRevealed(true);
      playMatchCelebrationSound(); // Fanfarria Solfeggio 528Hz
    } catch (err) {
      console.error('Error al revelar sintonía:', err);
    }
  };

  // Guardar como match y pasar al chat de Vínculos
  const handleSaveToVinculos = async () => {
    if (!session || isSavedToVinculos) return;

    try {
      await apiFetch('/api/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: session.partner.id,
          content: `✨ ¡Match Cósmico revelado en la Cita a Ciegas! Conexión del ${session.partner.affinity}.`
        })
      });

      setIsSavedToVinculos(true);
      playMatchCelebrationSound();
      if (onConnectPartner) {
        onConnectPartner(session.partner);
      }
    } catch (err) {
      console.error('Error guardando en vínculos:', err);
    }
  };

  // Salir de la cita a ciegas
  const handleLeave = async () => {
    try {
      if (session) {
        await apiFetch('/api/blind-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            sessionId: session.id
          })
        });
      }
      playSwipePassSound();
    } catch (err) {
      console.error('Error al salir de cita a ciegas:', err);
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg h-[92vh] max-h-[800px] bg-gradient-to-b from-[#0e0a1f] via-black to-[#070914] border border-purple-500/40 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.3)] relative">
        
        {/* ── CABECERA CON TEMPORIZADOR Y CONTROLES ── */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Sparkles size={18} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="mystic-font text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                Cita a Ciegas Astral
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                  Modo Efímero
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-light">
                {isRevealed ? '✨ Identidad cósmica desvelada' : '🔮 Conexión por afinidad sin sesgos visuales'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Reloj cuenta regresiva */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border transition ${
              timeLeft < 60
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 animate-pulse'
                : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
            }`}>
              <Clock size={13} />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={handleLeave}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Salir de la cita a ciegas"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── CONTENIDO PRINCIPAL: PERFIL DIFUMINADO Y CHAT ── */}
        {loadingSession ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 size={36} className="animate-spin text-cyan-400" />
            <p className="text-xs text-gray-400 font-light mystic-font">
              Sintonizando frecuencias astrales y buscando pareja afín...
            </p>
          </div>
        ) : session ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* ── PANEL DESPLEGABLE: INFORMACIÓN SOBRE EL SIGNO & PERFIL EN LA CITA ── */}
            {showPartnerInfo && (
              <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#0e0a1f] via-black to-[#070914] flex flex-col overflow-hidden animate-fadeIn">
                {/* Cabecera del Panel */}
                <div className="p-3.5 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <ZodiacBadge sign={session.partner.sign} size="sm" />
                    <div>
                      <h4 className="mystic-font text-white text-sm font-bold flex items-center gap-1.5">
                        {session.partner.sign}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                          {session.partner.element}
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {isRevealed ? session.partner.fullName : session.partner.name} • {session.partner.age} años
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPartnerInfo(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
                    title="Cerrar panel y volver al chat"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Selector de Pestañas: 1. Signo Astral | 2. Descripción de Perfil */}
                <div className="p-3 border-b border-white/5 bg-black/40 flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInfoTab('signo')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      infoTab === 'signo'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                        : 'text-gray-400 hover:text-white bg-white/5'
                    }`}
                  >
                    <Sparkles size={13} className="text-amber-300" />
                    <span>Panel del Signo Astral</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoTab('perfil')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      infoTab === 'perfil'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'text-gray-400 hover:text-white bg-white/5'
                    }`}
                  >
                    <Info size={13} className="text-cyan-300" />
                    <span>Descripción del Perfil</span>
                  </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                  {infoTab === 'signo' ? (
                    <div className="space-y-3">
                      {/* Cómo ama en las citas (Destacado Principal) */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-black/70 border border-pink-500/30 space-y-1.5 shadow-lg">
                        <div className="flex items-center gap-1.5 text-pink-300 font-bold text-xs uppercase tracking-wider">
                          <Heart size={14} className="fill-pink-400 text-pink-400" />
                          <span>Cómo ama {session.partner.sign} en las citas</span>
                        </div>
                        <p className="text-gray-100 text-xs leading-relaxed italic font-light">
                          "{ZODIAC_DETAILS[session.partner.sign]?.loveDescription || 'Conexión guiada por la autenticidad y la búsqueda de complicidad profunda.'}"
                        </p>
                      </div>

                      {/* Regente Planetario & Modalidad */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Regente Planetario</span>
                          <span className="text-white font-semibold text-xs flex items-center gap-1.5">
                            <Sun size={13} className="text-amber-400" />
                            {ZODIAC_DETAILS[session.partner.sign]?.ruler || 'Cosmos'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Modalidad</span>
                          <span className="text-cyan-300 font-semibold text-xs flex items-center gap-1.5">
                            <Compass size={13} className="text-cyan-400" />
                            {ZODIAC_DETAILS[session.partner.sign]?.modality || 'Armónica'}
                          </span>
                        </div>
                      </div>

                      {/* Mantra Sagrado */}
                      {ZODIAC_DETAILS[session.partner.sign]?.mantra && (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-400/20 text-center">
                          <span className="text-[9px] text-purple-300 font-mono uppercase tracking-widest block mb-0.5">Mantra del Signo</span>
                          <p className="text-xs text-purple-100 font-medium italic">
                            "{ZODIAC_DETAILS[session.partner.sign]?.mantra}"
                          </p>
                        </div>
                      )}

                      {/* Personalidad y Esencia */}
                      {ZODIAC_DETAILS[session.partner.sign]?.personality && (
                        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                          <span className="text-[10px] text-cyan-300 uppercase tracking-wider block font-bold">
                            Esencia & Personalidad
                          </span>
                          <p className="text-gray-300 text-xs leading-relaxed font-light">
                            {ZODIAC_DETAILS[session.partner.sign]?.personality}
                          </p>
                        </div>
                      )}

                      {/* Luz y Sombra */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-400/30 space-y-1">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> Luz
                          </span>
                          <p className="text-emerald-100 leading-snug text-[11px]">
                            {ZODIAC_DETAILS[session.partner.sign]?.luz || 'Generosidad, lealtad y empatía'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-400/30 space-y-1">
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Shield size={11} /> Desafío
                          </span>
                          <p className="text-rose-100 leading-snug text-[11px]">
                            {ZODIAC_DETAILS[session.partner.sign]?.sombra || 'Impulsividad o cautela excesiva'}
                          </p>
                        </div>
                      </div>

                      {/* Signos más afines */}
                      {ZODIAC_DETAILS[session.partner.sign]?.idealMatches && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            Signos con Mayor Sintonía Natural
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ZODIAC_DETAILS[session.partner.sign]?.idealMatches.map((mSign) => (
                              <span
                                key={mSign}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold"
                              >
                                {getZodiacSymbol(mSign)} {mSign}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Pestaña: Descripción del Perfil */
                    <div className="space-y-3">
                      {/* Biografía completa / Sobre mí */}
                      <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2 shadow-lg">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Quote size={13} /> Sobre Mí (Descripción del Perfil)
                        </span>
                        <p className="text-gray-100 leading-relaxed italic text-xs font-light">
                          "{session.partner.bio || 'Explorando conexiones genuinas y compartiendo momentos que inspiran.'}"
                        </p>
                      </div>

                      {/* Intención en la app */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-xs text-gray-300">Intención en la cita:</span>
                        <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs">
                          {session.partner.intent || 'Citas y Pareja'}
                        </span>
                      </div>

                      {/* Pasiones & Gustos */}
                      {session.partner.interests && session.partner.interests.length > 0 && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Pasiones & Temas de Conversación
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {session.partner.interests.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-[11px] font-medium"
                              >
                                ✨ {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Datos Cósmicos del Perfil */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase block">Arquetipo</span>
                          <span className="text-white font-bold text-xs">{session.partner.archetype || 'El Mago'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase block">Camino de Vida</span>
                          <span className="text-amber-400 font-bold text-xs">{session.partner.path || 7}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pie del Panel: Volver al chat */}
                <div className="p-3 border-t border-white/10 bg-black/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPartnerInfo(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg active:scale-98 transition cursor-pointer"
                  >
                    Volver a la Charla de la Cita
                  </button>
                </div>
              </div>
            )}
            
            {/* ── TARJETA DEL CANDIDATO A CIEGAS (FOTO DIFUMINADA O REVELADA) ── */}
            <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-black to-cyan-950/40 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3.5">
                
                {/* Marco de foto con Astral Blur */}
                <div 
                  onClick={() => setShowPartnerInfo(true)}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-purple-500/40 shadow-lg cursor-pointer hover:border-cyan-400 transition"
                  title="Ver panel del signo y perfil"
                >
                  <img
                    src={typeof session.partner.image === 'string' ? session.partner.image.replace(/w=\d+/, 'w=1200') : session.partner.image}
                    alt="Cita a ciegas"
                    className={`w-full h-full object-cover object-[center_18%] transition-all duration-1000 ${
                      isRevealed 
                        ? 'filter-none scale-100' 
                        : 'blur-2xl scale-125 opacity-70 contrast-125'
                    }`}
                  />
                  
                  {/* Escudo místico sobrepuesto si no se ha revelado */}
                  {!isRevealed && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/60 via-black/40 to-cyan-900/60 flex flex-col items-center justify-center p-1 text-center">
                      <Sparkles size={16} className="text-cyan-300 animate-pulse mb-0.5" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                        Enigma
                      </span>
                    </div>
                  )}

                  {isRevealed && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-cyan-400 text-black shadow-md">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>

                {/* Detalles de Afinidad & Carta Natal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 
                      onClick={() => setShowPartnerInfo(true)}
                      className="text-base sm:text-lg font-bold mystic-font text-white truncate cursor-pointer hover:text-cyan-300 transition"
                      title="Ver información del signo y perfil"
                    >
                      {isRevealed ? session.partner.fullName : session.partner.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-[10px] font-extrabold shrink-0">
                      {session.partner.affinity} Afin
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setInfoTab('signo');
                        setShowPartnerInfo(true);
                      }}
                      className="hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{session.partner.sign}</span>
                    </button>
                    <span>•</span>
                    <span className="text-gray-400">{session.partner.element}</span>
                    <span>•</span>
                    <span className="text-gray-400">{session.partner.age} años</span>
                  </div>

                  <p 
                    onClick={() => {
                      setInfoTab('perfil');
                      setShowPartnerInfo(true);
                    }}
                    className="text-[11px] text-gray-300 line-clamp-1 italic font-light cursor-pointer hover:text-white transition"
                    title="Clic para ver descripción completa"
                  >
                    "{session.partner.bio}"
                  </p>
                </div>

                {/* Botones de Acción: Signo & Perfil y Revelar/Match */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPartnerInfo(true)}
                    className="py-1 px-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 hover:text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer"
                    title="Ver panel del signo y descripción de perfil"
                  >
                    <Info size={11} className="text-cyan-300" />
                    <span>Signo & Perfil</span>
                  </button>

                  {!isRevealed ? (
                    <button
                      type="button"
                      onClick={() => handleTriggerReveal(false)}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:opacity-90 text-black font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Revelar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveToVinculos}
                      disabled={isSavedToVinculos}
                      className={`py-1.5 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition ${
                        isSavedToVinculos
                          ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg cursor-pointer'
                      }`}
                    >
                      <Heart size={13} className={isSavedToVinculos ? 'fill-emerald-400' : ''} />
                      <span>{isSavedToVinculos ? '¡Guardado!' : 'Hacer Match'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* ── ÁREA DE MENSAJES Y CONVERSACIÓN ── */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-gray-400">
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-medium rounded-tr-none'
                          : 'bg-white/10 text-white border border-white/10 rounded-tl-none backdrop-blur-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Indicador de compañero escribiendo */}
              {isPartnerTyping && (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/5 w-fit text-cyan-300 text-xs animate-pulse">
                  <Sparkles size={12} className="animate-spin" />
                  <span className="text-[11px] font-light">
                    {session.partner.name} está sintonizando una respuesta...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── PROMPTS RÁPIDOS / ROMPEHIELOS CELESTIALES ── */}
            <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles size={11} /> Preguntar:
              </span>
              {[
                '¿Qué te hace vibrar más alto?',
                '¿Crees en el destino o en las casualidades?',
                '¿Qué canción define tu energía hoy?'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleSendMessage(e, prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-[10px] whitespace-nowrap transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* ── BARRA DE ENVÍO DE MENSAJE ── */}
            <form onSubmit={handleSendMessage} className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Escribe a ${session.partner.name}...`}
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 disabled:opacity-30 text-white transition flex items-center justify-center cursor-pointer shadow-md"
              >
                <Send size={15} />
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div className="max-w-xs space-y-1.5">
              <h4 className="text-white font-bold text-sm mystic-font">
                No hay sintonizadores disponibles
              </h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                En este momento no hay otros usuarios reales disponibles para una nueva cita a ciegas. Puedes explorar perfiles en Citas o volver a intentarlo pronto.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={initSession}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-lg transition cursor-pointer"
              >
                Explorar Citas
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
