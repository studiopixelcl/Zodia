"use client";
import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Mountain, Wind, Droplets, Filter, ArrowRight, MapPin, Heart, MessageCircle, X, Star, Shield } from 'lucide-react';
import { getZodiacSymbol } from '../../lib/astrology';
import { ZodiacBadge } from './ZodiacBadge';

export const TabEter = ({ profile, onSyncUser }) => {
  const [resonances, setResonances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [syncingId, setSyncingId]   = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  // Estado para el modal de inspección de perfil completo
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchResonances = async () => {
      try {
        const res = await fetch('/api/resonances');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Error al conectar con la red de usuarios.');
          return;
        }
        const data = await res.json();
        setResonances(Array.isArray(data) ? data : []);
      } catch {
        setError('No se pudo alcanzar la red astral.');
      } finally {
        setLoading(false);
      }
    };
    fetchResonances();
  }, []);

  const handleSync = async (user) => {
    setSyncingId(user.id);
    try {
      await fetch('/api/resonances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id, score: parseInt(user.affinity) || 80 }),
      });
      if (onSyncUser) {
        onSyncUser(user.id);
      }
    } catch {
      if (onSyncUser) onSyncUser(user.id);
    } finally {
      setSyncingId(null);
      setSelectedCandidate(null);
    }
  };

  const filteredResonances = selectedFilter === 'Todos'
    ? resonances
    : resonances.filter(u => u.element?.toLowerCase() === selectedFilter.toLowerCase());

  return (
    <div className="space-y-6 animate-fadeIn px-4">
      {/* ── CABECERA DE EXPLORAR ── */}
      <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-black/60 border border-cyan-500/20 shadow-md">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulseGlow" />
        <h3 className="mystic-font text-xl text-white mb-2 flex items-center gap-2">
          <Sparkles className="text-cyan-400 animate-pulse" size={20} /> Explorar Compatibilidad
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-light">
          Encuentra personas en sintonía con tu energía de{' '}
          <span className="text-amber-400 font-bold uppercase tracking-wider">{profile?.element ?? 'Tierra'}</span> para citas, amistad y conexiones astrales.
        </p>
      </div>

      {/* ── FILTROS POR ELEMENTO ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1 font-bold pr-2">
          <Filter size={12} /> Elemento:
        </span>
        {[
          { name: 'Todos',  icon: null },
          { name: 'Fuego',  icon: <Flame size={12} className="text-amber-400" /> },
          { name: 'Tierra', icon: <Mountain size={12} className="text-emerald-400" /> },
          { name: 'Aire',   icon: <Wind size={12} className="text-cyan-400" /> },
          { name: 'Agua',   icon: <Droplets size={12} className="text-indigo-400" /> },
        ].map((f) => (
          <button
            key={f.name}
            onClick={() => setSelectedFilter(f.name)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedFilter === f.name
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {f.icon} {f.name}
          </button>
        ))}
      </div>

      {/* ── LISTADO DE TARJETAS SOCIALES ── */}
      <div>
        <h3 className="mystic-font text-lg text-white mb-4 pl-2 flex items-center justify-between">
          <span>Personas Afines</span>
          <span className="text-xs text-cyan-400 font-normal">
            {filteredResonances.length} Perfiles
          </span>
        </h3>

        {loading ? (
          <div className="text-center py-14 text-cyan-500 animate-pulse uppercase text-xs tracking-widest">
            Buscando personas compatibles...
          </div>
        ) : error ? (
          <div className="glass-panel p-6 text-center border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filteredResonances.length === 0 ? (
          <div className="glass-panel p-8 text-center text-gray-400 text-sm">
            No se encontraron usuarios en el elemento {selectedFilter}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredResonances.map((u) => {
              const zodiacSym = getZodiacSymbol(u.sign);
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedCandidate(u)}
                  className="glass-panel p-5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.01]"
                >
                  <div>
                    {/* Header del Perfil: Avatar + Info rápida + Score */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-black border-2 border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner">
                            <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                          </div>
                          <ZodiacBadge sign={u.sign} size="xs" className="absolute -bottom-1 -right-1 border border-black shadow-md" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base group-hover:text-cyan-400 transition-colors">
                            {u.name}
                          </h4>
                          <p className="text-xs text-gray-400 font-light flex items-center gap-1">
                            {u.sign} • <span className="text-amber-400 font-medium">{u.element}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 px-2.5 py-1 rounded-full text-cyan-300 font-extrabold text-xs shadow-sm">
                        {u.affinity}
                      </div>
                    </div>

                    {/* Ubicación e Intención */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px]">
                      {u.location && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-gray-300">
                          <MapPin size={10} className="text-cyan-400" /> {u.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                        <Heart size={10} className="text-purple-400" /> {u.intent || 'Citas y Pareja'}
                      </span>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-gray-300 line-clamp-2 italic mb-3 bg-black/40 p-2.5 rounded-xl border border-white/5 font-light">
                      "{u.bio || `Buscando almas afines para compartir momentos astrales.`}"
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">
                      Camino {u.path}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSync(u);
                      }}
                      disabled={syncingId === u.id}
                      className="btn-mystic px-3.5 py-1.5 rounded-xl text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-md"
                    >
                      {syncingId === u.id ? 'CONECTANDO...' : 'ENVIAR MENSAJE'}
                      {syncingId !== u.id && <ArrowRight size={12} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: INSPECCIONAR PERFIL COMPLETO (PERFECTAMENTE CENTRADO Z-9999) ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/90 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto grid place-items-center animate-fadeIn">
          <div className="relative my-auto w-full max-w-md p-6 rounded-3xl border border-cyan-500/40 bg-[#0a0d1a] shadow-[0_0_80px_rgba(6,182,212,0.6)] max-h-[80vh] overflow-y-auto space-y-5 z-[10000]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={14} /> Perfil de {selectedCandidate.name}
              </span>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Avatar & Header del Candidato */}
            <div className="text-center">
              <div className="relative inline-block mb-3">
                <img
                  src={selectedCandidate.image}
                  alt={selectedCandidate.name}
                  className="w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] object-cover bg-black mx-auto"
                />
                <ZodiacBadge sign={selectedCandidate.sign} size="md" className="absolute -bottom-1 -right-1 border-2 border-black shadow-md" />
              </div>

              <h3 className="text-2xl font-bold mystic-font text-white">{selectedCandidate.name}</h3>
              <p className="text-xs text-cyan-400 font-semibold mt-1">
                {selectedCandidate.sign} • Elemento {selectedCandidate.element}
              </p>

              <div className="flex justify-center items-center gap-2 mt-3 text-xs">
                {selectedCandidate.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-gray-300">
                    <MapPin size={12} className="text-cyan-400" /> {selectedCandidate.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
                  {selectedCandidate.affinity} Afinidad
                </span>
              </div>
            </div>

            {/* Bio del candidato */}
            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sobre Mí</span>
              <p className="text-xs text-gray-200 leading-relaxed italic font-light">
                "{selectedCandidate.bio || 'Sin descripción por el momento.'}"
              </p>
            </div>

            {/* Galería de Fotos (si existe) */}
            {selectedCandidate.photos && selectedCandidate.photos.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Fotos de Presentación</span>
                <div className="grid grid-cols-3 gap-2">
                  {selectedCandidate.photos.map((photo, i) => (
                    <img key={i} src={photo} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border border-white/10 bg-black" />
                  ))}
                </div>
              </div>
            )}

            {/* Datos astrales adicionales */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Star size={16} className="text-amber-400" />
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Camino de Vida</span>
                  <span className="text-white font-bold">{selectedCandidate.path}</span>
                </div>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Arquetipo</span>
                  <span className="text-white font-bold text-[11px] truncate block max-w-[100px]">
                    {selectedCandidate.archetype || 'El Ermitaño'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Enviar Mensaje */}
            <button
              onClick={() => handleSync(selectedCandidate)}
              disabled={syncingId === selectedCandidate.id}
              className="btn-mystic w-full py-3.5 rounded-xl text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle size={16} />
              {syncingId === selectedCandidate.id ? 'CONECTANDO...' : 'ENVIAR MENSAJE DIRECTO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
