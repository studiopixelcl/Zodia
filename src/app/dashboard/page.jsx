"use client";
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { TabEspejo }   from '../../components/astral/TabEspejo';
import { TabEter }     from '../../components/astral/TabEter';
import { TabOraculo }  from '../../components/astral/TabOraculo';
import { TabVinculos } from '../../components/astral/TabVinculos';
import { TabJuegos }   from '../../components/astral/TabJuegos';
import { BottomNav }   from '../../components/astral/BottomNav';
import { PWAInstallPrompt } from '../../components/ui/PWAInstallPrompt';
import { NotificationManager } from '../../components/ui/NotificationManager';
import ZodiaLogo from '../../components/ui/ZodiaLogo';
import { apiFetch } from '../../lib/api';
import { calculateAstralProfile } from '../../lib/astrology';

// ─── PANTALLA DE ESPERA COMPARTIDA ────────────────────────────────────────────
const Sincronizando = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-cyan-500 animate-pulse mystic-font text-sm tracking-[0.3em] uppercase">
        Sincronizando con la red...
      </p>
    </div>
  </div>
);

// ─── CONTROLADOR PRINCIPAL ────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile,        setProfile]        = useState(null);
  const [profileError,   setProfileError]   = useState(null);
  const [avatarSrc,      setAvatarSrc]      = useState(null);
  // La pantalla principal predeterminada al ingresar o actualizar es siempre el Perfil ('espejo')
  const [activeTab,      setActiveTab]      = useState('espejo');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // ── Sincronización de URL inicial y control de retroceso en móviles ────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const userParam = params.get('userId');

      if (tabParam && ['espejo', 'eter', 'vinculos', 'oraculo', 'juegos'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('espejo');
      }

      if (userParam) {
        setSelectedUserId(userParam);
      }

      // Establecer estado inicial en el historial
      if (!window.history.state) {
        window.history.replaceState({ tab: tabParam || 'espejo', userId: userParam || null }, '', window.location.href);
      }
    }
  }, []);

  // Manejar el botón 'Atrás' del móvil (físico o por gestos)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.userId) {
        setSelectedUserId(state.userId);
        setActiveTab('vinculos');
      } else if (state && state.tab) {
        setSelectedUserId(null);
        setActiveTab(state.tab);
      } else {
        // Al retroceder sin subestado, volver siempre a la página principal: el perfil ('espejo')
        setSelectedUserId(null);
        setActiveTab('espejo');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cambiar pestaña actualizando el historial para permitir retroceso suave
  const handleSwitchTab = (newTab) => {
    if (newTab === activeTab && !selectedUserId) return;
    setSelectedUserId(null);
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const targetUrl = newTab === 'espejo' ? '/zodia/dashboard' : `/zodia/dashboard?tab=${newTab}`;
      window.history.pushState({ tab: newTab }, '', targetUrl);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setActiveTab('vinculos');
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'vinculos', userId }, '', `/zodia/dashboard?tab=vinculos&userId=${userId}`);
    }
  };

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

    const fetchProfile = async () => {
      try {
        const res  = await apiFetch('/api/profile');
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.exists && data.profile) {
            setProfile(data.profile);
            setAvatarSrc(data.profile.user_image ?? activeUser?.image ?? null);
            return;
          }
        }
      } catch (err) {
        console.warn('Advertencia al consultar /api/profile:', err);
      }

      // Si no se obtuvo de la API pero tenemos la sesión del usuario activo:
      if (activeUser) {
        let calculated = null;
        if (activeUser.dob && activeUser.dob.length >= 8 && activeUser.dob !== 'registered') {
          try {
            calculated = calculateAstralProfile(activeUser.dob);
          } catch {}
        }
        setProfile({
          user_id: activeUser.id,
          birth_date: activeUser.dob || '1998-07-15',
          sign: calculated?.sign || 'Capricornio',
          element: calculated?.element || 'Tierra',
          life_path_number: calculated?.lifePath || 9,
          archetype: calculated?.archetype || 'El Ermitaño',
          user_name: activeUser.name,
          user_image: activeUser.image
        });
        setAvatarSrc(activeUser.image);
      } else {
        window.location.href = '/zodia';
      }
    };
    fetchProfile();
  }, [status, session]);
  const [isGameActive, setIsGameActive] = useState(false);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('La imagen no debe superar 2 MB.'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setAvatarSrc(base64);
      try {
        await apiFetch('/api/profile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image: base64 }),
        });
      } catch { /* UI ya actualizado; fallo en DB es silencioso */ }
    };
    reader.readAsDataURL(file);
  };

  // ── Sincronizar desde Éter ───────────────────────────────────────────────────
  const handleSyncUserFromEter = (userId) => {
    handleSelectUser(userId);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('zodia_session');
      document.cookie = 'next-auth.session-token=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    signOut({ callbackUrl: '/zodia' });
  };

  const currentUser = session?.user || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('zodia_session') || 'null'));

  // ── Guardas de renderizado ─────────────────────────────────────────────────
  if (
    (!currentUser && status === 'loading') ||
    (!currentUser && status === 'unauthenticated') ||
    (!profile && !profileError)
  ) return <Sincronizando />;

  if (profileError) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-red-400 text-sm">{profileError}</p>
        <button
          onClick={() => { window.location.href = '/zodia'; }}
          className="text-cyan-400 text-xs uppercase tracking-widest hover:text-white transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!currentUser) return <Sincronizando />;

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-xl mx-auto flex flex-col justify-between overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      <PWAInstallPrompt />

      {/* Header Fijo Arriba */}
      <header className="shrink-0 flex justify-between items-center px-3 pt-2 sm:pt-3 pb-2 border-b border-white/5 bg-[#030308]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <ZodiaLogo size="xs" showText={false} />
          <div>
            <h2 className="mystic-font text-lg sm:text-xl text-white tracking-widest font-extrabold leading-none">
              ZODIA
            </h2>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
              Compatibilidad & Conexiones
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-gray-400 hover:text-cyan-400 transition flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <LogOut size={13} /> Desconectar
        </button>
      </header>

      {/* Contenido Principal con Scroll Interno Independiente */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-1.5 sm:p-2 relative no-scrollbar">
        {activeTab === 'espejo' && (
          <TabEspejo
            profile={profile}
            user={currentUser}
            avatarSrc={avatarSrc ?? currentUser?.image}
            onAvatarChange={handleAvatarChange}
            onNavigateTab={handleSwitchTab}
            onProfileUpdated={(updatedProfile) => {
              setProfile(updatedProfile);
              if (updatedProfile.user_image) setAvatarSrc(updatedProfile.user_image);
            }}
          />
        )}
        {activeTab === 'eter' && (
          <TabEter
            profile={profile}
            onSyncUser={handleSyncUserFromEter}
            userAvatar={avatarSrc ?? currentUser?.image}
          />
        )}
        {activeTab === 'oraculo'  && <TabOraculo profile={profile} />}
        {activeTab === 'vinculos' && (
          <TabVinculos
            selectedUserId={selectedUserId}
            onClearSelection={() => {
              setSelectedUserId(null);
              if (typeof window !== 'undefined') {
                window.history.pushState({ tab: 'vinculos' }, '', '/zodia/dashboard?tab=vinculos');
              }
            }}
            profile={profile}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'juegos'   && <TabJuegos profile={profile} onGameActiveChange={setIsGameActive} />}
      </main>

      {/* Nav Inferior en su propio espacio (NUNCA tapa ni invade el contenido) */}
      {!isGameActive && (
        <footer className="shrink-0 w-full px-2 pt-1.5 pb-2 sm:pb-3 z-30 bg-[#030308]/95 backdrop-blur-2xl border-t border-white/5">
          <BottomNav activeTab={activeTab} setActiveTab={handleSwitchTab} />
        </footer>
      )}

      {/* Gestor de Notificaciones Móviles y Toasts en Tiempo Real */}
      <NotificationManager
        onNavigateToChat={(targetUserId) => {
          handleSelectUser(targetUserId);
        }}
      />
    </div>
  );
}
