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
  const [activeTab,      setActiveTab]      = useState('espejo');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status !== 'authenticated')   return;

    const fetchProfile = async () => {
      try {
        const res  = await fetch('/api/profile');
        const data = await res.json();
        if (!data.exists || !data.profile) { router.push('/'); return; }
        setProfile(data.profile);
        setAvatarSrc(data.profile.user_image ?? session?.user?.image ?? null);
      } catch {
        setProfileError('No se pudo cargar tu perfil astral.');
      }
    };
    fetchProfile();
  }, [status, router, session]);
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
        await fetch('/api/profile', {
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
    setSelectedUserId(userId);
    setActiveTab('vinculos');
  };

  // ── Guardas de renderizado ─────────────────────────────────────────────────
  if (
    status === 'loading' ||
    status === 'unauthenticated' ||
    (status === 'authenticated' && !profile && !profileError)
  ) return <Sincronizando />;

  if (profileError) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-red-400 text-sm">{profileError}</p>
        <button
          onClick={() => router.push('/')}
          className="text-cyan-400 text-xs uppercase tracking-widest hover:text-white transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!session?.user) return <Sincronizando />;

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-6 relative">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="mystic-font text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest">
          ZODIA
        </h2>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-gray-500 hover:text-cyan-400 transition flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          <LogOut size={14} /> Desconectar
        </button>
      </div>

      {activeTab === 'espejo' && (
        <TabEspejo
          profile={profile}
          user={session.user}
          avatarSrc={avatarSrc ?? session.user.image}
          onAvatarChange={handleAvatarChange}
        />
      )}
      {activeTab === 'eter'     && <TabEter profile={profile} onSyncUser={handleSyncUserFromEter} />}
      {activeTab === 'oraculo'  && <TabOraculo profile={profile} />}
      {activeTab === 'vinculos' && (
        <TabVinculos
          selectedUserId={selectedUserId}
          onClearSelection={() => setSelectedUserId(null)}
        />
      )}
      {activeTab === 'juegos'   && <TabJuegos profile={profile} onGameActiveChange={setIsGameActive} />}

      {!isGameActive && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
