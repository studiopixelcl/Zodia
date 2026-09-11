"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Flame, Heart, Compass, Send, MessageCircle, Image as ImageIcon, 
  Smile, Share2, Filter, ChevronDown, ChevronUp, User, Globe, 
  RotateCcw, Check, Plus, AlertCircle, Loader2, Camera, X, Trash2, 
  Maximize2, Eye, Download, Copy, ShieldAlert, BarChart2, Music, Disc,
  Award
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { apiFetch } from '../../lib/api';
import { playSwipeLikeSound, playMessageSentSound, triggerHaptic } from '../../lib/sound-effects';
import { AstralStoriesRail } from './AstralStoriesRail';
import { compressImage } from '../../lib/media-processor';
import { DailyCosmicCapsule } from './DailyCosmicCapsule';
import { recordGamificationAction } from '../../lib/gamification';

const VIBE_TAGS = [
  '🪐 Tránsitos',
  '✨ Reflexión',
  '🎵 Música',
  '💖 Amor',
  '🔮 Pregunta Cósmica',
  '🌿 Estilo de Vida'
];

const ELEMENT_FILTERS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Fuego', label: '🔥 Fuego' },
  { id: 'Tierra', label: '🌱 Tierra' },
  { id: 'Aire', label: '💨 Aire' },
  { id: 'Agua', label: '🌊 Agua' }
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState('Todos');
  const [selectedElement, setSelectedElement] = useState('Todos');

  // Estado del creador de posts
  const [newContent, setNewContent] = useState('');
  const [newVibeTag, setNewVibeTag] = useState(VIBE_TAGS[1]);
  const [publishing, setPublishing] = useState(false);
  const [publishStatusText, setPublishStatusText] = useState('');

  // Estados de carga de foto (Cámara / Galería del dispositivo, NO por URL)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Estados para ENCUESTA CÓSMICA
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [localPollVotes, setLocalPollVotes] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('zodia_feed_poll_votes') || '{}');
    } catch {
      return {};
    }
  });

  // Estados para MÚSICA / BANDA SONORA
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');

  // Referencias a inputs de archivos ocultos del sistema
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Estado para desplegar el Clima Astral & Carta del Día
  const [showDailyCapsule, setShowDailyCapsule] = useState(false);

  // Estados de comentarios expandidos por postId
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [postCommentsMap, setPostCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState(null);

  // Estado del Lightbox / Visor de imagen a pantalla completa
  const [activeLightboxPost, setActiveLightboxPost] = useState(null);

  // Estado para confirmación de eliminación de post
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Notificación tipo toast cósmico
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Escuchar eventos de desbloqueo de insignias de gamificación
  useEffect(() => {
    const handleBadgeUnlocked = (e) => {
      const badge = e.detail;
      if (badge) {
        showToast(`🎉 ¡Insignia Desbloqueada: ${badge.icon} ${badge.title}!`, 'success');
        triggerHaptic('celebration');
      }
    };
    window.addEventListener('zodia-badge-unlocked', handleBadgeUnlocked);
    return () => window.removeEventListener('zodia-badge-unlocked', handleBadgeUnlocked);
  }, []);

  // Cargar feed
  const fetchFeed = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const vibeQuery = selectedVibe !== 'Todos' ? `vibe=${encodeURIComponent(selectedVibe.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim())}` : '';
      const elemQuery = selectedElement !== 'Todos' ? `element=${encodeURIComponent(selectedElement.toLowerCase())}` : '';
      const queryParts = [vibeQuery, elemQuery].filter(Boolean);
      const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const res = await apiFetch(`/api/feed${query}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        if (isManual) {
          showToast('Muro sincronizado con el éter ✨', 'success');
        }
      }
    } catch (err) {
      console.error("Error al cargar feed:", err);
      showToast('Error al conectar con las resonancias cósmicas', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedVibe, selectedElement]);

  // Manejo de selección de imagen desde Galería o Cámara
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const compressed = await compressImage(file, 1600, 0.88);
      setSelectedPhotoFile(compressed.file);
      setSelectedPhotoPreview(compressed.previewUrl);
      showToast('Foto lista para compartir en el muro 📸', 'success');
    } catch (err) {
      console.warn('Fallback compresión de imagen:', err);
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      showToast('Foto cargada desde tu dispositivo 📸', 'info');
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(null);
  };

  // Manejadores de Encuestas
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx, val) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const handleDiscardPoll = () => {
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  // Votar en Encuesta Cósmica
  const handleVotePoll = async (postId, optionId) => {
    const currentUserId = profile?.user_id || currentUser?.id || 'anon';
    triggerHaptic('medium');

    // Persistir voto inmediatamente en caché local
    setLocalPollVotes(prev => {
      const next = { ...prev, [postId]: optionId };
      try {
        localStorage.setItem('zodia_feed_poll_votes', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Actualización optimista en memoria
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !p.poll) return p;
      const voters = { ...(p.poll.voters || {}) };
      const prevOptId = voters[currentUserId];
      const nextOptions = p.poll.options.map(opt => {
        let count = opt.votes || 0;
        if (opt.id === prevOptId) count = Math.max(0, count - 1);
        if (opt.id === optionId) count += 1;
        return { ...opt, votes: count };
      });
      voters[currentUserId] = optionId;
      return {
        ...p,
        poll: {
          ...p.poll,
          options: nextOptions,
          voters
        }
      };
    }));

    recordGamificationAction('poll_voted');
    showToast('¡Tu voto cósmico fue sellado! 📊✨', 'success');

    try {
      const res = await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote_poll',
          postId,
          optionId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.poll) {
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: data.poll } : p));
        }
      }
    } catch (err) {
      console.error("Error registrando voto:", err);
    }
  };

  // Publicar nuevo post con soporte para foto, encuesta y música
  const handlePublishPost = async (e) => {
    e.preventDefault();
    const hasText = !!newContent.trim();
    const hasPhoto = !!selectedPhotoFile;
    const hasPoll = showPollCreator && !!pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;

    if ((!hasText && !hasPhoto && !hasPoll) || publishing) return;

    setPublishing(true);
    setPublishStatusText('Sintonizando con el éter...');
    triggerHaptic('light');

    let finalMediaUrl = null;

    try {
      if (selectedPhotoFile) {
        setPublishStatusText('Guardando imagen cósmica...');
        try {
          const formData = new FormData();
          formData.append('file', selectedPhotoFile);
          formData.append('type', 'photo');

          const uploadRes = await apiFetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData?.url) finalMediaUrl = uploadData.url;
          }
        } catch (uploadErr) {
          finalMediaUrl = selectedPhotoPreview;
        }

        if (!finalMediaUrl && selectedPhotoPreview) {
          finalMediaUrl = selectedPhotoPreview;
        }
      }

      setPublishStatusText('Transmitiendo resonancia...');

      // Construcción del payload de encuesta
      const pollPayload = hasPoll ? {
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim())
      } : null;

      // Construcción del payload de música
      const musicPayload = showMusicInput && musicTitle.trim() ? {
        title: musicTitle.trim(),
        artist: musicArtist.trim()
      } : null;

      const res = await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_post',
          content: newContent.trim() || (hasPoll ? pollQuestion.trim() : '✨ Compartiendo una visión cósmica...'),
          vibeTag: newVibeTag,
          mediaUrl: finalMediaUrl,
          poll: pollPayload,
          musicTrack: musicPayload,
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
          triggerHaptic('success');
          recordGamificationAction('post_created');
          setPosts(prev => [data.post, ...prev]);

          // Limpiar formulario
          setNewContent('');
          setSelectedPhotoFile(null);
          setSelectedPhotoPreview(null);
          handleDiscardPoll();
          setShowMusicInput(false);
          setMusicTitle('');
          setMusicArtist('');
          showToast('¡Tu resonancia fue transmitida al cosmos! 🪐✨', 'success');
        }
      } else {
        showToast('No se pudo publicar la resonancia.', 'error');
      }
    } catch (err) {
      console.error("Error publicando en el feed:", err);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setPublishing(false);
      setPublishStatusText('');
    }
  };

  // Eliminar publicación propia
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);

    try {
      const res = await apiFetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_post',
          postId: postToDelete.id
        })
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
        showToast('Publicación retirada del éter 🪐', 'info');
      } else {
        showToast('No tienes permiso para eliminar esta publicación.', 'error');
      }
    } catch (err) {
      console.error("Error al eliminar post:", err);
      showToast('Error al eliminar la publicación.', 'error');
    } finally {
      setIsDeletingPost(false);
      setPostToDelete(null);
    }
  };

  // Reaccionar (toggle)
  const handleReaction = async (postId, reactionType) => {
    playSwipeLikeSound();
    triggerHaptic('light');
    recordGamificationAction('reaction_given');

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

  // Compartir publicación
  const handleSharePost = async (post) => {
    const shareText = `"${post.content}" - ${post.author_name} (${post.author_sign || 'Cosmos'}) en Zodia`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Resonancia Cósmica en Zodia',
          text: shareText,
          url: window.location.href
        });
        showToast('¡Compartido exitosamente! 🌌', 'success');
        return;
      } catch (e) {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        showToast('¡Copiado al portapapeles! 🪐', 'success');
      } catch {
        showToast('No se pudo copiar.', 'error');
      }
    }
  };

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

  const handleSendComment = async (postId, e) => {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    triggerHaptic('medium');
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
    recordGamificationAction('comment_sent');

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

  const isMyPost = (post) => {
    const currentId = profile?.user_id || currentUser?.id;
    const currentName = profile?.nombre_actual || currentUser?.name;
    return (currentId && post.user_id === currentId) || (currentName && post.author_name === currentName);
  };

  const getElementBadgeColor = (element) => {
    switch ((element || '').toLowerCase()) {
      case 'fuego': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'agua': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'aire': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'tierra': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-14 select-none animate-fadeIn relative">
      
      {/* ── TOAST CÓSMICO FLOTANTE ── */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fadeIn pointer-events-none px-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#090e24]/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.35)] backdrop-blur-xl text-white text-xs font-medium">
            <Sparkles size={15} className="text-cyan-400 shrink-0 animate-spin" />
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Inputs nativos ocultos */}
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />

      {/* ── CABECERA DEL MURO CÓSMICO ── */}
      <div className="glass-panel p-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/40 via-[#070a16] to-cyan-950/40 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_18px_rgba(6,182,212,0.4)]">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mystic-font tracking-wider leading-tight">
                Muro Cósmico & Resonancias
              </h2>
              <p className="text-[11px] text-gray-300 font-light">
                Comunidad astral, debates cósmicos, fotos y vibraciones en vivo
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchFeed(true)}
            disabled={refreshing}
            className="p-2.5 text-gray-400 hover:text-cyan-300 rounded-2xl hover:bg-white/5 border border-white/5 hover:border-cyan-500/30 transition shadow-sm"
            title="Sincronizar Muro"
          >
            <RotateCcw size={16} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* ── BARRA DEL CLIMA CÓSMICO & CARTA DEL DÍA ── */}
      <div className="glass-panel p-2.5 px-3.5 rounded-2xl border border-cyan-500/20 bg-[#070a18]/80 flex items-center justify-between text-xs shadow-sm">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => setShowDailyCapsule(!showDailyCapsule)}
        >
          <span className="text-base group-hover:scale-110 transition-transform">🔮</span>
          <div>
            <span className="font-bold text-white text-[11px] block group-hover:text-cyan-300 transition-colors">
              Clima Astral & Arcano Guía de Hoy
            </span>
            <span className="text-[10px] text-gray-400 font-light">
              Fase lunar, energía vital y tu carta diaria
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDailyCapsule(!showDailyCapsule)}
          className="px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-[10px] font-bold text-cyan-300 transition"
        >
          {showDailyCapsule ? 'Ocultar' : 'Ver Guía ✨'}
        </button>
      </div>

      {showDailyCapsule && (
        <DailyCosmicCapsule
          profile={profile}
          currentUser={currentUser}
          onShareToFeed={(text) => {
            setNewContent(text);
            showToast('¡Mensaje cósmico listo en el editor para resonar! ✨', 'info');
          }}
        />
      )}

      {/* ── CARRUSEL DE HISTORIAS EFÍMERAS CÓSMICAS (24H) ── */}
      <AstralStoriesRail currentUser={currentUser} profile={profile} />

      {/* ── COMPOSER COMPLETO: TEXTO, FOTO, ENCUESTA Y MÚSICA ── */}
      <form onSubmit={handlePublishPost} className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3.5 shadow-2xl bg-[#090d1f]/95">
        <div className="flex items-start gap-3">
          <img
            src={profile?.user_image || currentUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`}
            alt="Tu avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/50 shrink-0 mt-0.5 shadow-md"
          />
          <div className="flex-1 space-y-2.5">
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="¿Qué energía cósmica o tránsito sientes hoy en el éter?..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-gray-400 focus:border-cyan-400 focus:bg-black/60 outline-none transition resize-none leading-relaxed shadow-inner"
            />

            {/* PREVIEW DE FOTO CARGADA */}
            {selectedPhotoPreview && (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/80 shadow-lg animate-fadeIn group">
                <img
                  src={selectedPhotoPreview}
                  alt="Vista previa seleccionada"
                  className="w-full max-h-56 object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] text-cyan-300 font-medium flex items-center gap-1.5 shadow">
                  <Sparkles size={11} className="text-cyan-400" />
                  <span>Foto lista para el éter</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition shadow-lg"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── CREADOR DE ENCUESTA CÓSMICA ── */}
            {showPollCreator && (
              <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2.5 animate-fadeIn shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <BarChart2 size={13} /> Encuesta Cósmica
                  </span>
                  <button
                    type="button"
                    onClick={handleDiscardPoll}
                    className="text-gray-400 hover:text-red-400 text-xs transition"
                    title="Descartar encuesta"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Pregunta de la encuesta (ej: ¿Sientes el influjo lunar hoy?)"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400"
                />
                <div className="space-y-1.5">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`Opción ${idx + 1}`}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-400"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1"
                  >
                    <Plus size={12} /> Añadir otra opción
                  </button>
                )}
              </div>
            )}

            {/* ── SELECTOR DE MÚSICA / BANDA SONORA ── */}
            {showMusicInput && (
              <div className="p-3 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2 animate-fadeIn shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <Music size={13} /> Banda Sonora del Pensamiento
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMusicInput(false)}
                    className="text-gray-400 hover:text-red-400 text-xs transition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="Canción (ej: Midnight City)"
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    value={musicArtist}
                    onChange={(e) => setMusicArtist(e.target.value)}
                    placeholder="Artista (ej: M83)"
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-purple-400"
                  />
                </div>
                {/* Presets rápidos */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  <span className="text-[9px] text-gray-400">Presets:</span>
                  {[
                    { t: 'Lofi 432Hz', a: 'Cosmic Meditation' },
                    { t: 'Solar Power', a: 'Lorde' },
                    { t: 'Glue', a: 'Bicep' },
                    { t: 'Space Song', a: 'Beach House' }
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setMusicTitle(p.t); setMusicArtist(p.a); }}
                      className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-purple-500/20 text-[9px] text-purple-200 border border-white/5 whitespace-nowrap"
                    >
                      {p.t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Etiquetas de Vibe Cósmico */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {VIBE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewVibeTag(tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition border ${
                    newVibeTag === tag
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de Acciones del Composer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Cámara */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-white/5 hover:bg-cyan-500/15 text-gray-300 hover:text-cyan-300 border border-white/10 transition"
              title="Tomar foto con la cámara"
            >
              <Camera size={13} className="text-cyan-400" />
              <span className="text-[10px]">Cámara</span>
            </button>

            {/* Galería */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-white/5 hover:bg-purple-500/15 text-gray-300 hover:text-purple-300 border border-white/10 transition"
              title="Elegir foto del dispositivo"
            >
              <ImageIcon size={13} className="text-purple-400" />
              <span className="text-[10px]">Galería</span>
            </button>

            {/* Encuesta */}
            <button
              type="button"
              onClick={() => setShowPollCreator(!showPollCreator)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                showPollCreator ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-gray-300 hover:text-cyan-300 border-white/10'
              }`}
              title="Añadir encuesta interactiva"
            >
              <BarChart2 size={13} className="text-cyan-400" />
              <span className="text-[10px]">Encuesta</span>
            </button>

            {/* Música */}
            <button
              type="button"
              onClick={() => setShowMusicInput(!showMusicInput)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition ${
                showMusicInput ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' : 'bg-white/5 text-gray-300 hover:text-purple-300 border-white/10'
              }`}
              title="Asociar canción o banda sonora"
            >
              <Music size={13} className="text-pink-400" />
              <span className="text-[10px]">Música</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={(!newContent.trim() && !selectedPhotoFile && (!showPollCreator || !pollQuestion.trim())) || publishing || isProcessingPhoto}
            className="btn-mystic px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-40 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all hover:scale-[1.02]"
          >
            {publishing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span className="text-[11px]">{publishStatusText || 'Transmitiendo...'}</span>
              </>
            ) : (
              <>
                <Send size={12} />
                <span>Resonar ✨</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── FILTROS MULTIDIMENSIONALES: VIBE & ELEMENTO ── */}
      <div className="space-y-2 px-1">
        {/* Filtro 1: Vibe Temático */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold pr-1 shrink-0 flex items-center gap-1">
            <Filter size={10} /> Vibe:
          </span>
          {['Todos', ...VIBE_TAGS].map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedVibe(tag)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                selectedVibe === tag
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Filtro 2: Por Elemento Astral */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold pr-1 shrink-0 flex items-center gap-1">
            <Compass size={10} /> Elemento:
          </span>
          {ELEMENT_FILTERS.map(elem => (
            <button
              key={elem.id}
              onClick={() => setSelectedElement(elem.id)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                selectedElement === elem.id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {elem.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTADO DE PUBLICACIONES ── */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-cyan-300 text-xs tracking-widest uppercase font-medium">Sintonizando resonancias del éter...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-3xl border border-white/10 space-y-3 bg-[#080b18]/70">
          <Sparkles size={32} className="mx-auto text-cyan-400/60" />
          <p className="text-gray-300 text-xs font-medium">
            No hay publicaciones bajo estos filtros cósmicos aún.
          </p>
          <p className="text-[11px] text-gray-400 font-light">
            ¡Sé el primero en publicar una reflexión o encuesta con la comunidad!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isCommentsOpen = openCommentsPostId === post.id;
            const commentsList = postCommentsMap[post.id] || post.comments || [];
            const userReactions = post.userReactions || [];
            const userIsAuthor = isMyPost(post);
            const myUserId = profile?.user_id || currentUser?.id || 'anon';

            // Cálculos de la encuesta si existe
            const poll = post.poll;
            const localVote = localPollVotes[post.id];
            const hasServerVote = poll?.voters && (
              poll.voters[myUserId] || 
              (profile?.user_id && poll.voters[profile.user_id]) || 
              (currentUser?.id && poll.voters[currentUser.id])
            );
            const myVotedOptionId = hasServerVote || localVote || null;

            // Asegurar que si hay un voto local guardado y el servidor aún no lo refleja en los votos agregados, sume visualmente
            const effectiveOptions = (poll?.options || []).map(opt => {
              let votes = opt.votes || 0;
              if (localVote === opt.id && !hasServerVote) {
                votes += 1;
              }
              return { ...opt, votes };
            });
            const totalPollVotes = effectiveOptions.reduce((acc, opt) => acc + (opt.votes || 0), 0);

            return (
              <article
                key={post.id}
                className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 hover:border-cyan-500/30 transition-all space-y-3 bg-[#080b1a]/90 shadow-xl"
              >
                {/* Cabecera del Post */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => onNavigateToUser && onNavigateToUser(post.user_id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={post.author_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'Z')}&background=06b6d4&color=fff`}
                      alt={post.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-cyan-400/50 group-hover:scale-105 transition shadow"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition leading-tight">
                          {post.author_name}
                        </h4>
                        {post.author_sign && (
                          <ZodiacBadge sign={post.author_sign} size="xs" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-light mt-0.5">
                        <span>{formatTimeAgo(post.created_at)}</span>
                        {post.author_element && (
                          <>
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded-md font-medium border text-[9px] ${getElementBadgeColor(post.author_element)}`}>
                              {post.author_element}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.vibe_tag && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-300 shadow-sm">
                        {post.vibe_tag}
                      </span>
                    )}
                    {userIsAuthor && (
                      <button
                        type="button"
                        onClick={() => setPostToDelete(post)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                        title="Eliminar mi publicación"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── BANDA SONORA / STICKER MUSICAL ADJUNTO ── */}
                {post.music_track && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-black border border-purple-500/30 text-[11px] shadow-sm">
                    <Disc size={15} className="text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
                    <span className="font-semibold text-white truncate">
                      {post.music_track.title}
                    </span>
                    {post.music_track.artist && (
                      <span className="text-gray-400 truncate">
                        • {post.music_track.artist}
                      </span>
                    )}
                  </div>
                )}

                {/* Contenido del Post */}
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-normal whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* ── ENCUESTA CÓSMICA INTERACTIVA ── */}
                {poll && (
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <BarChart2 size={13} className="text-cyan-400" />
                        {poll.question}
                      </h5>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {totalPollVotes} {totalPollVotes === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {effectiveOptions.map((opt) => {
                        const votes = opt.votes || 0;
                        const percentage = totalPollVotes > 0 ? Math.round((votes / totalPollVotes) * 100) : 0;
                        const isSelectedByMe = myVotedOptionId === opt.id;

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleVotePoll(post.id, opt.id)}
                            className={`relative overflow-hidden rounded-xl border p-2.5 cursor-pointer transition-all ${
                              isSelectedByMe
                                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                                : 'border-white/10 bg-black/40 hover:border-cyan-500/30 hover:bg-black/60'
                            }`}
                          >
                            {/* Barra de fondo con porcentaje */}
                            {totalPollVotes > 0 && (
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none ${
                                  isSelectedByMe
                                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20'
                                    : 'bg-white/5'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            )}

                            <div className="relative z-10 flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-200 font-medium flex items-center gap-1.5">
                                {isSelectedByMe && <Check size={13} className="text-cyan-400 font-bold" />}
                                <span>{opt.text}</span>
                              </span>
                              <span className="text-[11px] font-bold font-mono text-cyan-300">
                                {totalPollVotes > 0 ? `${percentage}%` : '0%'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Foto adjunta */}
                {post.media_url && (
                  <div 
                    onClick={() => setActiveLightboxPost(post)}
                    className="relative rounded-2xl overflow-hidden border border-white/10 max-h-[380px] bg-black/60 group cursor-pointer shadow-lg"
                  >
                    <img
                      src={post.media_url}
                      alt="Multimedia cósmica"
                      className="w-full h-full object-cover max-h-[380px] group-hover:scale-[1.02] transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
                      <div className="px-3 py-1.5 rounded-full bg-black/70 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 shadow-xl">
                        <Maximize2 size={13} />
                        <span>Ver en tamaño completo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Barra de Reacciones & Acciones */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Resonar */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'resonate')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('resonate')
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105 font-bold'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Resonar"
                    >
                      <span>✨</span>
                      <span className="text-[11px]">{post.reactions?.resonate || 0}</span>
                    </button>

                    {/* Fuego */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'fire')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('fire')
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105 font-bold'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Fuego"
                    >
                      <span>🔥</span>
                      <span className="text-[11px]">{post.reactions?.fire || 0}</span>
                    </button>

                    {/* Amor */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'love')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('love')
                          ? 'bg-pink-500/30 text-pink-300 border border-pink-400/60 shadow-[0_0_12px_rgba(244,114,182,0.4)] scale-105 font-bold'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Amor"
                    >
                      <span>💖</span>
                      <span className="text-[11px]">{post.reactions?.love || 0}</span>
                    </button>

                    {/* Cosmos */}
                    <button
                      type="button"
                      onClick={() => handleReaction(post.id, 'cosmos')}
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                        userReactions.includes('cosmos')
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.4)] scale-105 font-bold'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      title="Cosmos"
                    >
                      <span>🌌</span>
                      <span className="text-[11px]">{post.reactions?.cosmos || 0}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="p-1.5 text-gray-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition"
                      title="Compartir"
                    >
                      <Share2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className="text-xs text-gray-400 hover:text-cyan-300 flex items-center gap-1.5 transition py-1 px-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      <MessageCircle size={14} />
                      <span>{post.commentsCount || 0}</span>
                      {isCommentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Comentarios */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                      {loadingCommentsPostId === post.id ? (
                        <div className="p-3 text-center text-xs text-cyan-400">
                          <Loader2 size={14} className="animate-spin mx-auto mb-1" />
                          Sintonizando comentarios...
                        </div>
                      ) : commentsList.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic text-center py-2">
                          Sé el primero en dejar un eco cósmico.
                        </p>
                      ) : (
                        commentsList.map(comment => (
                          <div key={comment.id} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                            <img
                              src={comment.author_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name || 'Z')}&background=06b6d4&color=fff`}
                              alt={comment.author_name}
                              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
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
                              <p className="text-xs text-gray-300 font-normal mt-1 leading-snug">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={(e) => handleSendComment(post.id, e)} className="flex items-center gap-2 pt-1">
                      <img
                        src={profile?.user_image || currentUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Z')}&background=06b6d4&color=fff`}
                        alt="Tú"
                        className="w-7 h-7 rounded-full object-cover border border-cyan-400/40 shrink-0"
                      />
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Escribe una reflexión o eco..."
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

      {/* Lightbox Modal */}
      {activeLightboxPost && (
        <div 
          onClick={() => setActiveLightboxPost(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
        >
          <div className="flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <img
                src={activeLightboxPost.author_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeLightboxPost.author_name || 'Z')}&background=06b6d4&color=fff`}
                alt={activeLightboxPost.author_name}
                className="w-9 h-9 rounded-full object-cover border border-cyan-400/50"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activeLightboxPost.author_name}</h3>
                  {activeLightboxPost.author_sign && (
                    <ZodiacBadge sign={activeLightboxPost.author_sign} size="xs" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{formatTimeAgo(activeLightboxPost.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSharePost(activeLightboxPost)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveLightboxPost(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 min-h-0" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightboxPost.media_url}
              alt="Foto completa"
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10"
            />
          </div>

          <div className="max-w-xl mx-auto w-full text-center z-10" onClick={(e) => e.stopPropagation()}>
            {activeLightboxPost.content && (
              <p className="text-xs sm:text-sm text-gray-200 bg-black/60 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                {activeLightboxPost.content}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrar Post */}
      {postToDelete && (
        <div 
          onClick={() => setPostToDelete(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-5 sm:p-6 rounded-3xl border border-red-500/30 max-w-sm w-full space-y-4 bg-[#0c0d1e] shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">¿Eliminar esta publicación?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Esta acción retirará permanentemente tu mensaje y foto del éter cósmico.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                disabled={isDeletingPost}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1.5"
              >
                {isDeletingPost ? <Loader2 size={14} className="animate-spin" /> : <span>Eliminar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
