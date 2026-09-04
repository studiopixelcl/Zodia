"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ChevronLeft, ChevronRight, Send, Heart, Sparkles, 
  Clock, Flame, MessageCircle, Check, Loader2 
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { playMessageSentSound, playSwipeLikeSound } from '../../lib/sound-effects';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '24h';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `hace ${diffMins}m`;
    }
    return `hace ${diffHours}h`;
  } catch {
    return '24h';
  }
}

export function AstralStoriesViewerModal({ 
  isOpen, 
  storyGroups = [], 
  initialGroupIndex = 0, 
  onClose,
  onStoryViewed
}) {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [likedReaction, setLikedReaction] = useState(false);

  const timerRef = useRef(null);
  const STORY_DURATION_MS = 5000;
  const PROGRESS_INTERVAL_MS = 50;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentGroupIdx(initialGroupIndex);
    setCurrentStoryIdx(0);
    setProgress(0);
  }, [initialGroupIndex, isOpen]);

  const currentGroup = storyGroups[currentGroupIdx] || storyGroups[0] || null;
  const stories = currentGroup?.stories || [];
  const currentStory = stories[currentStoryIdx] || stories[0] || null;

  // Marcar como visto al cargar una historia
  useEffect(() => {
    if (isOpen && currentStory && onStoryViewed) {
      onStoryViewed(currentStory.id);
    }
  }, [isOpen, currentStory, onStoryViewed]);

  // Manejo del temporizador de avance automático de 5 segundos
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const step = (PROGRESS_INTERVAL_MS / STORY_DURATION_MS) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, PROGRESS_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentStoryIdx, currentGroupIdx, isPaused, currentStory]);

  const handleNextStory = () => {
    setProgress(0);
    setLikedReaction(false);
    setReplySent(false);

    if (currentStoryIdx < stories.length - 1) {
      // Siguiente historia del mismo usuario
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentGroupIdx < storyGroups.length - 1) {
      // Siguiente usuario en el carrusel
      setCurrentGroupIdx((prev) => prev + 1);
      setCurrentStoryIdx(0);
    } else {
      // Fin de todas las historias
      onClose();
    }
  };

  const handlePrevStory = () => {
    setProgress(0);
    setLikedReaction(false);
    setReplySent(false);

    if (currentStoryIdx > 0) {
      // Historia previa del mismo usuario
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentGroupIdx > 0) {
      // Usuario anterior
      const prevGroup = storyGroups[currentGroupIdx - 1];
      setCurrentGroupIdx((prev) => prev - 1);
      setCurrentStoryIdx((prevGroup.stories?.length || 1) - 1);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || isSendingReply || !currentGroup) return;

    try {
      setIsSendingReply(true);
      // Enviar como mensaje al chat del usuario
      await apiFetch('/api/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: currentGroup.userId,
          content: `✨ Respondió a tu Historia Astral: "${replyText.trim()}"`
        })
      });

      playMessageSentSound();
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      console.error('Error enviando respuesta a la historia:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleQuickReaction = async (emoji) => {
    if (!currentGroup) return;
    setLikedReaction(true);
    playSwipeLikeSound();
    try {
      await apiFetch('/api/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: currentGroup.userId,
          content: `${emoji} Reaccionó a tu Historia Cósmica`
        })
      });
    } catch (err) {
      console.error('Error enviando reacción:', err);
    }
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStoryIdx, currentGroupIdx, stories.length]);

  if (!isOpen || !currentGroup || !currentStory || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-2xl flex items-center justify-center animate-fadeIn select-none" 
      style={{ margin: 0 }}
      onClick={onClose}
    >
      
      {/* Contenedor central simulador de móvil de historias */}
      <div 
        className="relative w-full max-w-[420px] h-[92vh] max-h-[820px] bg-black rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_35px_rgba(6,182,212,0.35)] border border-white/15 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >

        {/* ── 1. FONDO MULTIMEDIA (ABSOLUTE DETRÁS DE TODO) ── */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
          {currentStory.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt="Historia Astral"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
              <Sparkles size={48} className="text-cyan-400 mb-4 animate-spin-slow" />
              <p className="mystic-font text-lg text-white font-medium italic">
                "{currentStory.caption}"
              </p>
            </div>
          )}

          {/* Gradientes oscuros superior e inferior para legibilidad perfecta */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none" />
        </div>

        {/* ── 2. ZONAS DE TOQUE LATERALES (Z-10) ── */}
        <div className="absolute inset-0 z-10 flex pointer-events-auto">
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
          />
          <div 
            className="w-2/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
          />
        </div>

        {/* ── 3. SECCIÓN SUPERIOR IN-FLOW (BARRAS DE PROGRESO + AUTOR) (Z-30) ── */}
        <div className="relative z-30 p-3 pt-3.5 space-y-3 pointer-events-none">
          
          {/* Barras de progreso segmentadas */}
          <div className="flex gap-1.5 w-full">
            {stories.map((s, idx) => {
              let width = '0%';
              if (idx < currentStoryIdx) width = '100%';
              else if (idx === currentStoryIdx) width = `${progress}%`;

              return (
                <div key={s.id || idx} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full transition-all duration-75 ease-linear"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          {/* Header de Autor y Botón Cerrar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 shadow-md shrink-0">
                <img
                  src={currentGroup.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentGroup.authorName)}&background=06b6d4&color=fff`}
                  alt={currentGroup.authorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-black"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-xs sm:text-sm font-bold mystic-font tracking-wide drop-shadow truncate">
                    {currentGroup.authorName}
                  </span>
                  {currentGroup.authorSign && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/25 border border-cyan-400/40 text-[9px] font-bold text-cyan-300">
                      {currentGroup.authorSign}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-300 drop-shadow">
                  <span className="flex items-center gap-1">
                    <Clock size={10} className="text-cyan-400" />
                    {formatTimeAgo(currentStory.createdAt)}
                  </span>
                  {currentStory.vibeTag && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-cyan-300 font-semibold px-1.5 py-0.2 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                        {currentStory.vibeTag}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition backdrop-blur-md cursor-pointer shrink-0 ml-2 shadow-lg"
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 4. SECCIÓN INFERIOR IN-FLOW (CAPTION + REACCIONES + RESPUESTA) (Z-30) ── */}
        <div className="relative z-30 p-4 space-y-3 pointer-events-auto">
          
          {/* Mensaje / Caption de la Historia (En tarjeta translúcida de lectura cómoda) */}
          {currentStory.caption && (
            <div className="p-3 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 shadow-xl">
              <p className="text-xs sm:text-sm text-white font-normal leading-relaxed drop-shadow">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Reacciones Rápidas con Emojis */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {['✨', '🔥', '💖', '🪐', '💫'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReaction(emoji);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 hover:scale-125 transition flex items-center justify-center text-sm backdrop-blur-md active:scale-95 cursor-pointer shadow-md"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {likedReaction && (
              <span className="text-[10px] text-pink-400 font-bold flex items-center gap-1 animate-pulse">
                <Heart size={12} className="fill-pink-400" /> ¡Enviado!
              </span>
            )}
          </div>

          {/* Formulario para Responder al Chat */}
          <form 
            onSubmit={handleSendReply}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={`Responder a ${currentGroup.authorName.split(' ')[0]}...`}
                className="w-full bg-black/65 border border-white/20 rounded-full py-2.5 pl-4 pr-10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition shadow-inner"
              />
              {replySent && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                  <Check size={14} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className={`p-2.5 rounded-full transition flex items-center justify-center cursor-pointer ${
                replyText.trim() && !isSendingReply
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black hover:scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
              title="Enviar respuesta al chat"
            >
              {isSendingReply ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>

        </div>

      </div>

      {/* Flechas flotantes para navegación en pantallas medianas / grandes */}
      {currentGroupIdx > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevStory();
          }}
          className="hidden md:flex absolute left-8 p-3 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white transition backdrop-blur-md border border-white/15 shadow-xl cursor-pointer"
          title="Usuario anterior"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {currentGroupIdx < storyGroups.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextStory();
          }}
          className="hidden md:flex absolute right-8 p-3 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white transition backdrop-blur-md border border-white/15 shadow-xl cursor-pointer"
          title="Siguiente usuario"
        >
          <ChevronRight size={28} />
        </button>
      )}

    </div>,
    document.body
  );
}
