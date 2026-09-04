"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Plus, Camera, Image as ImageIcon, X, Loader2, 
  RefreshCw, Trash2, ArrowLeft, Link as LinkIcon, Check 
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { playSwipeLikeSound } from '../../lib/sound-effects';
import { AstralStoriesViewerModal } from './AstralStoriesViewerModal';
import { AstralPortalModal } from './AstralPortalModal';
import { compressImage } from '../../lib/media-processor';

// Historias garantizadas de la comunidad para que el carrusel nunca aparezca vacío
const DEFAULT_COMMUNITY_STORIES = [
  {
    userId: 'candidate_valeria',
    authorName: 'Valeria Ríos',
    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    authorSign: 'Leo',
    hasUnseen: true,
    stories: [
      {
        id: 'story_valeria_1',
        mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80',
        caption: 'Atardecer dorado en la ciudad... la energía de Leo hoy pide bailar y desconectar ✨🌅',
        vibeTag: '🔥 Energía Solar',
        createdAt: new Date().toISOString()
      },
      {
        id: 'story_valeria_2',
        mediaUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=80',
        caption: 'Probando nuevos cortes y colores para la colección de verano 🪡💫',
        vibeTag: '🎨 Creatividad',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    userId: 'candidate_mateo',
    authorName: 'Mateo Silva',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    authorSign: 'Piscis',
    hasUnseen: true,
    stories: [
      {
        id: 'story_mateo_1',
        mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&auto=format&fit=crop&q=80',
        caption: 'Café de especialidad y vinilos viejos. La tarde perfecta de desconexión ☕🎶',
        vibeTag: '🌊 Calma y Melodía',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    userId: 'candidate_camila',
    authorName: 'Camila Beltrán',
    authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    authorSign: 'Géminis',
    hasUnseen: true,
    stories: [
      {
        id: 'story_camila_1',
        mediaUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&auto=format&fit=crop&q=80',
        caption: 'Encontré esta librería escondida en el centro. La vibra es de otra época 📚🪐',
        vibeTag: '✨ Curiosidad',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    userId: 'candidate_lucas',
    authorName: 'Lucas Morales',
    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    authorSign: 'Aries',
    hasUnseen: true,
    stories: [
      {
        id: 'story_lucas_1',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
        caption: 'Cima alcanzada antes del amanecer. La vista no tiene precio 🏔️⚡',
        vibeTag: '🔥 Aventura & Montaña',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    userId: 'candidate_sofia',
    authorName: 'Sofía Carranza',
    authorImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    authorSign: 'Escorpio',
    hasUnseen: true,
    stories: [
      {
        id: 'story_sofia_1',
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
        caption: 'Cielo estrellado y noche de oráculo. Las cartas marcan transformación 🔮✨',
        vibeTag: '🌙 Mística',
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export function AstralStoriesRail({ currentUser, profile, compact = false }) {
  const [storyGroups, setStoryGroups] = useState(DEFAULT_COMMUNITY_STORIES);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeStoryGroupIdx, setActiveStoryGroupIdx] = useState(0);

  // Estados de creación de historia
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryVibe, setNewStoryVibe] = useState('✨ Reflexión');
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [publishStatusText, setPublishStatusText] = useState('');
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [storyFilePreview, setStoryFilePreview] = useState(null);
  const [storyFile, setStoryFile] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Estados de Cámara en vivo
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (trasera) o 'user' (selfie)
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Referencias a inputs de archivos ocultos
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [seenStoryIds, setSeenStoryIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('zodia_seen_stories') || '[]');
    } catch {
      return [];
    }
  });

  const fetchStories = async () => {
    try {
      const res = await apiFetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        const loaded = data.stories || data.userStories || [];
        if (Array.isArray(loaded) && loaded.length > 0) {
          setStoryGroups(loaded);
        }
      }
    } catch (err) {
      console.error("Error al sincronizar historias efímeras:", err);
    }
  };

  useEffect(() => {
    fetchStories();
    return () => {
      stopLiveCamera();
    };
  }, []);

  const handleStoryViewed = (storyId) => {
    setSeenStoryIds((prev) => {
      if (prev.includes(storyId)) return prev;
      const next = [...prev, storyId];
      try {
        localStorage.setItem('zodia_seen_stories', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // --- CONTROL DE CÁMARA EN VIVO ---
  const startLiveCamera = async (facing = 'environment') => {
    try {
      stopLiveCamera();
      if (!navigator?.mediaDevices?.getUserMedia) {
        // Dispositivo sin soporte de webcam en navegador: abrir cámara nativa del sistema
        cameraInputRef.current?.click();
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraFacing(facing);
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Cámara en vivo no disponible o denegada, usando selector nativo:', err);
      setIsCameraActive(false);
      cameraInputRef.current?.click();
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const w = video.videoWidth || 720;
      const h = video.videoHeight || 1280;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // Si es cámara frontal tipo selfie, espejar horizontalmente
      if (cameraFacing === 'user') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setStoryFilePreview(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `historia_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setStoryFile(file);
        }
      }, 'image/jpeg', 0.9);

      stopLiveCamera();
    } catch (err) {
      console.error('Error al capturar foto desde cámara:', err);
    }
  };

  // --- SELECCIÓN DE ARCHIVO (GALERÍA O CÁMARA NATIVA) ---
  const handleStoryFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopLiveCamera();

    try {
      setIsOptimizingImage(true);
      const compressed = await compressImage(file, 1536, 0.88);
      setStoryFilePreview(compressed.previewUrl);
      setStoryFile(compressed.file);
    } catch (err) {
      console.warn('Fallback compresión:', err);
      setStoryFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setStoryFilePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsOptimizingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCloseCreateStory = () => {
    stopLiveCamera();
    setIsCreateStoryOpen(false);
    setStoryFilePreview(null);
    setStoryFile(null);
    setNewStoryMediaUrl('');
    setNewStoryCaption('');
    setShowUrlInput(false);
  };

  // --- PUBLICACIÓN DE LA HISTORIA ---
  const handleCreateStorySubmit = async (e) => {
    e.preventDefault();
    const mediaToUpload = storyFilePreview || newStoryMediaUrl;
    if (!mediaToUpload && !newStoryCaption) return;

    try {
      setIsPublishingStory(true);
      setPublishStatusText('Optimizando historia...');

      let finalMediaUrl = newStoryMediaUrl;

      // Si tenemos un archivo local seleccionado o capturado con la cámara
      if (storyFile) {
        setPublishStatusText('Guardando imagen en la nube cósmica...');
        try {
          const formData = new FormData();
          formData.append('file', storyFile);
          formData.append('type', 'photo');

          const uploadRes = await apiFetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData?.url) {
              finalMediaUrl = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.warn('Fallback a imagen local base64:', uploadErr);
          finalMediaUrl = storyFilePreview;
        }
      }

      if (!finalMediaUrl && storyFilePreview) {
        finalMediaUrl = storyFilePreview;
      }

      setPublishStatusText('Publicando en el éter...');
      const res = await apiFetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: finalMediaUrl,
          caption: newStoryCaption,
          vibeTag: newStoryVibe,
          authorName: profile?.nombre_actual || currentUser?.name || 'Sintonizador',
          authorImage: profile?.user_image || currentUser?.image,
          authorSign: profile?.sign || 'Cosmos'
        })
      });

      if (res.ok) {
        playSwipeLikeSound();
        handleCloseCreateStory();
        fetchStories();
      }
    } catch (err) {
      console.error('Error publicando historia:', err);
    } finally {
      setIsPublishingStory(false);
      setPublishStatusText('');
    }
  };

  // Identificar las historias del usuario actual
  const myStoryGroupIdx = storyGroups.findIndex((g) =>
    g.userId === currentUser?.id ||
    g.userId === currentUser?.raw_id ||
    g.userId === profile?.user_id ||
    g.userId === 'me'
  );
  const myStoryGroup = myStoryGroupIdx >= 0 ? storyGroups[myStoryGroupIdx] : null;
  const hasMyStories = Boolean(myStoryGroup && myStoryGroup.stories?.length > 0);
  const otherStoryGroups = storyGroups.filter((g, idx) => idx !== myStoryGroupIdx);

  return (
    <div className={`glass-panel rounded-3xl border border-white/10 bg-[#070914]/90 shadow-lg ${
      compact ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'
    }`}>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-cyan-400" /> Historias Efímeras (24h)
        </span>
        <span className="text-[10px] text-cyan-400 font-medium">
          Desaparecen en 24h
        </span>
      </div>

      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
        {/* Item 1: Tu Historia */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              if (hasMyStories) {
                setActiveStoryGroupIdx(myStoryGroupIdx);
                setIsViewerOpen(true);
              } else {
                setIsCreateStoryOpen(true);
              }
            }}
            className={`relative p-0.5 rounded-full transition-transform group-hover:scale-105 ${
              hasMyStories
                ? 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-white/20 hover:bg-cyan-400/40'
            }`}
          >
            <img
              src={
                profile?.user_image ||
                currentUser?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`
              }
              alt="Tu historia"
              className="w-14 h-14 rounded-full object-cover border-2 border-black"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`;
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateStoryOpen(true);
              }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-cyan-500 text-black border-2 border-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
              title="Subir historia"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
          <span className="text-[10px] font-medium text-white max-w-[64px] truncate text-center">
            Tu historia
          </span>
        </div>

        {/* Demás historias de la comunidad */}
        {otherStoryGroups.map((group) => {
          const originalIdx = storyGroups.findIndex((g) => g.userId === group.userId);
          const hasUnseen = group.stories.some((s) => !seenStoryIds.includes(s.id));
          return (
            <div
              key={group.userId}
              onClick={() => {
                setActiveStoryGroupIdx(originalIdx >= 0 ? originalIdx : 0);
                setIsViewerOpen(true);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div
                className={`p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  hasUnseen
                    ? 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-amber-400 animate-[pulse_3s_infinite] shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/20'
                }`}
              >
                <img
                  src={
                    group.authorImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(group.authorName)}&background=06b6d4&color=fff`
                  }
                  alt={group.authorName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-black"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.authorName)}&background=06b6d4&color=fff`;
                  }}
                />
              </div>
              <span
                className={`text-[10px] max-w-[64px] truncate text-center font-medium ${
                  hasUnseen ? 'text-white font-bold' : 'text-gray-400'
                }`}
              >
                {group.authorName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Visor de Pantalla Completa de Historias */}
      <AstralStoriesViewerModal
        isOpen={isViewerOpen}
        storyGroups={storyGroups}
        initialGroupIndex={activeStoryGroupIdx}
        onClose={() => setIsViewerOpen(false)}
        onStoryViewed={handleStoryViewed}
      />

      {/* Modal Rediseñado para Subir Historia Cósmica (Renderizado en Document Body con Portal) */}
      <AstralPortalModal
        isOpen={isCreateStoryOpen}
        onClose={handleCloseCreateStory}
        maxWidth="max-w-md"
        className="bg-gradient-to-b from-[#0e1225] via-[#070914] to-black border border-cyan-500/30 p-4 sm:p-6"
      >
        {/* Inputs de Archivo Ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleStoryFileSelect}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleStoryFileSelect}
        />

        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="mystic-font text-base sm:text-lg font-bold text-white tracking-wide">
                Subir Historia Astral
              </h3>
              <p className="text-[11px] text-cyan-300/80 font-light">
                Visible para la comunidad durante 24 horas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseCreateStory}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO 1: MODO CÁMARA EN VIVO */}
        {isCameraActive ? (
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-h-[360px] w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-black shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Botón para cambiar de cámara (frontal / trasera) */}
              <button
                type="button"
                onClick={flipCamera}
                className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-cyan-500 hover:text-black transition shadow-lg cursor-pointer"
                title="Girar cámara"
              >
                <RefreshCw size={18} />
              </button>

              {/* Controles de Disparo en la parte inferior */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="p-2.5 rounded-full bg-black/60 text-gray-300 hover:text-white border border-white/20 transition cursor-pointer"
                  title="Cancelar"
                >
                  <ArrowLeft size={18} />
                </button>

                {/* Obturador principal */}
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  className="w-16 h-16 rounded-full bg-white border-4 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.8)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Tomar fotografía"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-black bg-white" />
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-full bg-black/60 text-cyan-300 hover:text-white border border-cyan-500/30 transition cursor-pointer"
                  title="Abrir app de cámara del sistema"
                >
                  <Camera size={18} />
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400">
              Alinea tu encuadre cósmico y presiona el obturador blanco para capturar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateStorySubmit} className="space-y-4">
            {/* CONTENIDO 2: PREVISUALIZACIÓN DE LA FOTO SELECCIONADA */}
            {storyFilePreview || newStoryMediaUrl ? (
              <div className="space-y-2.5">
                <div className="relative aspect-[3/4] max-h-[300px] mx-auto w-full max-w-[260px] rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-black/80 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                  <img
                    src={storyFilePreview || newStoryMediaUrl}
                    alt="Previsualización historia"
                    className="w-full h-full object-cover"
                  />

                  {/* Header simulado de historia */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                      <img
                        src={profile?.user_image || currentUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`}
                        alt="Avatar"
                        className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                      />
                      <span className="text-[10px] font-bold text-white">
                        {profile?.nombre_actual || currentUser?.name || 'Tú'}
                      </span>
                      <span className="text-[9px] text-cyan-300">24h</span>
                    </div>

                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/40 backdrop-blur-md">
                      {newStoryVibe}
                    </span>
                  </div>

                  {/* Leyenda en vivo en la foto */}
                  {newStoryCaption && (
                    <div className="absolute bottom-2 inset-x-2 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-white text-center leading-snug">
                      {newStoryCaption}
                    </div>
                  )}

                  {/* Botón para quitar foto */}
                  <button
                    type="button"
                    onClick={() => {
                      setStoryFilePreview(null);
                      setStoryFile(null);
                      setNewStoryMediaUrl('');
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-white transition shadow-md cursor-pointer pointer-events-auto"
                    title="Quitar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Acciones para cambiar o tomar otra foto */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Camera size={13} /> Tomar otra
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-purple-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ImageIcon size={13} /> Cambiar foto
                  </button>
                </div>
              </div>
            ) : (
              /* CONTENIDO 3: SELECTOR PRINCIPAL (CÁMARA vs GALERÍA) */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción 1: Usar Cámara en vivo */}
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    className="group relative p-4 rounded-2xl bg-gradient-to-b from-cyan-950/40 via-cyan-900/20 to-black border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex flex-col items-center text-center cursor-pointer active:scale-98"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all shadow-inner">
                      <Camera size={28} />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-200">
                      Tomar Foto
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 leading-tight">
                      Usa la cámara en vivo de tu dispositivo
                    </span>
                    <span className="mt-2.5 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Cámara
                    </span>
                  </button>

                  {/* Opción 2: Elegir de Galería */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="group relative p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 via-purple-900/20 to-black border border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all flex flex-col items-center text-center cursor-pointer active:scale-98"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all shadow-inner">
                      <ImageIcon size={28} />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-purple-200">
                      Subir de Galería
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1 leading-tight">
                      Sube fotos desde tu álbum o carrete
                    </span>
                    <span className="mt-2.5 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Galería
                    </span>
                  </button>
                </div>

                {/* Accesos secundarios: Cámara nativa directa y Enlace Web */}
                <div className="flex items-center justify-center gap-3 pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Camera size={12} /> Abrir app de cámara nativa
                  </button>
                  <span className="text-gray-600">•</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                  >
                    <LinkIcon size={12} /> Pegar URL web
                  </button>
                </div>

                {/* Input opcional de URL */}
                {showUrlInput && (
                  <div className="pt-2 animate-fadeIn">
                    <input
                      type="url"
                      value={newStoryMediaUrl}
                      onChange={(e) => setNewStoryMediaUrl(e.target.value)}
                      placeholder="Pega un enlace directo de imagen (https://...)"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Selector de Vibra Cósmica */}
            <div>
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Vibra Cósmica
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '✨ Reflexión',
                  '🔥 Energía Solar',
                  '💖 Amor Cósmico',
                  '🎨 Creatividad',
                  '🌊 Calma y Melodía',
                  '☕ Momento Diario',
                  '🌙 Mística',
                  '🪐 Tránsito Astral'
                ].map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => setNewStoryVibe(vibe)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      newStoryVibe === vibe
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensaje o Reflexión */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                  Mensaje o Leyenda
                </span>
                <span className="text-[10px] text-gray-500">
                  {newStoryCaption.length}/180
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={180}
                value={newStoryCaption}
                onChange={(e) => setNewStoryCaption(e.target.value)}
                placeholder="Escribe una reflexión, pensamiento cósmico o estado del día..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400 resize-none leading-relaxed"
              />
            </div>

            {/* Botón de Publicación con Gradiente Cósmico */}
            <button
              type="submit"
              disabled={(!storyFilePreview && !newStoryMediaUrl && !newStoryCaption) || isPublishingStory || isOptimizingImage}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                (!storyFilePreview && !newStoryMediaUrl && !newStoryCaption) || isPublishingStory || isOptimizingImage
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-95 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-98'
              }`}
            >
              {isOptimizingImage ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Optimizando imagen...
                </>
              ) : isPublishingStory ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {publishStatusText || 'Publicando en el éter...'}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Compartir Historia Cósmica (24h)
                </>
              )}
            </button>
          </form>
        )}
      </AstralPortalModal>
    </div>
  );
}
