"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Flame, Heart, Compass, Send, MessageCircle, Image, 
  Smile, Share2, Filter, ChevronDown, ChevronUp, User, Globe, 
  RotateCcw, Check, Plus, AlertCircle, Loader2, Camera, UploadCloud, X
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { apiFetch } from '../../lib/api';
import { playSwipeLikeSound, playMessageSentSound } from '../../lib/sound-effects';
import { AstralStoriesViewerModal } from './AstralStoriesViewerModal';

const VIBE_TAGS = [
  '🪐 Tránsitos',
  '✨ Reflexión',
  '🎵 Música',
  '💖 Amor',
  '🔮 Pregunta Cósmica',
  '🌿 Estilo de Vida'
];

function formatTimeAgo(dateString) {
  if (!dateString) return 'hace un momento';
  const now = new Date();
  const past = new Date(dateString);
  const diffSecs = Math.floor((now - past) / 1000);

  if (diffSecs < 60) return 'hace unos segundos';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

export function TabResonanciasFeed({ profile, currentUser, onNavigateToUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState('Todos');

  // Estado del creador de posts
  const [newContent, setNewContent] = useState('');
  const [newVibeTag, setNewVibeTag] = useState(VIBE_TAGS[1]);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Estados de comentarios expandidos por postId
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [postCommentsMap, setPostCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState(null);

  // Estados para Historias Efímeras Cósmicas (Stories 24h)
  const [storyGroups, setStoryGroups] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
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
      setLoadingStories(true);
      const res = await apiFetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        setStoryGroups(data.stories || []);
      }
    } catch (err) {
      console.error("Error al cargar historias:", err);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleStoryViewed = (storyId) => {
    setSeenStoryIds(prev => {
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
          vibeTag: newStoryVibe
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

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const query = selectedVibe !== 'Todos' ? `?vibe=${encodeURIComponent(selectedVibe.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim())}` : '';
      const res = await apiFetch(`/api/feed${query}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error al cargar feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedVibe]);

  // Publicar nuevo pensamiento cósmico
  const handlePublishPost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || publishing) return;

    setPublishing(true);
    try {
      const res = await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_post',
          content: newContent.trim(),
          vibeTag: newVibeTag,
          mediaUrl: mediaUrlInput.trim() || null,
          authorName: profile?.nombre_actual || currentUser?.name || 'Sintonizador',
          authorImage: profile?.user_image || currentUser?.image,
          authorSign: profile?.sign || 'Cosmos',
          authorElement: profile?.element || 'Éter'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          playMessageSentSound();
          setPosts(prev => [data.post, ...prev]);
          setNewContent('');
          setMediaUrlInput('');
          setShowMediaInput(false);
        }
      }
    } catch (err) {
      console.error("Error publicando en el feed:", err);
    } finally {
      setPublishing(false);
    }
  };

  // Reaccionar (toggle)
  const handleReaction = async (postId, reactionType) => {
    // Feedback sonoro inmediato
    playSwipeLikeSound();

    // Actualización optimista
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const userReactions = p.userReactions || [];
      const hasReacted = userReactions.includes(reactionType);
      const currentReactions = { ...(p.reactions || { resonate: 0, fire: 0, love: 0, cosmos: 0 }) };

      if (hasReacted) {
        currentReactions[reactionType] = Math.max(0, (currentReactions[reactionType] || 1) - 1);
        return {
          ...p,
          reactions: currentReactions,
          userReactions: userReactions.filter(r => r !== reactionType)
        };
      } else {
        currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
        return {
          ...p,
          reactions: currentReactions,
          userReactions: [...userReactions, reactionType]
        };
      }
    }));

    try {
      await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react',
          postId,
          type: reactionType
        })
      });
    } catch (err) {
      console.error("Error al registrar reacción:", err);
    }
  };

  // Abrir o cerrar comentarios y cargarlos
  const toggleComments = async (postId) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      return;
    }

    setOpenCommentsPostId(postId);
    if (!postCommentsMap[postId]) {
      setLoadingCommentsPostId(postId);
      try {
        const res = await apiFetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_comments', postId })
        });
        if (res.ok) {
          const data = await res.json();
          setPostCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch (err) {
        console.error("Error cargando comentarios:", err);
      } finally {
        setLoadingCommentsPostId(null);
      }
    }
  };

  // Enviar comentario
  const handleSendComment = async (postId, e) => {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    // Limpiar input
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    const tempComment = {
      id: 'c_temp_' + Date.now(),
      post_id: postId,
      author_name: profile?.nombre_actual || currentUser?.name || 'Sintonizador',
      author_image: profile?.user_image || currentUser?.image,
      author_sign: profile?.sign || 'Cosmos',
      content: commentText,
      created_at: new Date().toISOString()
    };

    setPostCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment]
    }));

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    playMessageSentSound();

    try {
      const res = await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          postId,
          content: commentText,
          authorName: profile?.nombre_actual || currentUser?.name || 'Sintonizador',
          authorImage: profile?.user_image || currentUser?.image,
          authorSign: profile?.sign || 'Cosmos'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setPostCommentsMap(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).map(c => c.id === tempComment.id ? data.comment : c)
          }));
        }
      }
    } catch (err) {
      console.error("Error enviando comentario:", err);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10 select-none animate-fadeIn">
      {/* ── CABECERA DEL MURO CÓSMICO ── */}
      <div className="glass-panel p-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/30 via-[#070a16] to-cyan-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mystic-font leading-tight">
                Muro Cósmico & Resonancias
              </h2>
              <p className="text-[11px] text-gray-300 font-light">
                Vibraciones en tiempo real de la comunidad astral
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchFeed();
              fetchStories();
            }}
            className="p-2 text-gray-400 hover:text-cyan-300 rounded-xl hover:bg-white/5 transition"
            title="Actualizar Muro"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ── CARRUSEL DE HISTORIAS EFÍMERAS CÓSMICAS (24H) ── */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-white/10 bg-[#070914]/90 shadow-lg">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" /> Historias Efímeras (24h)
          </span>
          <span className="text-[10px] text-cyan-400 font-medium">
            Desaparecen en 24 horas
          </span>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
          {/* Item 1: Tu Historia (Agregar o Ver) */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div 
              onClick={() => setIsCreateStoryOpen(true)}
              className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 hover:scale-105 transition-transform"
            >
              <img
                src={profile?.user_image || currentUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`}
                alt="Tu historia"
                className="w-14 h-14 rounded-full object-cover border-2 border-black"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-cyan-500 text-black border-2 border-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Plus size={13} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-medium text-white max-w-[64px] truncate text-center">
              Tu historia
            </span>
          </div>

          {/* Demás historias de la comunidad */}
          {storyGroups.map((group, gIdx) => {
            const hasUnseen = group.stories.some(s => !seenStoryIds.includes(s.id));
            return (
              <div
                key={group.userId || gIdx}
                onClick={() => {
                  setActiveStoryGroupIdx(gIdx);
                  setIsViewerOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className={`p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  hasUnseen 
                    ? 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-amber-400 animate-[pulse_3s_infinite] shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                    : 'bg-white/20'
                }`}>
                  <img
                    src={group.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.authorName)}&background=06b6d4&color=fff`}
                    alt={group.authorName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-black"
                  />
                </div>
                <span className={`text-[10px] max-w-[64px] truncate text-center font-medium ${
                  hasUnseen ? 'text-white font-bold' : 'text-gray-400'
                }`}>
                  {group.authorName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COMPOSER: COMPARTIR EN EL ÉTER ── */}
      <form onSubmit={handlePublishPost} className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl bg-[#090d1c]/90">
        <div className="flex items-start gap-2.5">
          <img
            src={profile?.user_image || currentUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`}
            alt="Tu avatar"
            className="w-9 h-9 rounded-full object-cover border border-cyan-400/40 shrink-0 mt-0.5"
          />
          <div className="flex-1 space-y-2">
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="¿Qué energía cósmica o tránsito sientes hoy en el éter?..."
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-gray-500 focus:border-cyan-400 outline-none transition resize-none leading-relaxed"
            />

            {/* Input opcional de URL de Imagen */}
            {showMediaInput && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder="Pega la URL de una imagen o foto (ej: https://...)"
                  className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Selector de Etiquetas de Vibe Cósmico */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {VIBE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewVibeTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition border ${
                    newVibeTag === tag
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones del Composer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowMediaInput(!showMediaInput)}
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition ${
              showMediaInput ? 'text-cyan-300 bg-cyan-500/10' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Image size={15} />
            <span className="text-[11px]">Añadir Foto</span>
          </button>

          <button
            type="submit"
            disabled={!newContent.trim() || publishing}
            className="btn-mystic px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-40 shadow-lg"
          >
            {publishing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Transmitiendo...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Resonar ✨</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── FILTRO POR VIBE CÓSMICO ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar px-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pr-1 flex items-center gap-1">
          <Filter size={11} /> Filtrar:
        </span>
        {['Todos', ...VIBE_TAGS].map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedVibe(tag)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedVibe === tag
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ── LISTADO DE PUBLICACIONES ── */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-3xl">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-cyan-400 text-xs tracking-widest uppercase">Captando resonancias colectivas...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-3xl text-gray-400 text-xs">
          No hay publicaciones con esta etiqueta en el éter aún. ¡Sé el primero en compartir!
        </div>
      ) : (
        <div className="space-y-3.5">
          {posts.map((post) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const commentsList = postCommentsMap[post.id] || post.comments || [];
            const userReactions = post.userReactions || [];

            return (
              <article
                key={post.id}
                className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 hover:border-cyan-500/30 transition-all space-y-3 bg-[#080b18]/85 shadow-lg"
              >
                {/* Cabecera del Post (Autor, Signo, Vibe y Tiempo) */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => onNavigateToUser && onNavigateToUser(post.user_id)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <img
                      src={post.author_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'Z')}&background=06b6d4&color=fff`}
                      alt={post.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 group-hover:scale-105 transition"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          {post.author_name}
                        </h4>
                        {post.author_sign && (
                          <ZodiacBadge sign={post.author_sign} size="xs" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-light">
                        <span>{formatTimeAgo(post.created_at)}</span>
                        {post.author_element && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">{post.author_element}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge de Vibe */}
                  {post.vibe_tag && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-300 shadow-sm">
                      {post.vibe_tag}
                    </span>
                  )}
                </div>

                {/* Contenido del Post */}
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-light whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Foto / Multimedia adjunta */}
                {post.media_url && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 max-h-[360px] bg-black">
                    <img
                      src={post.media_url}
                      alt="Multimedia cósmica"
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                )}

                {/* ── BARRA DE REACCIONES CÓSMICAS (✨, 🔥, 💖, 🌌) ── */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* 1. Resonar ✨ */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'resonate')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('resonate')
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-105'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Resonar con este mensaje"
                    >
                      <span>✨</span>
                      <span className="font-bold text-[11px]">{post.reactions?.resonate || 0}</span>
                    </button>

                    {/* 2. Fuego 🔥 */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'fire')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('fire')
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-105'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Energía de Fuego"
                    >
                      <span>🔥</span>
                      <span className="font-bold text-[11px]">{post.reactions?.fire || 0}</span>
                    </button>

                    {/* 3. Amor 💖 */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'love')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('love')
                          ? 'bg-pink-500/30 text-pink-300 border border-pink-400/60 shadow-[0_0_10px_rgba(244,114,182,0.4)] scale-105'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Amor astral"
                    >
                      <span>💖</span>
                      <span className="font-bold text-[11px]">{post.reactions?.love || 0}</span>
                    </button>

                    {/* 4. Trascendencia 🌌 */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'cosmos')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('cosmos')
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)] scale-105'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Cosmos y Trascendencia"
                    >
                      <span>🌌</span>
                      <span className="font-bold text-[11px]">{post.reactions?.cosmos || 0}</span>
                    </button>
                  </div>

                  {/* Botón de Comentarios */}
                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="text-xs text-gray-400 hover:text-cyan-300 flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-white/5"
                  >
                    <MessageCircle size={14} />
                    <span>{post.commentsCount || 0} comentarios</span>
                    {isCommentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* ── SECCIÓN DESPLEGABLE DE COMENTARIOS ── */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
                    {/* Lista de comentarios */}
                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                      {loadingCommentsPostId === post.id ? (
                        <div className="p-3 text-center text-xs text-cyan-400">
                          <Loader2 size={14} className="animate-spin mx-auto mb-1" />
                          Cargando ecos...
                        </div>
                      ) : commentsList.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic text-center py-2">
                          Sé el primero en dejar un eco en este pensamiento.
                        </p>
                      ) : (
                        commentsList.map(comment => (
                          <div key={comment.id} className="p-2.5 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2">
                            <img
                              src={comment.author_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name || 'Z')}&background=06b6d4&color=fff`}
                              alt={comment.author_name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1">
                                  {comment.author_name}
                                  {comment.author_sign && (
                                    <span className="text-[9px] text-cyan-400 font-mono">({comment.author_sign})</span>
                                  )}
                                </span>
                                <span className="text-[9px] text-gray-500 font-light">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 font-light mt-0.5 leading-snug">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input de respuesta */}
                    <form onSubmit={(e) => handleSendComment(post.id, e)} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Escribe un comentario o reflexión..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400 transition"
                      />
                      <button
                        type="submit"
                        disabled={!(commentInputs[post.id] || '').trim()}
                        className="p-2 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-30 transition font-bold"
                        title="Enviar comentario"
                      >
                        <Send size={13} />
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── VISOR DE HISTORIAS EFÍMERAS ── */}
      <AstralStoriesViewerModal
        isOpen={isViewerOpen}
        storyGroups={storyGroups}
        initialGroupIndex={activeStoryGroupIdx}
        onClose={() => setIsViewerOpen(false)}
        onStoryViewed={handleStoryViewed}
      />

      {/* ── MODAL PARA CREAR HISTORIA EFÍMERA DE 24H ── */}
      {isCreateStoryOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-black to-[#0d0a1d] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative overflow-hidden">
            
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
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
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-black"
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
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
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
