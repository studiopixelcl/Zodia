"use client";
import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, User, ArrowRight, Globe, Moon, Shield, MessageCircle, Flame, CheckCircle, AlertCircle, X, Compass, ChevronRight } from 'lucide-react';
import { calculateAstralProfile, getZodiacSymbol } from '../lib/astrology';
import { ZodiacBadge } from '../components/astral/ZodiacBadge';
import { apiFetch } from '../lib/api';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados del modal y autenticación
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  
  // Formulario
  const [formData, setFormData] = useState({ name: '', dob: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userNotFoundAlert, setUserNotFoundAlert] = useState(false);

  // Calculadora libre de previsualización en la landing
  const [previewDob, setPreviewDob] = useState('1998-07-15');
  const previewProfile = previewDob ? calculateAstralProfile(previewDob) : null;
  const previewSymbol = previewProfile?.sign ? getZodiacSymbol(previewProfile.sign) : '✦';

  // Perfil calculado para el registro
  const currentProfile = formData.dob ? calculateAstralProfile(formData.dob) : null;
  const badgeSymbol = currentProfile?.sign ? getZodiacSymbol(currentProfile.sign) : '✦';

  // Redirección si el usuario ya está autenticado
  useEffect(() => {
    if (status !== 'authenticated') return;

    const isManualUser = session?.user?.email?.endsWith('@zodia.eter');
    if (isManualUser) {
      window.location.href = '/zodia/dashboard';
      return;
    }

    // Usuario Google: verificar si ya tiene perfil astral guardado
    const checkProfile = async () => {
      try {
        const res = await apiFetch('/api/profile');
        const data = await res.json();
        if (data.exists) {
          window.location.href = '/zodia/dashboard';
        } else {
          setAuthTab('onboarding');
          setIsAuthModalOpen(true);
        }
      } catch {
        setAuthTab('onboarding');
        setIsAuthModalOpen(true);
      }
    };
    checkProfile();
  }, [status, session]);

  // Abrir modal configurado
  const openModal = (tab = 'register', defaultDob = '') => {
    setAuthTab(tab);
    setErrorMsg(null);
    setUserNotFoundAlert(false);
    if (defaultDob) setFormData(prev => ({ ...prev, dob: defaultDob }));
    setIsAuthModalOpen(true);
  };

  /**
   * Manejar Iniciar Sesión (Validación de Usuario Existente)
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    setErrorMsg(null);
    setUserNotFoundAlert(false);

    const inputName = formData.name.trim();

    try {
      // 1. Consultar en D1 si el usuario existe
      const checkRes = await apiFetch(`/api/check-user?name=${encodeURIComponent(inputName)}`);
      const checkData = await checkRes.json();

      if (!checkData.exists && !checkData.mock) {
        setUserNotFoundAlert(true);
        setIsSaving(false);
        return;
      }

      // 2. Establecer sesión directamente mediante POST a /api/auth/login
      const dobToUse = checkData.user?.birth_date || formData.dob || '1998-07-15';
      
      let authRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputName, dob: dobToUse })
      });

      if (!authRes.ok) {
        authRes = await apiFetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: inputName, dob: dobToUse })
        });
      }

      if (authRes.ok) {
        window.location.href = '/zodia/dashboard';
      } else {
        const errJson = await authRes.json().catch(() => null);
        setErrorMsg(errJson?.error || 'Error al conectar la sintonía. Intenta de nuevo.');
      }
    } catch {
      setErrorMsg('Fallo de conexión mística con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Manejar Registro por Primera Vez (Creación de Cuenta + Perfil)
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dob) {
      setErrorMsg('Por favor completa tu nombre y fecha de nacimiento.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const inputName = formData.name.trim();

    try {
      // 1. Establecer sesión y crear perfil en el endpoint directo
      let authRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputName, dob: formData.dob })
      });

      if (!authRes.ok) {
        authRes = await apiFetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: inputName, dob: formData.dob })
        });
      }

      if (authRes.ok) {
        // 2. Guardar perfil astral en D1 (asegurar persistencia)
        try {
          await apiFetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: inputName, dob: formData.dob, isManual: true }),
          });
        } catch (profileErr) {
          console.warn('[handleRegister] Warning al guardar perfil:', profileErr);
        }

        window.location.href = '/zodia/welcome';
      } else {
        const errData = await authRes.json().catch(() => null);
        setErrorMsg(errData?.error || 'No se pudo registrar tu perfil astral.');
      }
    } catch (err) {
      console.error('[handleRegister] Exception:', err);
      setErrorMsg('Fallo de conexión al manifestar tu perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Acceso Inmediato de Prueba / Invitado (1 Clic)
   */
  const handleGuestAccess = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Sintonizador Cósmico', dob: '1998-07-15' })
      });
      window.location.href = '/zodia/dashboard';
    } catch {
      window.location.href = '/zodia/dashboard';
    }
  };

  /**
   * Manejar Onboarding tras login de Google
   */
  const handleOnboardingGoogle = async (e) => {
    e.preventDefault();
    if (!formData.dob) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: formData.dob }),
      });
      if (res.ok) {
        window.location.href = '/zodia/dashboard';
      } else {
        setErrorMsg('No se pudo guardar tu esencia astral.');
      }
    } catch {
      setErrorMsg('Error de conexión con el éter.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* ── CAPAS DE FONDO Y AURA ASTRAL ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-amber-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
      </div>

      {/* ── NAVBAR NAVEGABLE ── */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="text-cyan-400 w-5 h-5 animate-pulse" />
            </div>
            <span className="text-2xl mystic-font text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 tracking-[0.25em] font-bold">
              ZODIA
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-gray-400 font-semibold">
            <a href="#pilares" className="hover:text-cyan-400 transition">Pilares</a>
            <a href="#calculadora" className="hover:text-cyan-400 transition">Calculadora</a>
            <a href="#oraculo-preview" className="hover:text-cyan-400 transition">Oráculo</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal('login')}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-xs text-gray-200 hover:text-white hover:border-cyan-500/50 transition font-medium"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => openModal('register')}
              className="btn-mystic px-5 py-2.5 rounded-xl text-xs text-white font-bold tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION PRINCIPAL ── */}
      <section className="relative z-10 pt-36 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <Sparkles size={14} /> Perfil Astral & Compatibilidad
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold mystic-font leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400 mb-6 tracking-wide drop-shadow-sm">
          Descubre tu Perfil Astral y Conecta con Personas Afines
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          ZODIA integra astrología clásica, numerología sagrada y lecturas de tarot para revelar tu vibración única en el universo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => openModal('register')}
            className="btn-mystic w-full sm:w-auto px-7 py-4 rounded-2xl text-white font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(6,182,212,0.4)] group"
          >
            COMENZAR GRATIS
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleGuestAccess}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-cyan-600/30 border border-cyan-400/50 text-cyan-300 font-bold text-sm hover:scale-105 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Sparkles size={17} className="text-amber-400 animate-spin" />
            Explorar Citas (Demo 1-Clic)
          </button>
          <a
            href="#calculadora"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 hover:border-cyan-500/30 transition flex items-center justify-center gap-2"
          >
            <Compass size={18} className="text-cyan-400" />
            Calculadora
          </a>
        </div>

        {/* Métrica / Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-10 border-t border-white/10 max-w-3xl mx-auto text-left">
          <div className="p-3">
            <p className="text-2xl font-mystic text-cyan-400">100%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Serverless D1</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-mystic text-purple-400">22</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Arcanos Mayores</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-mystic text-amber-400">Sinódico</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Fases Lunares</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-mystic text-cyan-300">Radar %</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Afinidad Astral</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: CALCULADORA ASTRAL EN VIVO (PREVIEW SIN REGISTRO) ── */}
      <section id="calculadora" className="relative z-10 py-20 px-6 max-w-4xl mx-auto">
        <div className="glass-panel p-8 sm:p-12 relative overflow-hidden border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

          <div className="text-center mb-8">
            <h2 className="mystic-font text-3xl text-white mb-2">Previsualiza tu Espejo Astral</h2>
            <p className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">
              Selecciona tu fecha de origen terrenal sin costo ni registro previo
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center tracking-widest">
              Tu Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={previewDob}
              onChange={(e) => setPreviewDob(e.target.value)}
              className="w-full bg-black/70 border border-cyan-500/30 rounded-xl px-5 py-4 text-white text-center text-lg focus:border-cyan-400 outline-none transition shadow-inner color-scheme-dark"
            />
          </div>

          {previewProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-black/50 p-5 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                <ZodiacBadge sign={previewProfile.sign} size="lg" className="mb-2" />
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Signo Solar</p>
                <h4 className="mystic-font text-xl text-white mt-1">{previewProfile.sign}</h4>
                <span className="text-[10px] font-bold text-amber-400 uppercase mt-1 inline-block">
                  Elemento {previewProfile.element}
                </span>
              </div>

              <div className="bg-black/50 p-5 rounded-2xl border border-white/5 text-center">
                <span className="mystic-font text-4xl block mb-2 text-amber-400">{previewProfile.lifePath}</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Camino de Vida</p>
                <h4 className="mystic-font text-xl text-white mt-1">{previewProfile.archetype}</h4>
              </div>

              <div className="bg-black/50 p-5 rounded-2xl border border-white/5 text-left flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest mb-1">Cualidad de Luz</p>
                  <p className="text-xs text-gray-300 italic">"{previewProfile.luz}"</p>
                </div>
                <div className="pt-2 border-t border-white/5 mt-3">
                  <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest mb-1">Cualidad de Sombra</p>
                  <p className="text-xs text-gray-400 italic">"{previewProfile.sombra}"</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => openModal('register', previewDob)}
              className="btn-mystic px-8 py-4 rounded-xl text-white font-bold text-xs tracking-widest shadow-lg inline-flex items-center gap-2"
            >
              <Sparkles size={16} /> GUARDAR MI ESPEJO Y CONECTAR EN EL ÉTER
            </button>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: LOS 4 PILARES DE ZODIA ── */}
      <section id="pilares" className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mystic-font text-3xl sm:text-4xl text-white mb-3">Los 4 Pilares de la Resonancia</h2>
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">
            Un sistema integral diseñado para revelar tu verdadera frecuencia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pilar 1 */}
          <div className="glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="text-cyan-400" size={24} />
            </div>
            <h3 className="mystic-font text-xl text-white mb-2">Espejo Astral</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Mapea tu signo solar, elemento primordial, número de camino de vida y arquetipo ancestral en una sola tarjeta de identidad mística.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Flame className="text-purple-400" size={24} />
            </div>
            <h3 className="mystic-font text-xl text-white mb-2">Radar del Éter</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Algoritmo exclusivo que evalúa la afinidad elemental y numerológica entre sintonizadores registrando porcentajes de resonancia real.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Moon className="text-amber-400" size={24} />
            </div>
            <h3 className="mystic-font text-xl text-white mb-2">Oráculo & Tarot 3D</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Transmisiones lunares rastreadas en vivo con iluminación Astronómica y tirada de Tarot Místico del Día con volteo interactivo 3D.
            </p>
          </div>

          {/* Pilar 4 */}
          <div className="glass-panel p-6 border border-white/10 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-cyan-400" size={24} />
            </div>
            <h3 className="mystic-font text-xl text-white mb-2">Vínculos Místicos</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Canal de mensajería privada *glassmorphism* para entablar comunicación directa con los buscadores más compatibles del éter.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER DE LA LANDING ── */}
      <footer className="relative z-10 border-t border-white/10 py-10 px-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={16} />
            <span className="mystic-font text-white tracking-widest">ZODIA</span>
            <span>— Resonancia Astral © {new Date().getFullYear()}</span>
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            Desarrollado en Cloudflare Serverless & Next.js 14
          </p>
        </div>
      </footer>

      {/* ── MODAL DE AUTENTICACIÓN Y CONTROL DE USUARIOS (PERFECTAMENTE CENTRADO) ── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto grid place-items-center animate-fadeIn">
          <div className="relative my-auto w-full max-w-md p-6 sm:p-8 rounded-3xl border border-cyan-500/40 bg-[#080a14]/95 shadow-[0_0_60px_rgba(6,182,212,0.4)] max-h-[85vh] overflow-y-auto">
            
            {/* Botón cerrar */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition p-1"
            >
              <X size={20} />
            </button>

            {/* Header del Modal */}
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="text-cyan-400 animate-pulse" size={20} />
              </div>
              <h3 className="mystic-font text-2xl text-white tracking-wider">PORTAL DE SINTONÍA</h3>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mt-1">Acceso a la Red Zodia</p>
            </div>

            {/* Pestañas: Iniciar Sesión vs Registrarse (salvo en Onboarding Google) */}
            {authTab !== 'onboarding' && (
              <div className="flex rounded-xl bg-black/60 p-1 border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setErrorMsg(null); setUserNotFoundAlert(false); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                    authTab === 'login' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setErrorMsg(null); setUserNotFoundAlert(false); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                    authTab === 'register' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Mensajes de error general */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Advertencia si el usuario NO existe en Iniciar Sesión */}
            {userNotFoundAlert && authTab === 'login' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold">Sintonizador No Encontrado</p>
                    <p className="text-gray-300 text-[11px] mt-1">
                      El alias <strong>"{formData.name}"</strong> no está manifestado en la base de datos de Zodia.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setUserNotFoundAlert(false); }}
                  className="w-full py-2.5 bg-amber-500 text-black font-bold rounded-xl text-[11px] uppercase tracking-wider hover:bg-amber-400 transition"
                >
                  Registrarme por Primera Vez
                </button>
              </div>
            )}

            {/* ── 1. FORMULARIO: INICIAR SESIÓN ── */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-2 pl-1 tracking-widest">
                    Nombre o Usuario
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: tu nombre o alias"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-cyan-400 outline-none transition shadow-inner placeholder:text-gray-600 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-mystic w-full py-3.5 rounded-xl text-white font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 h-12 shadow-lg"
                >
                  {isSaving ? "VERIFICANDO..." : "INICIAR SESIÓN"}
                  {!isSaving && <ArrowRight size={16} />}
                </button>

                <div className="relative py-3 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <span className="relative bg-black px-3 text-[10px] text-gray-500 uppercase tracking-widest">o accede con</span>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-400/40 text-cyan-300 py-3 rounded-xl font-bold text-xs hover:bg-cyan-500/25 transition shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-400" /> Entrar en 1 Clic (Modo Demo)
                </button>

                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition shadow-md"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Acceder con Google
                </button>
              </form>
            )}

            {/* ── 2. FORMULARIO: REGISTRARSE POR PRIMERA VEZ ── */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-2 pl-1 tracking-widest">
                    Tu Nombre o Alias
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre o alias"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-cyan-400 outline-none transition shadow-inner placeholder:text-gray-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-2 pl-1 tracking-widest">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-cyan-400 outline-none transition shadow-inner color-scheme-dark text-sm"
                  />
                </div>

                {/* Vista previa del perfil calculado en vivo */}
                {currentProfile && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center flex items-center justify-between text-xs animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-cyan-400">{badgeSymbol}</span>
                      <span className="text-white font-bold">{currentProfile.sign}</span>
                    </div>
                    <span className="text-amber-400 font-semibold">{currentProfile.archetype}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-mystic w-full py-3.5 rounded-xl text-white font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 h-12 shadow-lg"
                >
                  {isSaving ? "CREANDO PERFIL..." : "CREAR MI PERFIL"}
                  {!isSaving && <ArrowRight size={16} />}
                </button>

                <div className="relative py-3 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <span className="relative bg-black px-3 text-[10px] text-gray-500 uppercase tracking-widest">o accede con</span>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-400/40 text-cyan-300 py-3 rounded-xl font-bold text-xs hover:bg-cyan-500/25 transition shadow-sm"
                >
                  <Sparkles size={14} className="text-amber-400" /> Entrar en 1 Clic (Modo Demo)
                </button>

                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition shadow-md"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Registrarse con Google
                </button>
              </form>
            )}

            {/* ── 3. FORMULARIO: ONBOARDING TRAS GOOGLE AUTH ── */}
            {authTab === 'onboarding' && (
              <form onSubmit={handleOnboardingGoogle} className="space-y-4">
                <div className="text-center mb-3">
                  <div className="relative inline-block mb-2">
                    <img
                      src={session?.user?.image || 'https://ui-avatars.com/api/?name=Z'}
                      className="w-20 h-20 rounded-full border-2 border-cyan-500/40 p-1 shadow-lg bg-black object-cover mx-auto"
                      alt="Avatar"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs select-none">
                      {badgeSymbol}
                    </div>
                  </div>
                  <h4 className="text-base text-white font-medium">Hola, {session?.user?.name?.split(' ')[0]}</h4>
                  <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Confirma tu Fecha de Nacimiento</p>
                </div>

                <div>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:border-cyan-400 outline-none transition color-scheme-dark text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-mystic w-full py-3.5 rounded-xl text-white font-bold tracking-widest text-xs uppercase h-12"
                >
                  {isSaving ? "VINCULANDO..." : "REVELAR MI ESPEJO"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}