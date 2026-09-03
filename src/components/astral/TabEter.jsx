"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Sparkles, Flame, Mountain, Wind, Droplets, Filter, ArrowRight, 
  MapPin, Heart, MessageCircle, X, Star, Shield, RotateCcw, 
  Zap, Search, ChevronRight, Check, Compass, SlidersHorizontal, Info, Eye,
  Play, Video
} from 'lucide-react';
import { getZodiacSymbol } from '../../lib/astrology';
import { generateAstrologicalIcebreakers, DATING_INTERESTS } from '../../lib/dating';
import { apiFetch } from '../../lib/api';
import { ZodiacBadge } from './ZodiacBadge';
import { MatchCelebrationModal } from './MatchCelebrationModal';
import { AstralPortalModal } from './AstralPortalModal';

export const TabEter = ({ profile, onSyncUser, userAvatar }) => {
  // Modo de visualización: 'swipe' (Tarjetas deslizables) | 'radar' (Cuadrícula con filtros)
  const [viewMode, setViewMode] = useState('swipe');

  // Listados de perfiles
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Deck de Swipe
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaProgress, setMediaProgress] = useState(0); // Progreso de 0 a 100%
  const [isHoldingMedia, setIsHoldingMedia] = useState(false); // Pausa al presionar
  const [swipedHistory, setSwipedHistory] = useState([]); // para Deshacer
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | 'up'

  // Drag / Touch gestures para Swipe
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Filtros del Radar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState('Todos');
  const [selectedSign, setSelectedSign] = useState('Todos');
  const [selectedIntent, setSelectedIntent] = useState('Todos');
  const [minAffinity, setMinAffinity] = useState(0);

  // Modales
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Perfil completo
  const [matchData, setMatchData] = useState(null); // Modal de celebración de match
  const [icebreakerModalCandidate, setIcebreakerModalCandidate] = useState(null); // Modal de rompehielos rápido

  // Cargar candidatos desde la API
  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedElement !== 'Todos') params.append('element', selectedElement);
      if (selectedSign !== 'Todos') params.append('sign', selectedSign);
      if (selectedIntent !== 'Todos') params.append('intent', selectedIntent);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (minAffinity > 0) params.append('minScore', minAffinity);

      const res = await apiFetch(`/api/resonances?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Error al conectar con la red de citas.');
      }
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
      setMediaIndex(0);
      setMediaProgress(0);
    } catch (err) {
      setError(err.message || 'No se pudo alcanzar la red astral.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedElement, selectedSign, selectedIntent, minAffinity]);

  // Manejar Like / Pass / Superlike
  const handleInteraction = async (type, candidateOverride = null) => {
    const targetCandidate = candidateOverride || candidates[currentIndex];
    if (!targetCandidate) return;

    // Animación de salida en Swipe
    if (!candidateOverride) {
      setSwipeDirection(type === 'like' ? 'right' : type === 'superlike' ? 'up' : 'left');
      setSwipedHistory(prev => [...prev, { candidate: targetCandidate, index: currentIndex }]);
    }

    try {
      const res = await apiFetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetCandidate.id,
          type
        })
      });
      const data = await res.json();

      // Si es un match mutuo, abrir celebración
      if (data.isMatch) {
        setMatchData({
          candidate: targetCandidate,
          userProfile: profile,
          userAvatar: userAvatar || profile?.user_image
        });
      }
    } catch (err) {
      console.error("Error al registrar interacción:", err);
    }

    // Avanzar a la siguiente tarjeta tras la animación
    setTimeout(() => {
      setSwipeDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setMediaIndex(0);
      setMediaProgress(0);
      if (!candidateOverride) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 280);
  };

  // Deshacer última tarjeta
  const handleRewind = () => {
    if (swipedHistory.length === 0 || currentIndex === 0) return;
    const lastSwiped = swipedHistory[swipedHistory.length - 1];
    setSwipedHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastSwiped.index);
    setMediaIndex(0);
    setMediaProgress(0);
  };

  // Navegación de multimedia (video / fotos) dentro de la tarjeta
  const handleNextMedia = (e, totalItems) => {
    if (e?.stopPropagation) e.stopPropagation();
    setMediaIndex(prev => (prev + 1) % totalItems);
    setMediaProgress(0);
  };

  const handlePrevMedia = (e, totalItems) => {
    if (e?.stopPropagation) e.stopPropagation();
    setMediaIndex(prev => (prev - 1 + totalItems) % totalItems);
    setMediaProgress(0);
  };

  // Gestos táctiles y ratón para arrastrar tarjeta (Swipe)
  const handleTouchStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsHoldingMedia(false);

    // Umbral para confirmar like / pass / superlike
    const threshold = 100;
    if (dragOffset.x > threshold) {
      handleInteraction('like');
    } else if (dragOffset.x < -threshold) {
      handleInteraction('pass');
    } else if (dragOffset.y < -threshold) {
      handleInteraction('superlike');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Candidato actual en el modo Swipe
  const currentCandidate = candidates[currentIndex];

  // Lista multimedia: Si contiene video_url, va de primero (índice 0), luego las fotos
  const mediaList = useMemo(() => {
    if (!currentCandidate) return [];
    const items = [];
    if (currentCandidate.video_url) {
      items.push({ type: 'video', url: currentCandidate.video_url });
    }
    const rawPhotos = currentCandidate.photos?.length 
      ? currentCandidate.photos 
      : [currentCandidate.image].filter(Boolean);
    
    rawPhotos.slice(0, 5).forEach(photoUrl => {
      items.push({ type: 'image', url: photoUrl });
    });

    return items.length > 0 ? items : [{ type: 'image', url: currentCandidate?.image || '/zodia/assets/ico.png' }];
  }, [currentCandidate]);

  // Resetear índice y progreso al cambiar de candidato
  useEffect(() => {
    setMediaIndex(0);
    setMediaProgress(0);
  }, [currentIndex]);

  // Temporizador de avance automático cada 5 segundos (estilo Stories)
  useEffect(() => {
    if (isDragging || isHoldingMedia || mediaList.length <= 1) return;

    const intervalTime = 50; // ms
    const totalDuration = 5000; // 5 segundos
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setMediaProgress(prev => {
        if (prev >= 100) {
          setMediaIndex(curr => (curr + 1) % mediaList.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isDragging, isHoldingMedia, mediaList.length, mediaIndex]);

  return (
    <div className="h-full flex flex-col justify-between animate-fadeIn px-1 sm:px-2">
      {/* ── SELECTOR SUPERIOR DE MODOS (SWIPE VS RADAR) ── */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl mb-1.5 shrink-0 max-w-sm sm:max-w-md mx-auto w-full">
        <button
          onClick={() => setViewMode('swipe')}
          className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'swipe'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles size={14} className="sm:w-4 sm:h-4" /> Sintonía (Swipe)
        </button>
        <button
          onClick={() => setViewMode('radar')}
          className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'radar'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Compass size={14} className="sm:w-4 sm:h-4" /> Radar con Filtros
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODO A: TARJETAS DESLIZABLES (SWIPE / DATING DECK)                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'swipe' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between items-center w-full max-w-sm sm:max-w-md mx-auto select-none">
          {loading ? (
            <div className="glass-panel p-12 text-center my-auto">
              <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-cyan-400 text-xs tracking-widest uppercase font-semibold animate-pulse">
                Alineando sintonías cósmicas...
              </p>
            </div>
          ) : !currentCandidate ? (
            <div className="glass-panel p-6 sm:p-8 text-center space-y-3 border border-cyan-500/20 my-auto">
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Sparkles size={26} className="animate-spin" />
              </div>
              <h3 className="mystic-font text-lg sm:text-xl text-white">Has explorado las sintonías cercanas</h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto font-light leading-relaxed">
                No hay más perfiles pendientes en este momento. Puedes reiniciar la baraja o explorar el Radar Cósmico con otros filtros.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setMediaIndex(0);
                    setMediaProgress(0);
                  }}
                  className="btn-mystic px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw size={14} /> Reiniciar Baraja
                </button>
                <button
                  onClick={() => setViewMode('radar')}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition"
                >
                  <Compass size={14} /> Abrir Radar Cósmico
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col justify-between items-center w-full select-none">
              {/* Tarjeta Principal */}
              <div
                className={`relative w-full flex-1 min-h-[220px] max-h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing shadow-[0_15px_45px_rgba(0,0,0,0.85)] border border-white/15 transition-transform duration-200 ${
                  swipeDirection === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' :
                  swipeDirection === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' :
                  swipeDirection === 'up' ? '-translate-y-[120%] opacity-0' : ''
                }`}
                style={{
                  transform: isDragging
                    ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.08}deg)`
                    : undefined
                }}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Contenido Multimedia (Video prioritario o Fotos en rotación) */}
                {mediaList[mediaIndex]?.type === 'video' ? (
                  <video
                    key={mediaList[mediaIndex]?.url}
                    src={mediaList[mediaIndex]?.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <img
                    src={mediaList[mediaIndex]?.url || currentCandidate.image}
                    alt={currentCandidate.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}

                {/* Badge flotante de Mini Video */}
                {mediaList[mediaIndex]?.type === 'video' && (
                  <div className="absolute top-6 left-3 sm:left-4 z-20">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 border border-sky-400/60 backdrop-blur-md text-sky-300 font-extrabold text-[10px] flex items-center gap-1 shadow-md animate-pulse">
                      <Play size={10} className="fill-sky-300" /> Mini Video 5s
                    </span>
                  </div>
                )}

                {/* Degradados de fondo para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none h-20" />

                {/* Badges de Swipe dinámicos (LIKE / NOPE / SUPERLIKE) */}
                {isDragging && dragOffset.x > 40 && (
                  <div className="absolute top-6 left-6 border-4 border-emerald-400 text-emerald-400 font-extrabold text-xl sm:text-2xl uppercase px-3 py-0.5 sm:px-4 sm:py-1 rounded-2xl rotate-[-15deg] shadow-[0_0_30px_rgba(52,211,153,0.8)] pointer-events-none animate-pulse z-30">
                    LIKE 💚
                  </div>
                )}
                {isDragging && dragOffset.x < -40 && (
                  <div className="absolute top-6 right-6 border-4 border-rose-500 text-rose-500 font-extrabold text-xl sm:text-2xl uppercase px-3 py-0.5 sm:px-4 sm:py-1 rounded-2xl rotate-[15deg] shadow-[0_0_30px_rgba(244,63,94,0.8)] pointer-events-none animate-pulse z-30">
                    PASAR ❌
                  </div>
                )}
                {isDragging && dragOffset.y < -40 && Math.abs(dragOffset.x) < 40 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-purple-400 text-purple-300 font-extrabold text-xl sm:text-2xl uppercase px-3 py-0.5 sm:px-4 sm:py-1 rounded-2xl shadow-[0_0_30px_rgba(192,132,252,0.8)] pointer-events-none animate-pulse z-30">
                    SUPERLIKE ⭐
                  </div>
                )}

                {/* Barras de progreso superiores (estilo Instagram Stories, cada 5 segundos) */}
                {mediaList.length > 1 && (
                  <div className="absolute top-2.5 inset-x-3 sm:inset-x-4 flex gap-1.5 z-30">
                    {mediaList.map((item, idx) => {
                      const isPast = idx < mediaIndex;
                      const isCurrent = idx === mediaIndex;
                      return (
                        <div key={idx} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden backdrop-blur-sm">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-75 ease-linear shadow-[0_0_8px_#ffffff]"
                            style={{
                              width: isPast ? '100%' : isCurrent ? `${mediaProgress}%` : '0%'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zonas de toque para cambiar fotos y mantener presionado para pausar */}
                <div
                  onClick={(e) => handlePrevMedia(e, mediaList.length)}
                  onMouseDown={() => setIsHoldingMedia(true)}
                  onMouseUp={() => setIsHoldingMedia(false)}
                  onTouchStart={() => setIsHoldingMedia(true)}
                  onTouchEnd={() => setIsHoldingMedia(false)}
                  className="absolute left-0 top-0 bottom-1/3 w-1/3 z-10"
                />
                <div
                  onClick={(e) => handleNextMedia(e, mediaList.length)}
                  onMouseDown={() => setIsHoldingMedia(true)}
                  onMouseUp={() => setIsHoldingMedia(false)}
                  onTouchStart={() => setIsHoldingMedia(true)}
                  onTouchEnd={() => setIsHoldingMedia(false)}
                  className="absolute right-0 top-0 bottom-1/3 w-2/3 z-10"
                />

                {/* Insignia Flotante Superior: % de Afinidad Cósmica */}
                <div className="absolute top-5 right-3 sm:right-4 z-20">
                  <div className="px-2.5 py-1 rounded-full bg-black/70 border border-cyan-400/60 backdrop-blur-md text-cyan-300 font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <Sparkles size={12} className="text-amber-400 animate-spin" />
                    {currentCandidate.affinity} Afinidad
                  </div>
                </div>

                {/* Información del Candidato (Inferior) */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-5 z-20 space-y-1 sm:space-y-2 pointer-events-none bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-10">
                  {/* Nombre, Edad e Insignia Zodiacal */}
                  <div className="flex items-end justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white mystic-font drop-shadow-md leading-tight">
                          {currentCandidate.name}
                        </h2>
                        {currentCandidate.age && (
                          <span className="text-base sm:text-xl font-light text-gray-200">
                            {currentCandidate.age}
                          </span>
                        )}
                        <ZodiacBadge sign={currentCandidate.sign} size="xs" className="shadow-md sm:hidden" />
                        <ZodiacBadge sign={currentCandidate.sign} size="sm" className="shadow-md hidden sm:block" />
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-300 mt-0.5 font-light">
                        <span className="text-cyan-400 font-semibold">{currentCandidate.sign}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">{currentCandidate.element}</span>
                        {currentCandidate.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-gray-300">
                              <MapPin size={10} className="text-cyan-400" />
                              {currentCandidate.location.split(',')[0]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botón de inspeccionar información */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(currentCandidate);
                      }}
                      className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 transition pointer-events-auto shadow-lg shrink-0"
                      title="Ver perfil completo"
                    >
                      <Info size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>

                  {/* Bio corta */}
                  {currentCandidate.bio && (
                    <p className="text-[11px] sm:text-xs text-gray-200 line-clamp-1 sm:line-clamp-2 leading-snug font-light italic drop-shadow">
                      "{currentCandidate.bio}"
                    </p>
                  )}

                  {/* Tags de intereses / pasiones */}
                  {currentCandidate.interests && currentCandidate.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5 items-center">
                      {currentCandidate.interests.slice(0, 3).map((tag, i) => {
                        const isShared = currentCandidate.sharedInterests?.includes(tag);
                        return (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium backdrop-blur-sm flex items-center gap-1 border ${
                              isShared
                                ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                : 'bg-black/50 border-white/15 text-gray-300'
                            }`}
                          >
                            {isShared && <Sparkles size={8} className="text-amber-300" />}
                            {tag}
                          </span>
                        );
                      })}
                      {currentCandidate.sharedInterests && currentCandidate.sharedInterests.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[8px] sm:text-[9px] font-bold text-emerald-300">
                          +{currentCandidate.sharedInterests.length * 4}% afín
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── BOTONERA FLOTANTE DE INTERACCIONES DE CITAS ── */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 pt-1.5 pb-0.5 w-full max-w-sm sm:max-w-md px-1 shrink-0 z-20">
                {/* 1. Deshacer */}
                <button
                  onClick={handleRewind}
                  disabled={swipedHistory.length === 0}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 border border-amber-500/40 text-amber-400 flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 transition shadow-md"
                  title="Deshacer última acción"
                >
                  <RotateCcw size={16} />
                </button>

                {/* 2. Pasar (Dislike) */}
                <button
                  onClick={() => handleInteraction('pass')}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/80 border-2 border-rose-500 text-rose-400 flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  title="Pasar perfil"
                >
                  <X size={22} className="sm:w-6 sm:h-6" />
                </button>

                {/* 3. SuperLike / Crush Cósmico */}
                <button
                  onClick={() => handleInteraction('superlike')}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                  title="SuperLike Cósmico"
                >
                  <Star size={17} className="fill-current" />
                </button>

                {/* 4. Sintonizar / Like */}
                <button
                  onClick={() => handleInteraction('like')}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border-2 border-emerald-400 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                  title="Sintonizar (Like)"
                >
                  <Heart size={22} className="fill-current sm:w-6 sm:h-6" />
                </button>

                {/* 5. Rompehielos Rápido */}
                <button
                  onClick={() => setIcebreakerModalCandidate(currentCandidate)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 border border-cyan-400/50 text-cyan-300 flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-md"
                  title="Enviar Rompehielos Directo"
                >
                  <Zap size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODO B: RADAR ASTRAL (CUADRÍCULA CON FILTROS Y BÚSQUEDA)              */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'radar' && (
        <div className="space-y-5">
          {/* Barra de Búsqueda y Filtros Rápidos */}
          <div className="glass-panel p-4 space-y-3 border border-cyan-500/20">
            {/* Input de Búsqueda */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCandidates()}
                placeholder="Buscar por nombre, signo, ciudad o interés..."
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-cyan-400 outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchCandidates();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filtros por Elemento */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pr-1 flex items-center gap-1">
                <Filter size={11} /> Elemento:
              </span>
              {[
                { name: 'Todos', icon: null },
                { name: 'Fuego', icon: <Flame size={12} className="text-amber-400" /> },
                { name: 'Tierra', icon: <Mountain size={12} className="text-emerald-400" /> },
                { name: 'Aire', icon: <Wind size={12} className="text-cyan-400" /> },
                { name: 'Agua', icon: <Droplets size={12} className="text-indigo-400" /> },
              ].map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedElement(f.name)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                    selectedElement === f.name
                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {f.icon} {f.name}
                </button>
              ))}
            </div>

            {/* Filtros por Intención */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pr-1">
                Intención:
              </span>
              {['Todos', 'Citas y Pareja', 'Conexión Casual', 'Amistad Cósmica'].map((intent) => (
                <button
                  key={intent}
                  onClick={() => setSelectedIntent(intent)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition whitespace-nowrap ${
                    selectedIntent === intent
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-400/50'
                      : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {intent}
                </button>
              ))}
            </div>
          </div>

          {/* Listado en Cuadrícula (Grid) */}
          {loading ? (
            <div className="glass-panel p-12 text-center">
              <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-cyan-400 text-xs tracking-widest uppercase">Escaneando radar...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-400 text-xs">
              No se encontraron sintonías con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className="glass-panel overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {/* Imagen y badges */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e19] via-transparent to-transparent" />
                    
                    {/* Badge Afinidad */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 border border-cyan-400/40 backdrop-blur-md text-cyan-300 font-extrabold text-[11px]">
                      {c.affinity}
                    </div>

                    {/* Badge Signo */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <ZodiacBadge sign={c.sign} size="xs" />
                      <span className="text-xs font-bold text-white drop-shadow">
                        {c.name}{c.age ? `, ${c.age}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
                        <span className="text-cyan-400">{c.sign}</span>
                        <span>•</span>
                        <span className="text-amber-400">{c.element}</span>
                        {c.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{c.location}</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 line-clamp-2 italic font-light">
                        "{c.bio || 'Buscando almas afines para compartir momentos astrales.'}"
                      </p>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraction('like', c);
                        }}
                        className="btn-mystic flex-1 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md"
                      >
                        <Heart size={14} className="fill-current" /> Sintonizar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIcebreakerModalCandidate(c);
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/10 transition"
                        title="Enviar rompehielos"
                      >
                        <Zap size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: INSPECCIONAR PERFIL COMPLETO (PORTAL CENTRADO AISLADO)          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AstralPortalModal
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        maxWidth="max-w-md"
      >
        {selectedCandidate && (
          <div className="space-y-4">
            {/* Header del modal */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={14} /> Perfil Astral
              </span>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar y Datos Principales */}
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <img
                  src={selectedCandidate.image}
                  alt={selectedCandidate.name}
                  className="w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] object-cover bg-black mx-auto"
                />
                <ZodiacBadge sign={selectedCandidate.sign} size="md" className="absolute -bottom-1 -right-1 border-2 border-black" />
              </div>

              <h3 className="text-2xl font-bold mystic-font text-white">
                {selectedCandidate.name}{selectedCandidate.age ? `, ${selectedCandidate.age}` : ''}
              </h3>
              <p className="text-xs text-cyan-300 font-semibold">
                {selectedCandidate.sign} • Elemento {selectedCandidate.element}
              </p>

              <div className="flex justify-center items-center gap-2 pt-1">
                {selectedCandidate.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-gray-300 text-xs">
                    <MapPin size={12} className="text-cyan-400" /> {selectedCandidate.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs">
                  {selectedCandidate.affinity} Afinidad
                </span>
              </div>
            </div>

            {/* Multimedia de Presentación (Video y Fotos) */}
            {(selectedCandidate.video_url || (selectedCandidate.photos && selectedCandidate.photos.length > 0)) && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  Multimedia de Presentación
                </span>
                {selectedCandidate.video_url && (
                  <div className="relative rounded-2xl overflow-hidden border border-sky-400/40 bg-black mb-2">
                    <video
                      src={selectedCandidate.video_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-44 object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-md border border-sky-400/40 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Play size={10} className="fill-sky-300" /> Mini Video 5s
                    </span>
                  </div>
                )}
                {selectedCandidate.photos && selectedCandidate.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCandidate.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Foto ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-white/10 bg-black/40"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Biografía / Sobre mí */}
            {selectedCandidate.bio && (
              <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Sobre Mí
                </span>
                <p className="text-xs text-gray-200 leading-relaxed italic font-light">
                  "{selectedCandidate.bio}"
                </p>
              </div>
            )}

            {/* Pasiones & Intereses */}
            {selectedCandidate.interests && selectedCandidate.interests.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  Pasiones & Sintonías
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.interests.map((tag, i) => {
                    const isShared = selectedCandidate.sharedInterests?.includes(tag);
                    return (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 border ${
                          isShared
                            ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-purple-500/10 border-purple-400/30 text-purple-300'
                        }`}
                      >
                        {isShared && <Sparkles size={11} className="text-amber-300" />}
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Datos Astrales Clave */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Star size={16} className="text-amber-400 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Camino de Vida</span>
                  <span className="text-white font-bold">{selectedCandidate.path || 7}</span>
                </div>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Shield size={16} className="text-purple-400 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Arquetipo</span>
                  <span className="text-white font-bold text-[11px] truncate block max-w-[100px]">
                    {selectedCandidate.archetype || 'El Ermitaño'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Sintonizar */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  handleInteraction('like', cand);
                }}
                className="btn-mystic flex-1 py-3.5 rounded-2xl text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Heart size={16} className="fill-current" /> Sintonizar (Like)
              </button>
              <button
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  setIcebreakerModalCandidate(cand);
                }}
                className="px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/10 flex items-center justify-center transition"
                title="Rompehielos"
              >
                <Zap size={18} />
              </button>
            </div>
          </div>
        )}
      </AstralPortalModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ROMPEHIELOS RÁPIDO (PORTAL CENTRADO AISLADO)                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AstralPortalModal
        isOpen={Boolean(icebreakerModalCandidate)}
        onClose={() => setIcebreakerModalCandidate(null)}
        maxWidth="max-w-sm"
      >
        {icebreakerModalCandidate && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-amber-400" /> Rompehielos con {icebreakerModalCandidate.name.split(' ')[0]}
              </h3>
              <button onClick={() => setIcebreakerModalCandidate(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-300 font-light">
              Toca una de estas preguntas astrológicas para romper el hielo e iniciar la conversación:
            </p>

            <div className="space-y-2">
              {generateAstrologicalIcebreakers(
                profile?.sign || 'Capricornio',
                icebreakerModalCandidate.sign,
                icebreakerModalCandidate.name
              ).map((prompt, i) => (
                <button
                  key={i}
                  onClick={async () => {
                    const target = icebreakerModalCandidate;
                    setIcebreakerModalCandidate(null);
                    // Registrar resonancia
                    try {
                      await apiFetch('/api/resonances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetUserId: target.id, score: 90 })
                      });
                      // Enviar el mensaje
                      await apiFetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ receiverId: target.id, content: prompt })
                      });
                    } catch { /* continuar */ }
                    if (onSyncUser) onSyncUser(target.id);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-xs text-gray-200 hover:text-cyan-300 transition leading-relaxed"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
      </AstralPortalModal>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CELEBRACIÓN DE MATCH CÓSMICO (IT'S A MATCH!)                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {matchData && (
        <MatchCelebrationModal
          matchData={matchData}
          onClose={() => setMatchData(null)}
          onStartChat={(candidate) => {
            setMatchData(null);
            if (onSyncUser) onSyncUser(candidate.id);
          }}
        />
      )}
    </div>
  );
};
