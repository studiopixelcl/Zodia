"use client";
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, Check } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está corriendo en modo standalone (instalada)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Si ya lo descartó recientemente
    const dismissed = sessionStorage.getItem('zodia_pwa_dismissed');

    // Manejar evento de instalación en Android / Chromium
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Si es iOS y no descartado
    if (isIosDevice && !dismissed && !isStandalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      alert("Para instalar en tu navegador, usa el menú 'Instalar aplicación' o 'Añadir a pantalla de inicio'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('zodia_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Banner flotante superior discreto */}
      <div className="mx-4 mb-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-purple-950/80 to-black/90 border border-cyan-500/30 backdrop-blur-xl shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Instalar Zodia en tu móvil
              <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-semibold border border-cyan-500/30">
                {isIOS ? 'iOS' : 'Android'}
              </span>
            </h4>
            <p className="text-[11px] text-gray-300 font-light">
              Accede a tus citas y mensajes con pantalla completa y sin navegador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="btn-mystic px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 transition"
          >
            <Download size={14} /> Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-white transition rounded-full"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Modal explicativo para iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.4)]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone size={18} className="text-cyan-400" /> Instalar en iPhone / iPad
              </h3>
              <button onClick={() => setShowIOSModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Safari te permite instalar Zodia como una App nativa directamente en tu pantalla de inicio:
            </p>

            <ol className="space-y-3 text-xs text-gray-200">
              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 flex-shrink-0">
                  <Share size={16} />
                </div>
                <div>
                  <span className="font-bold text-white block">1. Toca "Compartir"</span>
                  En la barra inferior de Safari, pulsa el botón de compartir.
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 flex-shrink-0">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <span className="font-bold text-white block">2. "Añadir a pantalla de inicio"</span>
                  Desliza hacia abajo y selecciona esta opción con el icono (+).
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <span className="font-bold text-white block">3. Pulsa "Añadir"</span>
                  ¡Listo! Se abrirá a pantalla completa como una app real.
                </div>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="btn-mystic w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
