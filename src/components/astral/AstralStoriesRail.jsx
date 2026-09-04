"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Camera, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { playSwipeLikeSound } from '../../lib/sound-effects';
import { AstralStoriesViewerModal } from './AstralStoriesViewerModal';

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
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryVibe, setNewStoryVibe] = useState('✨ Reflexión');
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [storyFilePreview, setStoryFilePreview] = useState(null);
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

  const handleCreateStorySubmit = async (e) => {
    e.preventDefault();
    const mediaToUpload = storyFilePreview || newStoryMediaUrl;
    if (!mediaToUpload && !newStoryCaption) return;

    try {
      setIsPublishingStory(true);
      const res = await apiFetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: mediaToUpload,
          caption: newStoryCaption,
          vibeTag: newStoryVibe,
          authorName: profile?.nombre_actual || currentUser?.name || 'Sintonizador',
          authorImage: profile?.user_image || currentUser?.image,
          authorSign: profile?.sign || 'Cosmos'
        })
      });

      if (res.ok) {
        playSwipeLikeSound();
        setIsCreateStoryOpen(false);
        setStoryFilePreview(null);
        setNewStoryMediaUrl('');
        setNewStoryCaption('');
        fetchStories();
      }
    } catch (err) {
      console.error('Error publicando historia:', err);
    } finally {
      setIsPublishingStory(false);
    }
  };

  const handleStoryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStoryFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
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

      {/* Modal para Crear Nueva Historia Efímera */}
      {isCreateStoryOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-black to-[#0d0a1d] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black shadow-lg">
                <Sparkles size={24} />
              </div>
              <h3 className="mystic-font text-lg sm:text-xl font-bold text-white">
                Compartir Historia Cósmica
              </h3>
              <p className="text-xs text-gray-400 font-light mt-0.5">
                Visible para toda la comunidad durante las próximas 24 horas
              </p>
            </div>

            <form onSubmit={handleCreateStorySubmit} className="space-y-4">
              {/* Selector de Foto o Previsualización */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-cyan-500/40 bg-black/60 flex items-center justify-center">
                {storyFilePreview || newStoryMediaUrl ? (
                  <>
                    <img
                      src={storyFilePreview || newStoryMediaUrl}
                      alt="Preview Historia"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setStoryFilePreview(null);
                        setNewStoryMediaUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-black cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-6 text-center text-cyan-300 gap-2 hover:opacity-90 transition">
                    <div className="p-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                      <Camera size={26} className="text-cyan-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Subir Foto o Captura
                    </span>
                    <span className="text-[10px] text-gray-400 font-light">
                      JPG, PNG o WebP de tu día cósmico
                    </span>
                    <input type="file" accept="image/*" hidden onChange={handleStoryFileSelect} />
                  </label>
                )}
              </div>

              {/* Opcional: URL de imagen */}
              {!storyFilePreview && (
                <div>
                  <input
                    type="url"
                    value={newStoryMediaUrl}
                    onChange={(e) => setNewStoryMediaUrl(e.target.value)}
                    placeholder="O pega una URL de imagen..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Selector de Vibra de la Historia */}
              <div>
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Vibra Cósmica
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '🔥 Energía Solar',
                    '🎨 Creatividad',
                    '🌊 Calma y Melodía',
                    '✨ Reflexión',
                    '💖 Conexión',
                    '☕ Momento Diario'
                  ].map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => setNewStoryVibe(vibe)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        newStoryVibe === vibe
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto o Reflexión */}
              <div>
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Mensaje o Leyenda
                </span>
                <textarea
                  rows={2}
                  value={newStoryCaption}
                  onChange={(e) => setNewStoryCaption(e.target.value)}
                  placeholder="Escribe algo sobre este momento estelar..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400 resize-none leading-relaxed"
                />
              </div>

              {/* Botón de Publicación */}
              <button
                type="submit"
                disabled={(!storyFilePreview && !newStoryMediaUrl && !newStoryCaption) || isPublishingStory}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  (!storyFilePreview && !newStoryMediaUrl && !newStoryCaption) || isPublishingStory
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-98'
                }`}
              >
                {isPublishingStory ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Publicando en el éter...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Compartir Historia (24h)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
