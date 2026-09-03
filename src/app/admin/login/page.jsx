'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/zodia/admin';
      } else {
        setErrorMsg(data.error || 'Credenciales de acceso no válidas.');
      }
    } catch {
      setErrorMsg('Fallo de conexión con el centro de control.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060812] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow ambient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0e22]/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white mystic-font">ZODIA ADMIN</h1>
          <p className="text-xs text-slate-400 mt-1">Portal de Gestión y Moderación Cósmica</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
              Usuario Administrador
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
              Contraseña Maestra
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Validando Acceso...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Acceso restringido únicamente a administradores autorizados de Studio Pixel.
          </p>
        </div>

      </div>
    </div>
  );
}
