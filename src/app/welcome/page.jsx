"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../lib/api';
import { CATEGORIZED_INTERESTS } from '../../lib/dating';
import { ZodiacBadge } from '../../components/astral/ZodiacBadge';
import { Sparkles, Camera, MapPin, Heart, ArrowRight, Check, Star, User, Compass } from 'lucide-react';

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Campos de configuración
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Santiago, Chile');
  const [intent, setIntent] = useState('Citas y Pareja');
  const [bio, setBio] = useState('Amante de la astrología, la buena música y las conversaciones que duran hasta tarde ✨');
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([
    'Música indie',
    'Café de especialidad',
    'Astrología',
    'Festivales en vivo'
  ]);

  // Cargar perfil al iniciar
  useEffect(() => {
    let activeUser = session?.user;
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zodia_session');
        if (stored) activeUser = JSON.parse(stored);
      } catch {}
    }

    if (status === 'unauthenticated' && !activeUser) {
      window.location.href = '/zodia';
      return;
    }

    if (!activeUser && status !== 'authenticated') return;

    if (activeUser && typeof document !== 'undefined') {
      try {
        document.cookie = `next-auth.session-token=${encodeURIComponent(JSON.stringify(activeUser))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      } catch {}
    }

    const loadProfile = async () => {
      try {
        const res = await apiFetch('/api/profile');
        const data = await res.json();
        if (data.exists && data.profile) {
          setProfile(data.profile);
          setName(data.profile.user_name || activeUser?.name || '');
          if (data.profile.location) setLocation(data.profile.location);
          if (data.profile.intent) setIntent(data.profile.intent);
          if (data.profile.bio) setBio(data.profile.bio);
          if (data.profile.user_image || activeUser?.image) {
            setAvatarSrc(data.profile.user_image || activeUser?.image);
          }
          if (data.profile.interests) {
            try {
              const parsed = typeof data.profile.interests === 'string' ? JSON.parse(data.profile.interests) : data.profile.interests;
              if (Array.isArray(parsed) && parsed.length > 0) setSelectedInterests(parsed);
            } catch {}
          }
        } else if (activeUser) {
          setName(activeUser.name || '');
          if (activeUser.image) setAvatarSrc(activeUser.image);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
        if (activeUser) {
          setName(activeUser.name || '');
          if (activeUser.image) setAvatarSrc(activeUser.image);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [status, session]);

  // Manejar cambio de foto de perfil
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarSrc(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Alternar selección de etiqueta de interés
  const toggleInterest = (tag) => {
    setSelectedInterests(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        if (prev.length >= 12) {
          alert('Puedes seleccionar hasta 12 intereses para mantener tu perfil enfocado.');
          return prev;
        }
        return [...prev, tag];
      }
    });
  };

  // Guardar y continuar al Dashboard de Citas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || session?.user?.name || 'Sintonizador',
          location: location.trim(),
          intent,
          bio: bio.trim(),
          image: avatarSrc,
          interests: selectedInterests
        })
      });

      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('zodia_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = name.trim() || parsed.name;
            if (avatarSrc) parsed.image = avatarSrc;
            localStorage.setItem('zodia_session', JSON.stringify(parsed));
            document.cookie = `next-auth.session-token=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          }
        } catch {}
      }

      // Redirigir directamente al dashboard (pestaña citas)
      window.location.href = '/zodia/dashboard';
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      alert('Ocurrió un detalle al guardar tu perfil. Redirigiendo...');
      window.location.href = '/zodia/dashboard';
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
        <h2 className="mystic-font text-xl text-cyan-300">Sincronizando con el Cosmos...</h2>
        <p className="text-xs text-gray-400 mt-2">Calculando tu esencia cósmica</p>
      </div>
    );
  }

  const userSign = profile?.sign || 'Capricornio';
  const userElement = profile?.element || 'Tierra';
  const lifePath = profile?.life_path_number || 9;
  const archetype = profile?.archetype || 'El Ermitaño';

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white py-8 px-4 sm:px-6 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Luces de fondo cósmicas */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        
        {/* ── 1. CABECERA: BIENVENIDA & REVELACIÓN ASTRAL ── */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Sparkles size={14} className="text-amber-400 animate-spin" /> ¡Bienvenido/a a ZODIA!
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold mystic-font text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200 tracking-wide leading-tight">
            Tu Espejo Astral Ha Nacido
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mt-3 max-w-lg mx-auto leading-relaxed font-light">
            Hemos calculado tu firma energética única en el universo. Personaliza tu presentación para comenzar a conectar con personas en tu misma sintonía.
          </p>

          {/* Tarjeta de Revelación Cósmica */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#0e1222] to-black border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] text-left">
            
            {/* Signo Solar */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-inner">
                <ZodiacBadge sign={userSign} size="md" zoom={1.2} className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">Tu Signo Solar</span>
                <span className="text-base sm:text-lg font-bold text-white leading-tight">{userSign}</span>
                <span className="text-xs text-gray-400 font-light block mt-0.5">{userElement}</span>
              </div>
            </div>

            {/* Camino de Vida */}
            <div className="flex items-center gap-3 p-2 border-l border-white/10 pl-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <span className="mystic-font text-2xl sm:text-3xl text-amber-400 font-extrabold">{lifePath}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">Camino de Vida</span>
                <span className="text-base sm:text-lg font-bold text-white leading-tight">Número {lifePath}</span>
                <span className="text-xs text-gray-400 font-light block mt-0.5 truncate max-w-[120px] sm:max-w-none">{archetype}</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. FORMULARIO PRINCIPAL DE BIENVENIDA ── */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* FOTO DE PERFIL & DATOS DE IDENTIDAD */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 bg-gradient-to-b from-[#0a0d18] to-black space-y-6">
            
            <div className="text-center">
              <h2 className="mystic-font text-xl text-white flex items-center justify-center gap-2">
                <Camera className="text-cyan-400" size={20} /> Tu Foto de Presentación
              </h2>
              <p className="text-xs text-gray-400 mt-1">Una buena foto auténtica conecta de inmediato con almas afines</p>
            </div>

            {/* Selector Central de Avatar */}
            <div className="flex flex-col items-center justify-center">
              <label className="relative block cursor-pointer group">
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                
                <div className="p-1 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-amber-300 shadow-[0_0_30px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Z')}&background=06b6d4&color=fff&bold=true`}
                    alt="Avatar"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black object-cover bg-black"
                  />
                  <div className="absolute bottom-1 right-1 p-2.5 rounded-full bg-black/90 border border-cyan-400/50 text-cyan-300 shadow-lg group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    <Camera size={16} />
                  </div>
                </div>
              </label>
              <span className="text-xs text-cyan-300 font-semibold mt-3">
                Toca la foto para subir tu imagen desde tu dispositivo
              </span>
            </div>

            {/* Campos de Nombre y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5 pl-1">
                  Tu Nombre o Alias
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1">
                  <MapPin size={12} /> Ciudad o Ubicación
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Santiago, Chile"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition shadow-inner"
                />
              </div>
            </div>

            {/* ¿Qué buscas en Zodia? */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1">
                <Heart size={12} className="text-pink-400" /> ¿Qué buscas en Zodia?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { label: 'Citas y Pareja', desc: 'Romance y conexión' },
                  { label: 'Conexión Casual', desc: 'Conocer y fluir' },
                  { label: 'Amistad Cósmica', desc: 'Charlas y complicidad' }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setIntent(opt.label)}
                    className={`p-3 rounded-2xl text-left transition-all border ${
                      intent === opt.label
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Biografía / Sobre mí */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5 pl-1">
                Sobre Mí (Presentación de Citas)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntanos un poco sobre tus gustos, qué te hace reír o qué plan te gustaría tener en una primera cita..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-sm text-white focus:border-cyan-400 outline-none transition shadow-inner resize-none leading-relaxed"
              />
            </div>

          </div>

          {/* ── 3. ETIQUETAS DE GUSTOS & COMPATIBILIDAD ── */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0c0d1c] to-black space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h2 className="mystic-font text-xl text-white flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={20} /> Tus Pasiones & Estilo de Vida
                </h2>
                <p className="text-xs text-gray-300 mt-0.5">
                  Estas etiquetas potenciarán directamente tu <strong>% de Afinidad</strong> con personas afines
                </p>
              </div>
              <span className="self-start sm:self-center px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold">
                {selectedInterests.length} seleccionadas
              </span>
            </div>

            {/* Bloques por categoría */}
            <div className="space-y-5">
              {CATEGORIZED_INTERESTS.map((catGroup) => (
                <div key={catGroup.category} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 pl-1">
                    <span>{catGroup.icon}</span>
                    <span>{catGroup.category}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {catGroup.tags.map((tag) => {
                      const isSelected = selectedInterests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.03]'
                              : 'bg-black/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-cyan-300" />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── BOTÓN FINAL DE ACTIVACIÓN ── */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-mystic w-full py-4 sm:py-5 rounded-2xl text-white font-extrabold tracking-widest text-sm uppercase flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:scale-[1.01] transition-transform"
            >
              {isSaving ? "MANIFESTANDO PERFIL..." : "ACTIVAR MI PERFIL Y EXPLORAR CITAS"}
              {!isSaving && <ArrowRight size={18} />}
            </button>
            <p className="text-[11px] text-center text-gray-400 mt-3">
              Podrás editar toda tu información y fotos en cualquier momento desde tu Perfil.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}
