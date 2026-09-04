"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, ArrowLeft, Sparkles, UserCheck, Bot, Heart, Zap, MapPin,
  Mic, MicOff, Square, Play, Pause, Trash2, Check, CheckCheck, Loader2, Volume2, AlertCircle
} from 'lucide-react';
import { getZodiacSymbol } from '../../lib/astrology';
import { generateAstrologicalIcebreakers } from '../../lib/dating';
import { apiFetch } from '../../lib/api';
import { ZodiacBadge } from './ZodiacBadge';

/**
 * Reproductor Cósmico de Notas de Voz
 */
function AudioMessagePlayer({ audioUrl, duration = 8, isMine }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration || 8;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[190px] sm:min-w-[230px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
          isMine 
            ? 'bg-black/50 text-cyan-300 hover:bg-black/80 border border-white/20' 
            : 'bg-cyan-500 text-black hover:bg-cyan-400 font-bold'
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        {/* Onda de audio animada */}
        <div className="flex items-center gap-0.5 h-4">
          {[40, 75, 100, 60, 85, 45, 95, 65, 35, 80, 50, 75, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isMine ? 'bg-cyan-200' : 'bg-cyan-400'
              } ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
              style={{
                height: `${isPlaying ? Math.max(25, h * (0.6 + (i % 3) * 0.2)) : h}%`,
                animationDelay: `${i * 60}ms`
              }}
            />
          ))}
        </div>

        {/* Contador de tiempo */}
        <div className="flex items-center justify-between text-[9px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-0.5">
            <Volume2 size={9} /> {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tono cósmico sutil para mensajes entrantes (Web Audio API)
function playIncomingChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export const TabVinculos = ({ selectedUserId, onClearSelection, profile, currentUser }) => {
  const [vinculos, setVinculos]       = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeUser, setActiveUser]   = useState(null);

  const [messages, setMessages]       = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText]     = useState('');
  const [sending, setSending]         = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // ── Estados para Grabación de Notas de Voz ─────────────────────────────────
  const [isRecording, setIsRecording]         = useState(false);
  const [recordingTime, setRecordingTime]     = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef   = useRef(null);
  const audioChunksRef     = useRef([]);
  const recordingTimerRef  = useRef(null);
  const chatEndRef         = useRef(null);

  const mySign = profile?.sign || 'Escorpio';

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
    const interval = setInterval(fetchVinculos, 5000);
    return () => clearInterval(interval);
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

  const fetchMessages = async (userId, silent = false) => {
    if (!userId) return;
    try {
      if (!silent) setLoadingChat(true);
      const res = await apiFetch(`/api/messages?with=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(prev => {
            // Sonar tono cósmico si llegó un mensaje entrante nuevo del interlocutor
            const prevIds = new Set(prev.map(m => m.id));
            const newIncoming = data.filter(m => !prevIds.has(m.id) && m.sender_id === userId);
            if (newIncoming.length > 0 && prev.length > 0) {
              playIncomingChime();
            }
            return data;
          });
        }
      }
    } catch {
      // Silencioso
    } finally {
      if (!silent) setLoadingChat(false);
    }
  };

  // Sincronización en tiempo real durante el chat activo
  useEffect(() => {
    if (!activeUser) return;
    setLoadingChat(true);
    fetchMessages(activeUser.id, false);

    // 1. Polling de alta frecuencia cada 1.5s durante el chat activo
    const interval = setInterval(() => {
      fetchMessages(activeUser.id, true);
    }, 1500);

    // 2. Sincronización inmediata al cambiar de ventana o volver a la pestaña
    const handleFocusOrVisible = () => {
      fetchMessages(activeUser.id, true);
      fetchVinculos();
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // 3. Sincronización instantánea entre pestañas del mismo navegador (BroadcastChannel)
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('zodia_chat_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'message_sent') {
            fetchMessages(activeUser.id, true);
            fetchVinculos();
          }
        };
      } catch {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      if (channel) channel.close();
    };
  }, [activeUser?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping, isRecording]);

  // ── Grabación de Audio ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 20) {
            stopAndSendRecording();
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('Para enviar notas de voz, por favor habilita el permiso de micrófono en tu navegador.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    const finalDuration = recordingTime || 1;
    setIsRecording(false);
    setIsUploadingAudio(true);

    mediaRecorderRef.current.onstop = async () => {
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      try {
        const formData = new FormData();
        formData.append('file', audioBlob, `voice_${Date.now()}.webm`);
        formData.append('type', 'audio');

        const res = await apiFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          const audioPayload = JSON.stringify({
            type: 'audio',
            audioUrl: data.url,
            duration: finalDuration
          });
          await handleSendMessage(audioPayload);
        } else {
          alert('No se pudo subir la nota de voz. Inténtalo de nuevo.');
        }
      } catch (err) {
        console.error('Error subiendo audio:', err);
        alert('Ocurrió un error al enviar el audio.');
      } finally {
        setIsUploadingAudio(false);
        setRecordingTime(0);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // ── Envío de Mensajes (Texto o Audio) ──────────────────────────────────────
  const handleSendMessage = async (textToSend = null) => {
    const content = (textToSend || inputText).trim();
    if (!content || !activeUser || sending) return;

    if (!textToSend) setInputText('');
    setSending(true);

    const tempId = 'temp_' + Date.now();
    // Añadir mensaje optimista del usuario
    const optimisticMsg = {
      id: tempId,
      sender_id: 'me',
      receiver_id: activeUser.id,
      content,
      is_read: 0,
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
        // Notificar en tiempo real a otras pestañas activas
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('zodia_chat_sync');
            bc.postMessage({ type: 'message_sent', receiverId: activeUser.id });
            bc.close();
          } catch {}
        }

        setTimeout(async () => {
          await fetchMessages(activeUser.id, true);
          setIsBotTyping(false);
          fetchVinculos();
        }, isSimulated ? 1300 : 200);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Error entregando mensaje en API:', errData);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInputText(content);
        alert('No se pudo entregar el mensaje en el éter. Por favor intenta nuevamente.');
      }
    } catch (err) {
      console.error('Fallo de red al enviar mensaje:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(content);
      alert('Error de conexión cósmica al transmitir el mensaje.');
    } finally {
      setSending(false);
      setIsBotTyping(false);
    }
  };

  const handleBack = () => {
    cancelRecording();
    setActiveUser(null);
    if (onClearSelection) onClearSelection();
    fetchVinculos();
  };

  // Función auxiliar para parsear mensajes de tipo audio
  const parseAudio = (content) => {
    if (!content) return null;
    if (typeof content === 'string' && (content.startsWith('{"type":"audio"') || content.includes('"audioUrl"'))) {
      try {
        const parsed = JSON.parse(content);
        if (parsed?.type === 'audio') return parsed;
      } catch {}
    }
    return null;
  };

  // Separar matches recientes de conversaciones existentes
  const newMatches = vinculos.filter(v => v.isNewMatch || !v.lastMessage);
  const activeChats = vinculos.filter(v => v.lastMessage);

  // ── RENDER 1: PANTALLA DE CHAT ACTIVO ──────────────────────────────────────
  if (activeUser) {
    const zodiacSymbol = getZodiacSymbol(activeUser.sign);
    const icebreakers = generateAstrologicalIcebreakers(mySign, activeUser.sign, activeUser.name);

    return (
      <div className="space-y-3 animate-fadeIn px-2 sm:px-4 flex flex-col h-[76vh]">
        {/* Cabecera del Chat */}
        <div className="glass-panel p-3 flex items-center justify-between shadow-lg border border-cyan-500/30 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 text-gray-400 hover:text-cyan-400 transition rounded-full hover:bg-white/5 shrink-0"
              title="Volver a la lista"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black border-2 border-cyan-400/50 overflow-hidden flex items-center justify-center shadow-inner">
                {activeUser.image && activeUser.image !== '/assets/default-avatar.png' ? (
                  <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="text-cyan-400" size={20} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] text-white font-bold shadow-md">
                {zodiacSymbol}
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                {activeUser.name}
              </h4>
              <p className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{activeUser.sign} • Elemento {activeUser.element}</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-full text-cyan-300 font-extrabold text-[11px] flex items-center gap-1 shrink-0">
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
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">¡Hicieron Resonancia Astral!</h5>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 font-light">
                  {mySign} y {activeUser.sign} comparten una frecuencia única. Elige un rompehielos para comenzar:
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
              const isMine = 
                msg.sender_id === 'me' || 
                (currentUser?.id && (msg.sender_id === currentUser.id || msg.sender_id === currentUser.raw_id)) ||
                (currentUser?.email && msg.sender_id.toLowerCase() === currentUser.email.toLowerCase()) ||
                (msg.sender_id !== activeUser.id && msg.sender_id !== 'zodia_bot');
              const audioData = parseAudio(msg.content);
              const formattedTime = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 shadow-md ${
                      isMine
                        ? 'btn-mystic text-white rounded-2xl rounded-tr-none'
                        : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-none border border-white/10 backdrop-blur-md'
                    }`}
                  >
                    {audioData ? (
                      <AudioMessagePlayer
                        audioUrl={audioData.audioUrl}
                        duration={audioData.duration}
                        isMine={isMine}
                      />
                    ) : (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap font-light">{msg.content}</p>
                    )}

                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-cyan-200/80' : 'text-gray-400'}`}>
                      {formattedTime && <span className="text-[9px]">{formattedTime}</span>}
                      {isMine && (
                        <span title={msg.is_read ? 'Leído' : 'Entregado'}>
                          {msg.is_read ? (
                            <CheckCheck size={12} className="text-cyan-300 font-bold" />
                          ) : (
                            <Check size={12} className="text-cyan-200/70" />
                          )}
                        </span>
                      )}
                    </div>
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

          {isUploadingAudio && (
            <div className="flex justify-end">
              <div className="bg-cyan-500/20 text-cyan-300 rounded-2xl rounded-tr-none border border-cyan-400/40 px-3 py-1.5 text-xs flex items-center gap-2 animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Transmitiendo nota de voz al éter...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Barra de Rompehielos Cósmicos (Siempre Accesible Arriba del Input) */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar px-1">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> Rompehielos:
            </span>
            {icebreakers.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(prompt)}
                className="shrink-0 px-3 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[11px] text-gray-300 hover:text-white transition whitespace-nowrap flex items-center gap-1"
                title="Cargar en el mensaje"
              >
                <span>"{prompt.length > 35 ? prompt.slice(0, 35) + '...' : prompt}"</span>
              </button>
            ))}
          </div>
        )}

        {/* Barra de Envío y Grabación */}
        {isRecording ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-red-950/40 border border-red-500/40 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 px-3 text-red-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Grabando: {recordingTime}s / 20s máx</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/5 transition"
                title="Cancelar grabación"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="btn-mystic px-4 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send size={13} /> Enviar Audio
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Escribe a ${activeUser.name.split(' ')[0]}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 outline-none transition shadow-inner placeholder:text-gray-500"
            />

            {/* Botón para grabar nota de voz */}
            <button
              type="button"
              onClick={startRecording}
              className="p-3 text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition shadow-md"
              title="Grabar nota de voz (máx 20s)"
            >
              <Mic size={16} />
            </button>

            {/* Botón enviar texto */}
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="btn-mystic px-4 py-3 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-lg"
            >
              <Send size={16} />
            </button>
          </form>
        )}
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
                      <span>{u.name}</span>
                      {!u.lastMessageIsRead && !u.isSelfSender && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4] shrink-0" title="Mensaje sin leer" />
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-300 truncate max-w-[180px] sm:max-w-[280px] font-light mt-0.5">
                      {u.isSelfSender ? <span className="text-cyan-400 font-semibold">Tú: </span> : ''}
                      {u.lastMessage && typeof u.lastMessage === 'string' && u.lastMessage.startsWith('{"type":"audio"') ? '🎤 Nota de voz' : u.lastMessage}
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
