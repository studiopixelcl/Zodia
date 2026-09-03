"use client";
import React, { useState, useEffect } from 'react';
import { zodiacData, archetypes, getZodiacSymbol, ZODIAC_DETAILS, LIFE_PATH_DETAILS, ELEMENT_DETAILS, calculateFullNumerology, NUMEROLOGY_DAILY_ADVICE } from '../../lib/astrology';
import { CATEGORIZED_INTERESTS } from '../../lib/dating';
import { ZodiacBadge } from './ZodiacBadge';
import { apiFetch } from '../../lib/api';
import { 
  Flame, Mountain, Wind, Droplets, Shield, Compass, Star, Edit3, 
  MapPin, Heart, Plus, Trash2, X, Check, Camera, Image as ImageIcon, 
  Sparkles, Info, BookOpen, UserCheck, Zap, Eye, Maximize2, Sun, Moon,
  Video, Play, Film, UploadCloud, Loader2, Calendar, AlertTriangle
} from 'lucide-react';
import { compressImage, trimAndOptimizeVideo } from '../../lib/media-processor';
import { AstralPortalModal } from './AstralPortalModal';

export const TabEspejo = ({ profile, user, avatarSrc, onAvatarChange, onNavigateTab }) => {
  const userSign = profile?.sign ?? 'Capricornio';
  const signInfo = zodiacData.find(s => s.sign === userSign) ?? zodiacData[0];
  const zodiacSymbol = getZodiacSymbol(userSign);
  const lifePath = profile?.life_path_number ?? profile?.lifePath ?? 9;
  const archetype = profile?.archetype ?? archetypes[lifePath] ?? 'El Ermitaño';
  const userElement = profile?.element ?? 'Tierra';

  // Detalles extendidos de astrofísica y numerología
  const zodiacDetail = ZODIAC_DETAILS[userSign] || ZODIAC_DETAILS['Capricornio'];
  const lifePathDetail = LIFE_PATH_DETAILS[lifePath] || LIFE_PATH_DETAILS[9];

  // Configuración visual de Elementos
  const elementIcons = {
    Fuego:  { icon: <Flame className="text-amber-400" size={20} />, color: 'from-amber-500/20 via-red-950/30 to-black', border: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.15)]' },
    Tierra: { icon: <Mountain className="text-emerald-400" size={20} />, color: 'from-emerald-500/20 via-teal-950/30 to-black', border: 'border-emerald-500/30', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]' },
    Aire:   { icon: <Wind className="text-cyan-400" size={20} />, color: 'from-cyan-500/20 via-blue-950/30 to-black', border: 'border-cyan-500/30', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]' },
    Agua:   { icon: <Droplets className="text-indigo-400" size={20} />, color: 'from-indigo-500/20 via-purple-950/30 to-black', border: 'border-indigo-500/30', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]' },
  };

  const currentElementUI = elementIcons[userElement] || elementIcons.Tierra;

  // Estados de Modales Explicativos y Previsualización
  const activeKnowledgeModalState = useState(null);
  const [activeKnowledgeModal, setActiveKnowledgeModal] = activeKnowledgeModalState;
  const [isPublicPreviewOpen, setIsPublicPreviewOpen]   = useState(false);
  const [activeLightboxImg, setActiveLightboxImg]       = useState(null);

  // Estados de edición del perfil social
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg]   = useState(null);

  // Campos editables
  const [editName, setEditName]         = useState(profile?.user_name ?? user?.name ?? '');
  const [editBio, setEditBio]           = useState(profile?.bio ?? 'Amante de la astrología, la música y las conversaciones profundas bajo las estrellas ✨');
  const [editIntent, setEditIntent]     = useState(profile?.intent ?? 'Citas y Pareja');
  const [editLocation, setEditLocation] = useState(profile?.location ?? 'Santiago, Chile');

  // Intereses y pasiones
  const initialInterests = () => {
    if (!profile?.interests) return ['Música indie', 'Café de especialidad', 'Astrología', 'Festivales en vivo'];
    if (Array.isArray(profile.interests)) return profile.interests;
    try {
      const parsed = JSON.parse(profile.interests);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['Música indie', 'Café de especialidad', 'Astrología'];
    } catch {
      return ['Música indie', 'Café de especialidad', 'Astrología'];
    }
  };
  const [editInterests, setEditInterests] = useState(initialInterests());
  
  // Fotos y Video de presentación (Galería)
  const initialPhotos = () => {
    if (!profile?.photos) return [];
    if (Array.isArray(profile.photos)) return profile.photos.slice(0, 5);
    try {
      const parsed = JSON.parse(profile.photos);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
      return [];
    }
  };
  const [editPhotos, setEditPhotos] = useState(initialPhotos());
  const [editVideoUrl, setEditVideoUrl] = useState(profile?.video_url ?? null);
  const [editDob, setEditDob] = useState(profile?.birth_date ?? profile?.dob ?? '');

  // Estados de progreso de compresión y subida
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaProgressMsg, setMediaProgressMsg] = useState('');
  const [mediaProgressPercent, setMediaProgressPercent] = useState(0);

  useEffect(() => {
    if (profile) {
      setEditName(profile.user_name ?? user?.name ?? '');
      setEditBio(profile.bio ?? 'Amante de la astrología, la música y las conversaciones profundas bajo las estrellas ✨');
      setEditIntent(profile.intent ?? 'Citas y Pareja');
      setEditLocation(profile.location ?? 'Santiago, Chile');
      setEditPhotos(initialPhotos());
      setEditVideoUrl(profile.video_url ?? null);
      setEditDob(profile.birth_date ?? profile.dob ?? '');
      setEditInterests(initialInterests());
    }
  }, [profile, user]);

  // Cálculo de mapa de numerología completo
  const numerologyData = calculateFullNumerology(
    profile?.birth_date ?? profile?.dob ?? '1995-02-01',
    editName || user?.name || 'Maverick'
  );

  // Manejador para agregar fotos a la galería con compresión WebP
  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editPhotos.length >= 5) {
      alert('Has alcanzado el límite máximo de 5 fotografías.');
      return;
    }

    setIsProcessingMedia(true);
    setMediaProgressMsg('Comprimiendo imagen a WebP...');
    setMediaProgressPercent(30);

    try {
      const compressed = await compressImage(file, 1280, 0.82);
      setMediaProgressMsg('Subiendo foto optimizada...');
      setMediaProgressPercent(70);

      const formData = new FormData();
      formData.append('file', compressed.file);
      formData.append('type', 'photo');

      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Error al subir la fotografía');

      const updatedPhotos = [...editPhotos.slice(0, 4), data.url];
      setEditPhotos(updatedPhotos);

      // Persistir automáticamente en el perfil
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: updatedPhotos })
      });

      setSaveSuccessMsg('Fotografía añadida y optimizada con éxito');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (err) {
      alert(err.message || 'Ocurrió un error al procesar la fotografía.');
    } finally {
      setIsProcessingMedia(false);
      setMediaProgressMsg('');
      setMediaProgressPercent(0);
      e.target.value = '';
    }
  };

  // Eliminar foto de la galería
  const handleRemovePhoto = async (index) => {
    const updatedPhotos = editPhotos.filter((_, i) => i !== index);
    setEditPhotos(updatedPhotos);
    try {
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: updatedPhotos })
      });
    } catch {}
  };

  // Manejador para subir y recortar automáticamente el mini video a 5 segundos
  const handleAddVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingMedia(true);
    setMediaProgressMsg('Recortando video automáticamente a 5.0 segundos...');
    setMediaProgressPercent(15);

    try {
      const trimmed = await trimAndOptimizeVideo(file, 5.0, (pct) => {
        setMediaProgressPercent(Math.round(15 + pct * 0.6));
      });

      setMediaProgressMsg('Subiendo mini video a Cloudflare R2...');
      setMediaProgressPercent(80);

      const formData = new FormData();
      formData.append('file', trimmed.file);
      formData.append('type', 'video');

      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Error al subir el video');

      setEditVideoUrl(data.url);

      // Persistir automáticamente en el perfil
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: data.url })
      });

      setSaveSuccessMsg(
        trimmed.wasTrimmed 
          ? 'Video recortado automáticamente a 5.0s y optimizado con éxito.' 
          : 'Mini video de 5s guardado con éxito.'
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message || 'Error al procesar el video.');
    } finally {
      setIsProcessingMedia(false);
      setMediaProgressMsg('');
      setMediaProgressPercent(0);
      e.target.value = '';
    }
  };

  // Eliminar mini video
  const handleRemoveVideo = async () => {
    setEditVideoUrl(null);
    try {
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: null })
      });
    } catch {}
  };

  // Guardar cambios del perfil
  const handleSaveProfile = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob: editDob,
          name: editName,
          bio: editBio,
          intent: editIntent,
          location: editLocation,
          photos: editPhotos,
          video_url: editVideoUrl,
          interests: editInterests
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg('Perfil actualizado con éxito');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveSuccessMsg(null);
          // Si cambió la fecha de nacimiento, recargar para recalcular todo el dashboard
          if (editDob && editDob !== (profile?.birth_date ?? profile?.dob)) {
            window.location.reload();
          }
        }, 1000);
      }
    } catch {
      alert('Ocurrió un error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn px-2 sm:px-4">

      {/* ── 1. PORTADA HERO ASTRAL: FOTO CENTRAL + TRILOGÍA CÓSMICA ── */}
      <div className="glass-panel text-center relative overflow-hidden bg-gradient-to-b from-[#0a0d18] via-[#05060a] to-black border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.12)] rounded-3xl">
        
        {/* Banner de portada con degradado cósmico */}
        <div className="h-32 sm:h-36 w-full relative bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-purple-950/60 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.25),transparent_70%)]" />
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsPublicPreviewOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-black/80 hover:border-cyan-400 transition shadow-sm"
              title="Ver cómo ven otros tu perfil"
            >
              <Eye size={13} className="text-cyan-400" /> Vista Pública
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition shadow-lg"
            >
              <Edit3 size={13} /> Editar Perfil
            </button>
          </div>
        </div>

        {/* Contenido principal sobrepuesto al banner */}
        <div className="relative px-3 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16 z-10 flex flex-col items-center">
          
          {/* FOTO DE PERFIL CENTRAL Y PROTAGÓNICA */}
          <div className="relative group/avatar cursor-pointer mb-2.5 sm:mb-3">
            <label className="relative block cursor-pointer">
              <input type="file" accept="image/*" hidden onChange={onAvatarChange} />
              
              {/* Anillo de avatar elegante y sutil */}
              <div className="p-1 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                <img
                  src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(editName || user?.name || 'Z')}&background=06b6d4&color=fff&bold=true`}
                  alt="Avatar"
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-black object-cover bg-black"
                />
                
                {/* Botón flotante para cambiar foto */}
                <div className="absolute bottom-0 right-0 p-2 rounded-full bg-black/90 border border-cyan-400/50 text-cyan-300 shadow-lg hover:bg-cyan-500 hover:text-black transition-colors group-hover/avatar:scale-110">
                  <Camera size={13} className="sm:w-[15px] sm:h-[15px]" />
                </div>
              </div>
            </label>
          </div>

          {/* Nombre y Título del Usuario */}
          <h3 className="text-2xl sm:text-3xl font-extrabold mystic-font text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200 tracking-wider mb-1.5">
            {editName || user?.name || 'Sintonizador'}
          </h3>

          {/* Badges de Citas e Identidad */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs mb-4 sm:mb-6">
            {editLocation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium">
                <MapPin size={11} className="text-cyan-400" /> {editLocation}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold uppercase tracking-wider">
              <Heart size={11} className="text-pink-400 fill-pink-400/50" /> {editIntent}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En Sintonía
            </span>
          </div>

          {/* TRILOGÍA ASTRAL EQUILIBRADA EN 3 COLUMNAS RESPONSIVAS */}
          <div className="w-full max-w-xl grid grid-cols-3 gap-1.5 sm:gap-3">
            
            {/* 1. Signo Solar */}
            <div
              onClick={() => setActiveKnowledgeModal('sign')}
              className="p-2.5 sm:p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer flex flex-col items-center text-center group hover:bg-black/60 shadow-sm"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <ZodiacBadge sign={userSign} size="xs" zoom={1.1} className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-cyan-400 uppercase tracking-wider font-bold truncate max-w-full">Signo</span>
              <span className="text-xs sm:text-base font-bold text-white mt-0.5 truncate max-w-full">{userSign}</span>
              <span className="text-[10px] text-gray-400 font-light truncate max-w-full">{userElement}</span>
            </div>

            {/* 2. Camino de Vida (Numerología) */}
            <div
              onClick={() => setActiveKnowledgeModal('lifepath')}
              className="p-2.5 sm:p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer flex flex-col items-center text-center group hover:bg-black/60 shadow-sm"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <span className="mystic-font text-lg sm:text-2xl text-amber-400 font-extrabold">{lifePath}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-amber-400 uppercase tracking-wider font-bold truncate max-w-full">Camino</span>
              <span className="text-xs sm:text-base font-bold text-white mt-0.5 truncate max-w-full">Número {lifePath}</span>
              <span className="text-[10px] text-gray-400 font-light truncate max-w-full">{archetype.split(' ')[0]}</span>
            </div>

            {/* 3. Elemento Natal */}
            <div
              onClick={() => setActiveKnowledgeModal('element')}
              className="p-2.5 sm:p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col items-center text-center group hover:bg-black/60 shadow-sm"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                {React.cloneElement(currentElementUI.icon, { size: 18, className: `${currentElementUI.icon.props.className} sm:w-5 sm:h-5` })}
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider font-bold truncate max-w-full">Elemento</span>
              <span className="text-xs sm:text-base font-bold text-white mt-0.5 truncate max-w-full">{userElement}</span>
              <span className="text-[10px] text-gray-400 font-light truncate max-w-full">Primordial</span>
            </div>

          </div>

        </div>
      </div>

      {/* ── 2. SECCIÓN: SOBRE MÍ (BIOGRAFÍA) ── */}
      <div className="glass-panel p-6 border border-white/10 relative bg-gradient-to-br from-black/80 to-cyan-950/20">
        <h4 className="mystic-font text-lg text-white mb-3 flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} /> Sobre Mí
        </h4>
        <div className="relative bg-black/50 p-5 rounded-2xl border border-cyan-500/20 shadow-inner">
          <span className="text-4xl text-cyan-500/20 font-serif absolute top-2 left-3 select-none">“</span>
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-light italic pl-4 pr-2">
            {editBio}
          </p>
          <span className="text-4xl text-cyan-500/20 font-serif absolute bottom-0 right-3 select-none">”</span>
        </div>
      </div>

      {/* ── 2.5 SECCIÓN: MIS PASIONES & ESTILO DE VIDA ── */}
      <div className="glass-panel p-6 border border-white/10 bg-gradient-to-br from-black/80 to-purple-950/20">
        <div className="flex justify-between items-center mb-2">
          <h4 className="mystic-font text-lg text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} /> Mis Pasiones & Estilo de Vida
          </h4>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
          >
            <Edit3 size={12} /> Editar
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Etiquetas que potencian tu porcentaje de afinidad con personas afines
        </p>
        <div className="flex flex-wrap gap-2">
          {editInterests && editInterests.length > 0 ? (
            editInterests.map((interest, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={11} className="text-amber-400" />
                {interest}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">No has seleccionado pasiones aún. Toca Editar para agregarlas.</p>
          )}
        </div>
      </div>

      {/* ── 3. MULTIMEDIA DE PRESENTACIÓN (1 MINI VIDEO 5S + 5 FOTOS WEBP) ── */}
      <div className="glass-panel p-5 sm:p-6 border border-white/10 space-y-5">
        
        {/* Cabecera del módulo multimedia */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h4 className="mystic-font text-lg text-white flex items-center gap-2">
              <Film className="text-sky-400" size={19} /> Multimedia de Presentación
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              1 mini video de 5s (reproducción prioritaria en Citas) + hasta 5 fotografías optimizadas en R2.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              editVideoUrl ? 'bg-sky-500/10 border-sky-400/40 text-sky-300' : 'bg-white/[0.03] border-white/10 text-slate-400'
            }`}>
              Video: {editVideoUrl ? '1 / 1' : '0 / 1'}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              editPhotos.length > 0 ? 'bg-purple-500/10 border-purple-400/40 text-purple-300' : 'bg-white/[0.03] border-white/10 text-slate-400'
            }`}>
              Fotos: {editPhotos.length} / 5
            </span>
          </div>
        </div>

        {/* Feedback visual en vivo durante compresión y recorte */}
        {isProcessingMedia && (
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center gap-3 animate-pulse">
            <Loader2 className="animate-spin text-sky-400 shrink-0" size={20} />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">{mediaProgressMsg}</span>
              {mediaProgressPercent > 0 && (
                <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${mediaProgressPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BLOQUE A: MINI VIDEO DE PRESENTACIÓN (MÁX 5 SEGUNDOS) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Video size={14} /> Mini Video de Presentación (5s máx)
            </span>
            <span className="text-[10px] text-slate-400">Se reproduce primero en el carrusel de Citas</span>
          </div>

          {editVideoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-black group shadow-xl max-w-sm mx-auto">
              <video
                src={editVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-56 sm:h-64 object-cover"
              />
              
              {/* Badge superior */}
              <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md border border-sky-400/40 text-sky-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                <Play size={10} className="fill-sky-300" /> Mini Video 5s
              </div>

              {/* Botón de eliminación y reemplazo en hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="p-2.5 bg-sky-500 hover:bg-sky-400 rounded-full text-black transition cursor-pointer shadow-lg" title="Cambiar video">
                  <input type="file" accept="video/*" hidden onChange={handleAddVideo} />
                  <UploadCloud size={16} />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="p-2.5 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition shadow-lg"
                  title="Eliminar video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <label className="p-6 rounded-2xl border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-sky-500/[0.03] hover:bg-sky-500/[0.07] transition flex flex-col items-center justify-center cursor-pointer text-center group">
              <input type="file" accept="video/*" hidden onChange={handleAddVideo} />
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform mb-2">
                <Video size={24} />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Subir Mini Video (5s máx)
              </span>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Puedes seleccionar cualquier video: el sistema recortará automáticamente los primeros 5.0 segundos y optimizará su compresión para R2.
              </p>
            </label>
          )}
        </div>

        {/* ── BLOQUE B: GALERÍA DE 5 FOTOGRAFÍAS (WEBP) ── */}
        <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} /> Fotografías ({editPhotos.length}/5)
            </span>
            <span className="text-[10px] text-slate-400">Compresión WebP automática</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {editPhotos.map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActiveLightboxImg(photoUrl)}
                className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group shadow-lg bg-black cursor-pointer hover:border-purple-400 transition-all hover:scale-[1.02]"
              >
                <img src={photoUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                
                {/* Overlay en hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Maximize2 size={18} className="text-white" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(idx);
                    }}
                    className="p-1.5 bg-rose-500/80 hover:bg-rose-600 rounded-full text-white transition"
                    title="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {idx === 0 && (
                  <span className="absolute top-2 left-2 bg-sky-500 text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-md">
                    Principal
                  </span>
                )}
              </div>
            ))}

            {editPhotos.length < 5 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/10 transition flex flex-col items-center justify-center cursor-pointer text-purple-300 gap-1.5 group">
                <input type="file" accept="image/*" hidden onChange={handleAddPhoto} />
                <div className="p-3 rounded-full bg-purple-500/10 group-hover:scale-110 transition-transform">
                  <Plus size={22} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Añadir Foto</span>
                <span className="text-[9px] text-slate-500">({editPhotos.length}/5)</span>
              </label>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. MAPA DE NUMEROLOGÍA COMPLETO (INSPIRADO EN LA APP) ── */}
      <div className="glass-panel p-6 border border-purple-500/30 bg-gradient-to-br from-[#0c0818] via-black to-[#0d0a20] space-y-6 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)]">
        
        {/* Header del Mapa Numerológico */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h4 className="mystic-font text-xl text-white flex items-center gap-2">
              <Sparkles className="text-purple-400" size={22} /> Mapa de Numerología Personal
            </h4>
            <p className="text-[11px] text-gray-400">Tus códigos numéricos celestiales desglosados con precisión</p>
          </div>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-bold">
            {editName || user?.name}
          </span>
        </div>

        {/* Bloque 1: Números de Fecha de Nacimiento */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block px-1">
            Números de Fecha de Nacimiento
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Camino de Vida principal */}
            <div
              onClick={() => setActiveKnowledgeModal('lifepath')}
              className="bg-gradient-to-br from-purple-900/40 to-black p-4 rounded-2xl border border-purple-500/40 flex flex-col items-center justify-center text-center shadow-md cursor-pointer hover:border-purple-400 transition"
            >
              <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/40 mb-2">
                <Star size={24} className="text-amber-400" />
              </div>
              <span className="text-[10px] text-purple-300 uppercase font-bold tracking-widest">Camino de Vida</span>
              <span className="mystic-font text-4xl text-amber-400 font-extrabold my-1">{numerologyData.lifePath}</span>
              <span className="text-xs text-gray-300 italic">{archetype}</span>
            </div>

            {/* Filas de valores de fecha */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex justify-between items-center bg-black/60 p-3.5 rounded-xl border border-white/10">
                <span className="text-xs text-gray-300 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Número de Actitud (Día + Mes)
                </span>
                <span className="mystic-font text-xl text-cyan-400 font-bold">{numerologyData.attitude}</span>
              </div>
              <div className="flex justify-between items-center bg-black/60 p-3.5 rounded-xl border border-white/10">
                <span className="text-xs text-gray-300 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Número de Generación (Año)
                </span>
                <span className="mystic-font text-xl text-purple-400 font-bold">{numerologyData.generation}</span>
              </div>
              <div className="flex justify-between items-center bg-black/60 p-3.5 rounded-xl border border-white/10">
                <span className="text-xs text-gray-300 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Día de Nacimiento
                </span>
                <span className="mystic-font text-xl text-amber-400 font-bold">{numerologyData.birthDay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: Los Números del Nombre */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block px-1">
            Los Números del Nombre
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-black/60 p-4 rounded-2xl border border-cyan-500/30 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Expresión (Destino)</span>
              <span className="mystic-font text-3xl text-cyan-400 font-bold">{numerologyData.expression}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-purple-500/30 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Alma (Deseo Interior)</span>
              <span className="mystic-font text-3xl text-purple-400 font-bold">{numerologyData.soul}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-amber-500/30 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Personalidad Externa</span>
              <span className="mystic-font text-3xl text-amber-400 font-bold">{numerologyData.personality}</span>
            </div>
          </div>
        </div>

        {/* Bloque 3: Ciclos de Predicción Personales */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block px-1">
            Ciclos de Predicción Personales
          </span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 shadow-md">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block">Día Personal</span>
              <span className="mystic-font text-3xl text-emerald-300 font-extrabold">{numerologyData.personalDay}</span>
            </div>
            <div className="bg-cyan-500/10 p-3.5 rounded-2xl border border-cyan-500/30 shadow-md">
              <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest block">Mes Personal</span>
              <span className="mystic-font text-3xl text-cyan-300 font-extrabold">{numerologyData.personalMonth}</span>
            </div>
            <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 shadow-md">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">Año Personal</span>
              <span className="mystic-font text-3xl text-amber-300 font-extrabold">{numerologyData.personalYear}</span>
            </div>
          </div>

          {/* Afirmación / Vibración del Día */}
          <div className="bg-black/50 p-4 rounded-2xl border border-emerald-500/20 text-xs italic text-emerald-200 mt-2 font-light">
            💡 <strong>Vibración del Día Personal #{numerologyData.personalDay}:</strong> {NUMEROLOGY_DAILY_ADVICE[numerologyData.personalDay] || NUMEROLOGY_DAILY_ADVICE[1]}
          </div>
        </div>

        {/* Bloque 4: Número de Madurez */}
        <div className="flex justify-between items-center bg-gradient-to-r from-purple-950/40 to-black p-4 rounded-2xl border border-purple-500/30">
          <span className="text-xs text-purple-200 font-bold uppercase tracking-wider flex items-center gap-2">
            <Shield size={16} className="text-purple-400" /> Número de Madurez
          </span>
          <span className="mystic-font text-2xl text-amber-400 font-bold">{numerologyData.maturity}</span>
        </div>

      </div>

      {/* ── 5. IDENTIDAD ASTRAL INTERACTIVA (SIGNO SOLAR & DETALLES) ── */}
      <div className="flex items-center justify-between px-2 pt-2">
        <h4 className="mystic-font text-lg text-white flex items-center gap-2">
          <BookOpen className="text-amber-400" size={18} /> Tu Identidad Astral & Sabiduría
        </h4>
        <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1 animate-pulse">
          <Info size={12} /> Toca para explorar
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta Clickeable: Signo Solar */}
        <div
          onClick={() => setActiveKnowledgeModal('sign')}
          className={`glass-panel p-6 bg-gradient-to-br ${currentElementUI.color} border ${currentElementUI.border} ${currentElementUI.glow} cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden`}
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
              Signo Solar <Info size={12} className="text-cyan-400 group-hover:scale-125 transition-transform" />
            </p>
            {currentElementUI.icon}
          </div>
          <div className="flex items-center gap-3 my-2">
            <span className="mystic-font text-3xl sm:text-4xl text-white font-bold group-hover:text-cyan-300 transition-colors">
              {userSign}
            </span>
            <ZodiacBadge sign={userSign} size="md" zoom={1.35} />
          </div>
          <div className="flex items-center justify-between mt-3 border-t border-white/10 pt-2 text-[11px]">
            <span className="font-bold uppercase text-amber-400">Elemento {userElement}</span>
            <span className="text-cyan-300 font-bold flex items-center gap-1 group-hover:underline">
              Saber más <BookOpen size={12} />
            </span>
          </div>
        </div>

        {/* Tarjeta Clickeable: Camino de Vida */}
        <div
          onClick={() => setActiveKnowledgeModal('lifepath')}
          className="glass-panel p-6 bg-gradient-to-br from-purple-950/30 via-amber-950/20 to-black border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
              Camino de Vida <Info size={12} className="text-purple-400 group-hover:scale-125 transition-transform" />
            </p>
            <Star className="text-purple-400" size={20} />
          </div>
          <div className="flex items-baseline gap-3 my-2">
            <span className="mystic-font text-4xl sm:text-5xl text-amber-400 font-bold">{lifePath}</span>
            <span className="text-base text-gray-200 italic font-mystic group-hover:text-purple-300 transition-colors">
              {archetype}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 border-t border-white/10 pt-2 text-[11px]">
            <span className="text-purple-300 uppercase font-semibold">Numerología Natal</span>
            <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:underline">
              Saber más <BookOpen size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* ── 6. DUALIDAD INTERIOR (FORTALEZAS & DESAFÍOS) ── */}
      <div className="glass-panel p-6 border border-white/10">
        <h4 className="mystic-font text-lg text-white mb-4 flex items-center gap-2">
          <Shield className="text-purple-400" size={18} /> Fortalezas y Desafíos
        </h4>
        <div className="space-y-4">
          <div className="bg-black/50 p-4 rounded-2xl border border-cyan-500/20 shadow-inner">
            <p className="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-2">
              <Sun className="text-cyan-400" size={16} /> Luz (Fortalezas Principales)
            </p>
            <p className="text-sm text-gray-200 pl-6 italic font-light">{signInfo.luz}</p>
          </div>
          <div className="bg-black/50 p-4 rounded-2xl border border-purple-500/20 shadow-inner">
            <p className="text-xs text-purple-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-2">
              <Moon className="text-purple-400" size={16} /> Sombra (Desafíos de Crecimiento)
            </p>
            <p className="text-sm text-gray-200 pl-6 italic font-light">{signInfo.sombra}</p>
          </div>
        </div>
      </div>

      {/* ── 7. RUEDA ELEMENTAL INTERACTIVA ── */}
      <div className="glass-panel p-6 border border-white/10 text-center">
        <h4 className="mystic-font text-lg text-white mb-1 flex items-center justify-center gap-2">
          <Compass className="text-cyan-400" size={18} /> Rueda de los 4 Elementos
        </h4>
        <p className="text-[11px] text-gray-400 mb-6">Toca cualquier elemento para conocer su influencia en tu personalidad</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'Fuego',  icon: <Flame size={22} />,    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
            { name: 'Tierra', icon: <Mountain size={22} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { name: 'Aire',   icon: <Wind size={22} />,     color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
            { name: 'Agua',   icon: <Droplets size={22} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
          ].map((elem) => {
            const isUserElem = elem.name === userElement;
            return (
              <div
                key={elem.name}
                onClick={() => setActiveKnowledgeModal('element')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group ${
                  isUserElem
                    ? `${elem.bg} border-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105`
                    : 'bg-black/40 border-white/5 opacity-60 hover:opacity-100 hover:scale-102'
                }`}
              >
                <div className={`${elem.color} group-hover:scale-125 transition-transform`}>{elem.icon}</div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{elem.name}</span>
                {isUserElem ? (
                  <span className="text-[9px] bg-cyan-500 text-black font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Elemento Natal
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-400 underline">Ver detalles</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL DE PREVISUALIZACIÓN PÚBLICA (PORTAL CENTRADO AISLADO) ── */}
      <AstralPortalModal
        isOpen={isPublicPreviewOpen}
        onClose={() => setIsPublicPreviewOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={14} /> Vista Previa de tu Perfil Público
            </span>
            <button onClick={() => setIsPublicPreviewOpen(false)} className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          <div className="text-center">
            <div className="relative inline-block mb-3">
              <img
                src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(editName || user?.name || 'Z')}&background=06b6d4&color=fff&bold=true`}
                alt={editName}
                className="w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] object-cover bg-black mx-auto"
              />
              <ZodiacBadge sign={userSign} size="md" zoom={1.35} className="absolute -bottom-1 -right-1 border-2 border-black" />
            </div>

            <h3 className="text-2xl font-bold mystic-font text-white">{editName || user?.name}</h3>
            <p className="text-xs text-cyan-400 font-semibold mt-1">
              {userSign} • Elemento {userElement}
            </p>

            <div className="flex justify-center items-center gap-2 mt-3 text-xs">
              {editLocation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-gray-300">
                  <MapPin size={12} className="text-cyan-400" /> {editLocation}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                <Heart size={12} /> {editIntent}
              </span>
            </div>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sobre Mí</span>
            <p className="text-xs text-gray-200 leading-relaxed italic font-light">
              "{editBio}"
            </p>
          </div>

          {editPhotos.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Fotos de Presentación</span>
              <div className="grid grid-cols-3 gap-2">
                {editPhotos.map((photo, i) => (
                  <img key={i} src={photo} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border border-white/10 bg-black" />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsPublicPreviewOpen(false)}
            className="btn-mystic w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider"
          >
            VOLVER A MI PERFIL
          </button>
        </div>
      </AstralPortalModal>

      {/* ── LIGHTBOX DE FOTOS (PORTAL CENTRADO AISLADO) ── */}
      <AstralPortalModal
        isOpen={Boolean(activeLightboxImg)}
        onClose={() => setActiveLightboxImg(null)}
        maxWidth="max-w-2xl"
        className="p-2 sm:p-4 bg-transparent border-none shadow-none text-center"
      >
        <div className="relative text-center">
          <button className="absolute -top-8 right-0 text-white hover:text-cyan-400 transition" onClick={() => setActiveLightboxImg(null)}>
            <X size={24} />
          </button>
          <img src={activeLightboxImg} alt="Visualización" className="max-h-[80vh] w-auto mx-auto rounded-3xl border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)] object-contain" />
        </div>
      </AstralPortalModal>

      {/* ── MODAL DE CONOCIMIENTO 1: DETALLES DEL SIGNO SOLAR ── */}
      <AstralPortalModal
        isOpen={activeKnowledgeModal === 'sign'}
        onClose={() => setActiveKnowledgeModal(null)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <ZodiacBadge sign={userSign} size="md" zoom={1.35} />
              <div>
                <h3 className="mystic-font text-xl text-white">Signo Solar: {userSign}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Regente: <span className="text-amber-400 font-bold">{zodiacDetail.ruler}</span> • Modalidad: {zodiacDetail.modality}
                </p>
              </div>
            </div>
            <button onClick={() => setActiveKnowledgeModal(null)} className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Mantra Astral</span>
            <p className="text-sm text-cyan-200 italic font-mystic">"{zodiacDetail.mantra}"</p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart size={14} className="fill-purple-400/30" /> En las Citas y las Relaciones
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {zodiacDetail.loveDescription}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} /> Personalidad & Frecuencia
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {zodiacDetail.personality}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={14} /> Parejas & Signos Compatibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {zodiacDetail.idealMatches.map(match => (
                <span key={match} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold flex items-center gap-1">
                  <ZodiacBadge sign={match} size="xs" zoom={1.3} /> {match}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveKnowledgeModal(null)}
            className="btn-mystic w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider mt-2"
          >
            ENTENDIDO
          </button>
        </div>
      </AstralPortalModal>

      {/* ── MODAL DE CONOCIMIENTO 2: DETALLES DEL CAMINO DE VIDA ── */}
      <AstralPortalModal
        isOpen={activeKnowledgeModal === 'lifepath'}
        onClose={() => setActiveKnowledgeModal(null)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="mystic-font text-4xl text-amber-400 font-bold">{lifePath}</span>
              <div>
                <h3 className="mystic-font text-xl text-white">Camino {lifePath}: {lifePathDetail.title}</h3>
                <p className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold">
                  Arcano Asociado: {lifePathDetail.archetype}
                </p>
              </div>
            </div>
            <button onClick={() => setActiveKnowledgeModal(null)} className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Star size={14} /> Misión de Vida & Propósito
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {lifePathDetail.mission}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart size={14} className="fill-purple-400/30" /> Tu Frecuencia en las Citas & el Amor
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {lifePathDetail.loveStyle}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} /> Desafío de Crecimiento Kármico
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {lifePathDetail.challenge}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={14} /> Números de Vida Compatibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {lifePathDetail.compatiblePaths.map(num => (
                <span key={num} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-bold">
                  Camino {num}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveKnowledgeModal(null)}
            className="btn-mystic w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider mt-2"
          >
            ENTENDIDO
          </button>
        </div>
      </AstralPortalModal>

      {/* ── MODAL DE CONOCIMIENTO 3: DETALLES DEL ELEMENTO ── */}
      <AstralPortalModal
        isOpen={activeKnowledgeModal === 'element'}
        onClose={() => setActiveKnowledgeModal(null)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-full border border-emerald-500/40">
                <Mountain className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="mystic-font text-xl text-white">Elemento Natal: {userElement}</h3>
                <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-semibold">
                  {ELEMENT_DETAILS[userElement]?.title}
                </p>
              </div>
            </div>
            <button onClick={() => setActiveKnowledgeModal(null)} className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Vibración & Esencia</h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {ELEMENT_DETAILS[userElement]?.traits}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart size={14} className="fill-amber-400/30" /> Comportamiento en Citas y Pareja
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {ELEMENT_DETAILS[userElement]?.loveStyle}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Complementos Elementales</h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-2xl border border-white/10 font-light">
              {ELEMENT_DETAILS[userElement]?.complement}
            </p>
          </div>

          <button
            onClick={() => setActiveKnowledgeModal(null)}
            className="btn-mystic w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider mt-2"
          >
            ENTENDIDO
          </button>
        </div>
      </AstralPortalModal>

      {/* ── MODAL INTERACTIVO DE EDICIÓN DE PERFIL (PORTAL CENTRADO AISLADO) ── */}
      <AstralPortalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="mystic-font text-xl text-white flex items-center gap-2">
              <Edit3 className="text-cyan-400" size={20} /> Editar Perfil Social
            </h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl flex items-center justify-center gap-2 animate-bounce">
              <Check size={16} /> {saveSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Campo para cambiar Fecha de Nacimiento con Advertencia */}
            <div className="space-y-2 p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" /> Fecha de Nacimiento
                </label>
                <span className="text-[9px] text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40">
                  Identidad Cósmica
                </span>
              </div>

              <input
                type="date"
                required
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-black/70 border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-white outline-none text-sm cursor-pointer"
              />

              {/* Advertencia destacada */}
              <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-200/90 leading-relaxed">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-amber-300">Aviso importante:</strong> Zodia utiliza tu fecha de nacimiento para calcular tu Signo Solar, Elemento, Arquetipo y la compatibilidad cósmica en Citas. Modificarla recalculará toda tu carta y tus afinidades astrales.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">
                Nombre o Alias
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">
                Ubicación (Ciudad, País)
              </label>
              <input
                type="text"
                placeholder="Ej: Santiago, Chile"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">
                ¿Qué buscas en Zodia?
              </label>
              <select
                value={editIntent}
                onChange={(e) => setEditIntent(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none text-sm"
              >
                <option value="Citas y Pareja">💖 Citas y Pareja</option>
                <option value="Amistad & Conexiones">🤝 Amistad & Conexiones</option>
                <option value="Conexiones Astrales">🔮 Lecturas y Espiritualidad</option>
                <option value="Explorando el Universo">🌟 Explorando el Universo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1 tracking-widest">
                Sobre Mí (Descripción)
              </label>
              <textarea
                rows={4}
                placeholder="Escribe sobre tus gustos, pasiones y lo que esperas encontrar..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none text-sm placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Selector de Pasiones e Intereses */}
            <div className="space-y-3 pt-1">
              <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Tus Pasiones e Intereses ({editInterests.length} seleccionados)
              </label>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {CATEGORIZED_INTERESTS.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider block">
                      {cat.icon} {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tags.map((tag) => {
                        const isSelected = editInterests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setEditInterests(prev => 
                                isSelected ? prev.filter(t => t !== tag) : [...prev, tag]
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                              isSelected
                                ? 'bg-cyan-500/25 border-cyan-400 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/15 text-xs text-gray-300 font-bold uppercase tracking-wider hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-mystic flex-1 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </form>
        </div>
      </AstralPortalModal>
    </div>
  );
};
