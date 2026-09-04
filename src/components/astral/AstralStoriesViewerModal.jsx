"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Send, Heart, Sparkles, 
  Clock, Flame, MessageCircle, Check, Loader2 
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { apiFetch } from '../../lib/api';
import { playMessageSentSound, playSwipeLikeSound } from '../../lib/sound-effects';

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

  useEffect(() => {
    setCurrentGroupIdx(initialGroupIndex);
    setCurrentStoryIdx(0);
    setProgress(0);
  }, [initialGroupIndex, isOpen]);

  const currentGroup = storyGroups[currentGroupIdx] || null;
  const stories = currentGroup?.stories || [];
  const currentStory = stories[currentStoryIdx] || null;

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

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-2xl flex items-center justify-center animate-fadeIn select-none">
      
      {/* Contenedor central simulador de móvil de historias */}
      <div 
        className="relative w-full max-w-md h-[95vh] max-h-[850px] bg-slate-950 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.3)] border border-white/10 flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >

        {/* ── BARRAS DE PROGRESO SUPERIORES ── */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-3.5 flex gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {stories.map((s, idx) => {
            let width = '0%';
            if (idx < currentStoryIdx) width = '100%';
            else if (idx === currentStoryIdx) width = `${progress}%`;

            return (
              <div key={s.id || idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full transition-all duration-75 ease-linear"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* ── HEADER DE AUTOR DE LA HISTORIA ── */}
        <div className="absolute top-6 inset-x-0 z-30 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 shadow-md">
              <img
                src={currentGroup.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentGroup.authorName)}&background=06b6d4&color=fff`}
                alt={currentGroup.authorName}
                className="w-10 h-10 rounded-full object-cover border border-black"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xs font-bold mystic-font tracking-wider drop-shadow-md">
                  {currentGroup.authorName}
                </span>
                {currentGroup.authorSign && (
                  <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-bold text-cyan-300">
                    {currentGroup.authorSign}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-300 drop-shadow flex items-center gap-1">
                <Clock size={10} className="text-cyan-400" />
                24h Efímero
              </span>
            </div>
          </div>

          {/* Botón de cierre */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition backdrop-blur-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── IMAGEN / CONTENIDO MULTIMEDIA ── */}
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center overflow-hidden">
          {currentStory.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt="Historia Astral"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-950 via-purple-950 to-black">
              <Sparkles size={48} className="text-cyan-400 mb-4 animate-spin-slow" />
              <p className="mystic-font text-lg text-white font-medium italic">
                "{currentStory.caption}"
              </p>
            </div>
          )}

          {/* Gradiente inferior para legibilidad del texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
        </div>

        {/* ── ZONAS DE TOQUE LATERALES (IZQ / DER) ── */}
        <div className="absolute inset-0 z-20 flex">
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

        {/* ── PIE DE LA HISTORIA: CAPTION, VIBE & RESPUESTA DIRECTA ── */}
        <div className="relative z-30 p-4 pt-0 space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent">
          
          {/* Tag de vibra y texto */}
          {currentStory.vibeTag && (
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold tracking-wider backdrop-blur-md">
              {currentStory.vibeTag}
            </span>
          )}

          {currentStory.caption && (
            <p className="text-xs sm:text-sm text-white font-light leading-snug drop-shadow-md">
              {currentStory.caption}
            </p>
          )}

          {/* Respuestas rápidas de emojis */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {['✨', '🔥', '💖', '🪐', '💫'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickReaction(emoji);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 hover:scale-125 transition flex items-center justify-center text-sm backdrop-blur-md active:scale-95"
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

          {/* Formulario de respuesta al chat */}
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
                className="w-full bg-black/60 border border-white/20 rounded-2xl py-2 pl-3.5 pr-9 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md"
              />
              {replySent && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400">
                  <Check size={14} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className={`p-2 rounded-2xl transition flex items-center justify-center cursor-pointer ${
                replyText.trim() && !isSendingReply
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black hover:scale-105'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
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

      {/* Flechas flotantes para desktop */}
      {currentGroupIdx > 0 && (
        <button
          type="button"
          onClick={handlePrevStory}
          className="hidden md:flex absolute left-8 p-3 rounded-full bg-black/50 hover:bg-black text-white/80 hover:text-white transition backdrop-blur-md border border-white/10 shadow-xl"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {currentGroupIdx < storyGroups.length - 1 && (
        <button
          type="button"
          onClick={handleNextStory}
          className="hidden md:flex absolute right-8 p-3 rounded-full bg-black/50 hover:bg-black text-white/80 hover:text-white transition backdrop-blur-md border border-white/10 shadow-xl"
        >
          <ChevronRight size={28} />
        </button>
      )}

    </div>
  );
}
