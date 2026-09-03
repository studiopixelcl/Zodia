"use client";
import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, User, ArrowRight, Globe, Moon, Shield, MessageCircle, 
  Flame, CheckCircle, AlertCircle, X, Compass, ChevronRight,
  Eye, EyeOff, Lock, Key, Mail, RefreshCw, Heart, Calendar, Zap,
  Search, ShieldCheck, Stars
} from 'lucide-react';
import { calculateAstralProfile, getZodiacSymbol } from '../lib/astrology';
import { ZodiacBadge } from '../components/astral/ZodiacBadge';
import ZodiaLogo from '../components/ui/ZodiaLogo';
import { apiFetch } from '../lib/api';

// Ejemplos interactivos para la tarjeta de previsualización en el Hero
const HERO_MATCH_EXAMPLES = [
  {
    pair: 'Leo ♌ + Sagitario ♐',
    score: 92,
    element: 'Fuego + Fuego',
    elementDesc: 'Química natural, vitalidad y proyectos compartidos',
    tag: 'Alta afinidad pasional e intelectual',
    icebreaker: 'Ambos comparten pasión por la aventura espontánea y el arte.',
    color: 'from-amber-500/20 to-rose-500/20',
    border: 'border-amber-500/30',
    badgeA: 'Leo',
    badgeB: 'Sagitario'
  },
  {
    pair: 'Tauro ♉ + Virgo ♍',
    score: 95,
    element: 'Tierra + Tierra',
    elementDesc: 'Estabilidad, complicidad y valores vitales alineados',
    tag: 'Conexión duradera y leal',
    icebreaker: 'Disfrutan de la gastronomía, la naturaleza y conversaciones reflexivas.',
    color: 'from-emerald-500/20 to-cyan-500/20',
    border: 'border-emerald-500/30',
    badgeA: 'Tauro',
    badgeB: 'Virgo'
  },
  {
    pair: 'Cáncer ♋ + Piscis ♓',
    score: 96,
    element: 'Agua + Agua',
    elementDesc: 'Profunda empatía emocional e intuición compartida',
    tag: 'Sintonía afectiva inmediata',
    icebreaker: 'Conexión basada en sensibilidad, música y proyectos de vida auténticos.',
    color: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/30',
    badgeA: 'Cancer',
    badgeB: 'Piscis'
  }
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados del modal y autenticación
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register' | 'recover' | 'onboarding'
  
  // Formulario de login y registro
  const [formData, setFormData] = useState({ name: '', email: '', password: '', dob: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userNotFoundAlert, setUserNotFoundAlert] = useState(false);

  // Formulario de recuperación de contraseña
  const [recoverStep, setRecoverStep] = useState(1); // 1 = solicitar PIN, 2 = verificar y nueva clave
  const [recoverData, setRecoverData] = useState({ email: '', code: '', newPassword: '' });
  const [recoverSuccessMsg, setRecoverSuccessMsg] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);

  // Selector interactivo de ejemplo en el Hero
  const [heroExampleIndex, setHeroExampleIndex] = useState(0);
  const activeHeroExample = HERO_MATCH_EXAMPLES[heroExampleIndex];

  // Calculadora libre de previsualización en la landing
  const [previewDob, setPreviewDob] = useState('1998-07-15');
  const previewProfile = previewDob ? calculateAstralProfile(previewDob) : null;
  const previewSymbol = previewProfile?.sign ? getZodiacSymbol(previewProfile.sign) : '✦';

  // Perfil calculado para el registro
  const currentProfile = formData.dob ? calculateAstralProfile(formData.dob) : null;
  const badgeSymbol = currentProfile?.sign ? getZodiacSymbol(currentProfile.sign) : '✦';

  // Redirección si el usuario ya está autenticado (de forma resiliente con localStorage)
  useEffect(() => {
    let activeUser = session?.user;
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zodia_session');
        if (stored) activeUser = JSON.parse(stored);
      } catch {}
    }

    if (activeUser && status !== 'loading') {
      const isPendingOnboarding = typeof window !== 'undefined' && localStorage.getItem('zodia_onboarding') === 'pending';
      if (isPendingOnboarding) {
        window.location.href = '/zodia/welcome';
        return;
      }
      window.location.href = '/zodia/dashboard';
      return;
    }

    // Caso usuario Google OAuth sin perfil
    if (status === 'authenticated' && session?.user && !activeUser) {
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
    }
  }, [status, session]);

  // Abrir modal configurado
  const openModal = (tab = 'register', defaultDob = '') => {
    setAuthTab(tab);
    setErrorMsg(null);
    setUserNotFoundAlert(false);
    setRecoverSuccessMsg(null);
    if (defaultDob) setFormData(prev => ({ ...prev, dob: defaultDob }));
    setIsAuthModalOpen(true);
  };

  /**
   * Manejar Iniciar Sesión (con Contraseña Segura)
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    const identifier = (formData.email || formData.name || '').trim();
    const password = (formData.password || '').trim();

    if (!identifier) {
      setErrorMsg('Ingresa tu correo o nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setUserNotFoundAlert(false);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', identifier, password })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (res.status === 404) {
          setUserNotFoundAlert(true);
        } else {
          setErrorMsg(data.error || 'Credenciales inválidas. Por favor verifica tus datos.');
        }
        return;
      }

      if (data.user) {
        try {
          localStorage.setItem('zodia_session', JSON.stringify(data.user));
          localStorage.removeItem('zodia_onboarding');
          document.cookie = `next-auth.session-token=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        } catch {}
      }

      window.location.href = '/zodia/dashboard';
    } catch {
      setErrorMsg('Fallo de conexión. Por favor verifica tu red e inténtalo nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Manejar Registro por Primera Vez (Creación de Cuenta + Contraseña + Perfil)
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    const inputName = (formData.name || '').trim();
    const inputEmail = (formData.email || '').trim();
    const inputPassword = (formData.password || '').trim();
    const inputDob = formData.dob;

    if (!inputName) {
      setErrorMsg('Por favor ingresa tu nombre o alias.');
      return;
    }
    if (!inputEmail) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!inputPassword || inputPassword.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (!inputDob) {
      setErrorMsg('Por favor selecciona tu fecha de nacimiento.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          name: inputName,
          email: inputEmail,
          password: inputPassword,
          dob: inputDob
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'No se pudo crear tu cuenta. Intenta con otro correo.');
        return;
      }

      if (data.user) {
        try {
          localStorage.setItem('zodia_session', JSON.stringify(data.user));
          localStorage.setItem('zodia_onboarding', 'pending');
          document.cookie = `next-auth.session-token=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        } catch {}
      }

      // Redirigir a la bienvenida para completar perfil
      window.location.href = '/zodia/welcome';
    } catch {
      setErrorMsg('Fallo de conexión al crear tu cuenta. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Recuperación de contraseña: Paso 1 (Solicitar PIN)
   */
  const handleRecoverRequest = async (e) => {
    e.preventDefault();
    const email = (recoverData.email || '').trim();
    if (!email) {
      setErrorMsg('Ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setRecoverSuccessMsg(null);

    try {
      const res = await apiFetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'No se pudo generar el código.');
        return;
      }

      setRecoverSuccessMsg('Código generado con éxito. Usa el PIN en pantalla para continuar.');
      if (data.code) {
        setGeneratedPin(data.code);
        setRecoverData(prev => ({ ...prev, code: data.code }));
      }
      setRecoverStep(2);
    } catch {
      setErrorMsg('Error de conexión al solicitar el código de recuperación.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Recuperación de contraseña: Paso 2 (Verificar PIN y cambiar clave)
   */
  const handleRecoverReset = async (e) => {
    e.preventDefault();
    const email = (recoverData.email || '').trim();
    const code = (recoverData.code || '').trim();
    const newPassword = (recoverData.newPassword || '').trim();

    if (!code || code.length !== 6) {
      setErrorMsg('Ingresa el código PIN de 6 dígitos.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_and_reset', email, code, newPassword })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Código incorrecto o expirado.');
        return;
      }

      setRecoverSuccessMsg('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.');
      setFormData(prev => ({ ...prev, email: email, name: email, password: newPassword }));
      setRecoverStep(1);
      setGeneratedPin(null);
      setTimeout(() => {
        setAuthTab('login');
        setRecoverSuccessMsg(null);
      }, 1600);
    } catch {
      setErrorMsg('Error de conexión al restablecer contraseña.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Acceso Inmediato de Demostración (1 Clic)
   */
  const handleGuestAccess = async () => {
    setIsSaving(true);
    const guestUser = {
      id: 'tuner_invitado',
      name: 'Usuario Demo',
      email: 'demo@zodia.cl',
      image: 'https://ui-avatars.com/api/?name=Demo&background=0284c7&color=fff&bold=true',
      dob: '1998-07-15'
    };
    try {
      localStorage.setItem('zodia_session', JSON.stringify(guestUser));
      document.cookie = `next-auth.session-token=${encodeURIComponent(JSON.stringify(guestUser))}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    } catch {}
    window.location.href = '/zodia/dashboard';
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
        setErrorMsg('No se pudo guardar la fecha de nacimiento.');
      }
    } catch {
      setErrorMsg('Error de conexión al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07080D] text-slate-100 overflow-x-hidden selection:bg-sky-500/30 selection:text-white">
      
      {/* ── ILUMINACIÓN AMBIENTAL ELEGANTE Y SUTIL ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-sky-500/[0.06] rounded-full blur-[160px]" />
        <div className="absolute top-[35%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[170px]" />
      </div>

      {/* ── NAVBAR PRINCIPAL MINIMALISTA ── */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#07080D]/70 border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <ZodiaLogo size="sm" />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs tracking-wider text-slate-400 font-medium">
            <a href="#como-funciona" className="hover:text-sky-300 transition-colors">Cómo funciona</a>
            <a href="#calculadora" className="hover:text-sky-300 transition-colors">Calculadora</a>
            <a href="#compatibilidad" className="hover:text-sky-300 transition-colors">Afinidad</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal('login')}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all font-medium"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => openModal('register')}
              className="btn-primary-zodia px-4 py-2 rounded-xl text-xs tracking-wide"
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ELEGANTE Y DE ALTO IMPACTO ── */}
      <section className="relative z-10 pt-36 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.05] text-sky-300 text-[11px] font-semibold tracking-wider uppercase mb-8">
            <Sparkles size={13} className="text-sky-400" />
            <span>Astrología & Compatibilidad Consciente</span>
          </div>

          {/* Título principal */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-6">
            Conexiones auténticas basadas en quién eres realmente.
          </h1>

          {/* Subtítulo humano y accesible */}
          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed mb-10 font-normal max-w-2xl mx-auto">
            Zodia integra astrología contemporánea, dinámica de elementos y numerología para ayudarte a descubrir tu perfil vincular y conectar con personas afines, sin la superficialidad del swipe tradicional.
          </p>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <button
              onClick={() => openModal('register')}
              className="btn-primary-zodia w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 group shadow-lg shadow-sky-950/40"
            >
              Crear mi cuenta gratis
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleGuestAccess}
              className="btn-secondary-zodia w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Zap size={16} className="text-amber-400" />
              Explorar demo (1-clic)
            </button>
            <a
              href="#calculadora"
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors text-sm flex items-center justify-center gap-2 font-medium"
            >
              <Compass size={16} />
              Calcular perfil
            </a>
          </div>
        </div>

        {/* ── WIDGET INTERACTIVO DEL PRODUCTO (HERO SHOWCASE) ── */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className={`glass-panel p-6 sm:p-8 rounded-3xl border ${activeHeroExample.border} transition-all duration-500 bg-gradient-to-br ${activeHeroExample.color}`}>
            
            {/* Cabecera del widget */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
                  Radar de Afinidad Zodia
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{activeHeroExample.pair}</span>
                </h3>
              </div>

              {/* Botones selectores de ejemplos */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08] self-start sm:self-center">
                {HERO_MATCH_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroExampleIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      heroExampleIndex === idx 
                        ? 'bg-sky-500 text-black font-bold shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Caso {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuerpo del widget: Medidor y química */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-6 items-center">
              {/* Indicador de afinidad circular */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/30 border border-white/[0.06]">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#widgetGrad)"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - activeHeroExample.score / 100)}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="widgetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {activeHeroExample.score}%
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                      Afinidad
                    </span>
                  </div>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-sky-300 text-center">
                  {activeHeroExample.tag}
                </span>
              </div>

              {/* Detalle de compatibilidad y disparador de conversación */}
              <div className="sm:col-span-8 flex flex-col justify-center space-y-4">
                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-white">{activeHeroExample.element}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {activeHeroExample.elementDesc}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/25 border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageCircle size={15} className="text-sky-400" />
                    <span className="text-xs font-bold text-white">Disparador de Conversación</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{activeHeroExample.icebreaker}"
                  </p>
                </div>
              </div>
            </div>

            {/* Pie de la tarjeta */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Calculado según posición solar y dinámica de elementos.</span>
              <button
                onClick={() => openModal('register')}
                className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Conocer mi perfil <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de métricas y garantías */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-white/[0.07] max-w-4xl mx-auto">
          <div className="p-3 text-center sm:text-left">
            <p className="text-2xl font-bold text-white tracking-tight">94%</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Sinergia calculada</p>
          </div>
          <div className="p-3 text-center sm:text-left">
            <p className="text-2xl font-bold text-sky-400 tracking-tight">12</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Arquetipos vinculares</p>
          </div>
          <div className="p-3 text-center sm:text-left">
            <p className="text-2xl font-bold text-indigo-400 tracking-tight">1-a-1</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Conversaciones privadas</p>
          </div>
          <div className="p-3 text-center sm:text-left">
            <p className="text-2xl font-bold text-amber-400 tracking-tight">100%</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Conexiones conscientes</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: CALCULADORA RÁPIDA DE PERFIL (INTERACTIVA) ── */}
      <section id="calculadora" className="relative z-10 py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block mb-2">
            Prueba Instantánea
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Descubre tu perfil en segundos
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-3 leading-relaxed">
            Ingresa tu fecha de nacimiento para conocer tu signo solar, número de vida y arquetipo de personalidad sin necesidad de registrarte.
          </p>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/[0.08]">
          <div className="max-w-xs mx-auto mb-10">
            <label className="block text-xs font-medium text-slate-400 text-center mb-2.5">
              Fecha de Nacimiento
            </label>
            <div className="relative">
              <input
                type="date"
                value={previewDob}
                onChange={(e) => setPreviewDob(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-base focus:border-sky-400 outline-none transition color-scheme-dark"
              />
            </div>
          </div>

          {previewProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              {/* Tarjeta 1: Signo Solar */}
              <div className="card-clean p-6 text-center flex flex-col items-center justify-center">
                <ZodiacBadge sign={previewProfile.sign} size="lg" className="mb-3" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Signo Solar</span>
                <h4 className="text-xl font-bold text-white mt-0.5">{previewProfile.sign}</h4>
                <span className="text-xs font-medium text-sky-400 mt-1">
                  Elemento {previewProfile.element}
                </span>
              </div>

              {/* Tarjeta 2: Camino de Vida */}
              <div className="card-clean p-6 text-center flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-amber-400 block mb-1">
                  {previewProfile.lifePath}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Camino de Vida</span>
                <h4 className="text-lg font-bold text-white mt-1">{previewProfile.archetype}</h4>
                <span className="text-xs text-slate-400 mt-1">Arquetipo de propósito</span>
              </div>

              {/* Tarjeta 3: Dinámica Vincular */}
              <div className="card-clean p-6 text-left flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider block mb-1">
                    Fortaleza Vincular
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    "{previewProfile.luz}"
                  </p>
                </div>
                <div className="pt-3 border-t border-white/[0.06] mt-3">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block mb-1">
                    Aspecto a Observar
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "{previewProfile.sombra}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-10">
            <button
              onClick={() => openModal('register', previewDob)}
              className="btn-primary-zodia px-8 py-3.5 rounded-xl text-xs tracking-wider uppercase font-bold shadow-lg inline-flex items-center gap-2"
            >
              <Sparkles size={15} />
              Guardar mi perfil y explorar conexiones
            </button>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: CÓMO FUNCIONA (LOS 3 PILARES CLAROS) ── */}
      <section id="como-funciona" className="relative z-10 py-24 px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block mb-2">
            Metodología
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Diseñado para relaciones auténticas
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-3">
            Tres pilares fundamentales que eliminan el ruido y te ayudan a conectar con sentido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pilar 1 */}
          <div className="glass-panel p-8 rounded-2xl hover:border-sky-400/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 text-sky-400 group-hover:scale-105 transition-transform">
              <User size={22} />
            </div>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Pilar 01</span>
            <h3 className="text-lg font-bold text-white mb-2.5">Autoconocimiento Profundo</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Obtén una síntesis clara de tu perfil astral: signo solar, dinámica elemental y arquetipo numerológico. Conocer tus tendencias te permite vincularte desde la consciencia.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="glass-panel p-8 rounded-2xl hover:border-indigo-400/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform">
              <Flame size={22} />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Pilar 02</span>
            <h3 className="text-lg font-bold text-white mb-2.5">Química de Elementos & Afinidad</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Nuestro algoritmo calcula el porcentaje de compatibilidad analizando la complementariedad de fuego, tierra, aire y agua, identificando puntos fuertes y áreas de entendimiento mutuo.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="glass-panel p-8 rounded-2xl hover:border-amber-400/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-105 transition-transform">
              <MessageCircle size={22} />
            </div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Pilar 03</span>
            <h3 className="text-lg font-bold text-white mb-2.5">Conversaciones con Contexto</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Olvídate de las aperturas frías. Cada sugerencia de conexión incluye temas de afinidad compartida, pasatiempos e ideas para iniciar conversaciones genuinas desde el primer mensaje.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: COMPARATIVA / POR QUÉ ZODIA ── */}
      <section id="compatibilidad" className="relative z-10 py-24 px-6 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block mb-2">
              Diferenciación
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Menos swipes vacíos, más conversaciones que importan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lado Tradicional */}
            <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.05] space-y-4">
              <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm pb-3 border-b border-white/[0.06]">
                <X size={18} className="text-rose-400" />
                <span>Aplicaciones de Citas Tradicionales</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Evaluación puramente estética basada en segundos de swipe.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Conversaciones que mueren en un saludo genérico sin temas comunes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Sensación de saturación y falta de química real en las citas.</span>
                </li>
              </ul>
            </div>

            {/* Lado Zodia */}
            <div className="p-6 rounded-2xl bg-sky-500/[0.04] border border-sky-500/20 space-y-4">
              <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm pb-3 border-b border-sky-500/20">
                <CheckCircle size={18} className="text-sky-400" />
                <span>La Experiencia Zodia</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>Perfiles basados en personalidad, valores y dinámica de elementos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>Porcentajes de afinidad transparentes con disparadores de charla reales.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>Comunidad de personas orientadas a vínculos conscientes y auténticos.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/[0.06] text-center">
            <button
              onClick={() => openModal('register')}
              className="btn-primary-zodia px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Comenzar Ahora Gratuitamente
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINIMALISTA ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ZodiaLogo size="xs" showText={false} />
            <span className="font-semibold text-slate-300 tracking-wider">ZODIA</span>
            <span>— Compatibilidad & Autoconocimiento © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#calculadora" className="hover:text-white transition-colors">Calculadora</a>
            <button onClick={() => openModal('login')} className="hover:text-white transition-colors">
              Iniciar Sesión
            </button>
            <button onClick={() => openModal('register')} className="hover:text-white transition-colors">
              Crear Cuenta
            </button>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE AUTENTICACIÓN (MINIMALISTA, PROFESIONAL Y ELEGANTE) ── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto grid place-items-center animate-fadeIn">
          <div className="relative my-auto w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0c0e18] shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Botón cerrar */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            {/* Cabecera del Modal */}
            <div className="text-center mb-6">
              <ZodiaLogo size="sm" showText={false} className="justify-center mb-3" />
              <h3 className="text-xl font-bold text-white tracking-tight">
                {authTab === 'login' && 'Bienvenido a Zodia'}
                {authTab === 'register' && 'Crea tu Cuenta'}
                {authTab === 'recover' && 'Recuperar Contraseña'}
                {authTab === 'onboarding' && 'Completa tu Perfil'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authTab === 'login' && 'Ingresa tus credenciales para acceder'}
                {authTab === 'register' && 'Descubre tu afinidad y conecta con personas afines'}
                {authTab === 'recover' && 'Restablece el acceso a tu cuenta mediante un código PIN'}
                {authTab === 'onboarding' && 'Indícanos tu fecha de nacimiento para calcular tu perfil'}
              </p>
            </div>

            {/* Pestañas: Iniciar Sesión vs Registrarse */}
            {authTab !== 'onboarding' && authTab !== 'recover' && (
              <div className="flex rounded-xl bg-black/40 p-1 border border-white/[0.07] mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setErrorMsg(null); setUserNotFoundAlert(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    authTab === 'login' ? 'bg-sky-500 text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setErrorMsg(null); setUserNotFoundAlert(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    authTab === 'register' ? 'bg-sky-500 text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Botón de regreso para Recuperación */}
            {authTab === 'recover' && (
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setErrorMsg(null); setRecoverSuccessMsg(null); }}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                >
                  ← Volver a Iniciar Sesión
                </button>
              </div>
            )}

            {/* Alertas de éxito */}
            {recoverSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-fadeIn">
                <CheckCircle size={15} className="shrink-0 text-emerald-400" />
                <span>{recoverSuccessMsg}</span>
              </div>
            )}

            {/* Alertas de error */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-2 animate-fadeIn">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Advertencia si el usuario no existe en Iniciar Sesión */}
            {userNotFoundAlert && authTab === 'login' && (
              <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold">Usuario no registrado</p>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      No encontramos una cuenta asociada a este correo o identificador.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setUserNotFoundAlert(false); }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                >
                  Registrarme Ahora
                </button>
              </div>
            )}

            {/* ── 1. FORMULARIO: INICIAR SESIÓN ── */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo electrónico o usuario
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ejemplo@correo.com o tu_usuario"
                    value={formData.email || formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, email: e.target.value })}
                    className="input-glass w-full px-4 py-3 text-sm focus:border-sky-400 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => { setAuthTab('recover'); setRecoverStep(1); setErrorMsg(null); setRecoverSuccessMsg(null); setRecoverData(prev => ({ ...prev, email: formData.email || formData.name })); }}
                      className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-glass w-full px-4 py-3 pr-11 text-sm focus:border-sky-400 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-zodia w-full py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? "Ingresando..." : "Ingresar a Zodia"}
                  {!isSaving && <ArrowRight size={15} />}
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
                  <span className="relative bg-[#0c0e18] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">o</span>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 text-slate-200 py-2.5 rounded-xl text-xs font-medium hover:bg-white/[0.07] transition-all"
                >
                  <Zap size={14} className="text-amber-400" />
                  Acceso Demo Rápido (1 Clic)
                </button>

                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Continuar con Google
                </button>
              </form>
            )}

            {/* ── 2. FORMULARIO: REGISTRARSE ── */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tu nombre o alias
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Maverick"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-glass w-full px-4 py-2.5 text-sm focus:border-sky-400 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-glass w-full px-4 py-2.5 text-sm focus:border-sky-400 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Crea una contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-glass w-full px-4 py-2.5 pr-11 text-sm focus:border-sky-400 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="input-glass w-full px-4 py-2.5 text-sm focus:border-sky-400 color-scheme-dark"
                  />
                </div>

                {/* Previsualización discreta del signo al ingresar fecha */}
                {currentProfile && (
                  <div className="p-3 rounded-xl bg-sky-500/[0.08] border border-sky-500/20 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="text-base text-sky-400">{badgeSymbol}</span>
                      <span className="text-white font-semibold">{currentProfile.sign}</span>
                    </div>
                    <span className="text-amber-400 font-medium">{currentProfile.archetype}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-zodia w-full py-3 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? "Creando cuenta..." : "Crear mi cuenta"}
                  {!isSaving && <ArrowRight size={15} />}
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
                  <span className="relative bg-[#0c0e18] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">o</span>
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 text-slate-200 py-2.5 rounded-xl text-xs font-medium hover:bg-white/[0.07] transition-all"
                >
                  <Zap size={14} className="text-amber-400" />
                  Entrar con Perfil Demo (1 Clic)
                </button>

                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Registrarse con Google
                </button>
              </form>
            )}

            {/* ── 3. FORMULARIO: RECUPERAR CONTRASEÑA ── */}
            {authTab === 'recover' && (
              <div className="space-y-4">
                {recoverStep === 1 ? (
                  <form onSubmit={handleRecoverRequest} className="space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      Ingresa el correo electrónico asociado a tu cuenta. Te generaremos un código PIN de 6 dígitos con 15 minutos de vigencia para restablecer tu contraseña.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="ejemplo@correo.com"
                          value={recoverData.email}
                          onChange={(e) => setRecoverData({ ...recoverData, email: e.target.value })}
                          className="input-glass w-full px-4 py-3 text-sm focus:border-sky-400 placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary-zodia w-full py-3 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                    >
                      {isSaving ? "Generando..." : "Solicitar Código PIN"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRecoverReset} className="space-y-4">
                    {generatedPin && (
                      <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center animate-fadeIn">
                        <span className="text-[10px] text-sky-300 uppercase tracking-widest font-semibold block mb-1">
                          Código PIN Generado
                        </span>
                        <span className="text-2xl font-mono font-bold tracking-widest text-white">
                          {generatedPin}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Código PIN de 6 dígitos
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Ej: 123456"
                        value={recoverData.code}
                        onChange={(e) => setRecoverData({ ...recoverData, code: e.target.value })}
                        className="input-glass w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showRecoverPassword ? 'text' : 'password'}
                          required
                          placeholder="Mínimo 4 caracteres"
                          value={recoverData.newPassword}
                          onChange={(e) => setRecoverData({ ...recoverData, newPassword: e.target.value })}
                          className="input-glass w-full px-4 py-2.5 pr-11 text-sm focus:border-sky-400 placeholder:text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRecoverPassword(!showRecoverPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          tabIndex={-1}
                        >
                          {showRecoverPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary-zodia w-full py-3 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                    >
                      {isSaving ? "Actualizando..." : "Guardar Nueva Contraseña"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── 4. FORMULARIO: ONBOARDING TRAS GOOGLE ── */}
            {authTab === 'onboarding' && (
              <form onSubmit={handleOnboardingGoogle} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  ¡Casi listo! Para calcular tu perfil y sugerencias de afinidad, selecciona tu fecha de nacimiento:
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="input-glass w-full px-4 py-3 text-sm focus:border-sky-400 color-scheme-dark"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-zodia w-full py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                >
                  {isSaving ? "Guardando..." : "Completar mi Perfil"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}