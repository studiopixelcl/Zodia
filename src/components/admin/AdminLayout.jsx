'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  MessageSquare, 
  Radio, 
  LayoutDashboard, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verificar sesión administrativa
  useEffect(() => {
    // Si estamos en la página de login, no verificar
    if (pathname.includes('/admin/login')) {
      setIsVerifying(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await apiFetch('/api/admin/auth');
        const data = await res.json();
        if (!data.authenticated) {
          router.replace('/admin/login');
        } else {
          setIsVerifying(false);
        }
      } catch {
        router.replace('/admin/login');
      }
    };
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    router.replace('/admin/login');
  };

  // Si estamos en la pantalla de login, no renderizar la barra lateral
  if (pathname.includes('/admin/login')) {
    return <>{children}</>;
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-cyan-400">
        <Sparkles className="w-10 h-10 animate-spin mb-3 text-cyan-400" />
        <p className="text-sm tracking-widest uppercase font-mono">Verificando Credenciales Maestras...</p>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Sintonizadores (Cuentas)', href: '/admin/users', icon: Users },
    { name: 'Moderación de Chats', href: '/admin/conversations', icon: MessageSquare },
    { name: 'Mensajería y Difusión', href: '/admin/messaging', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-[#060812] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500/30">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0c1024] border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-wider text-sm mystic-font text-white">ZODIA ADMIN</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0a0e22] border-r border-cyan-500/15 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a0e22] rounded-[10px] flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-widest text-base text-white">ZODIA</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">MASTER</span>
              </div>
              <p className="text-[11px] text-slate-400">Control Cósmico</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ver App Zodia
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión Maestra
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar for desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0a0e22]/50 border-b border-cyan-500/10 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-cyan-400 font-mono">Consola de Administración</span>
            <span>/</span>
            <span className="capitalize text-slate-200">{pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Red Astral Operativa</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-500/20">
              A
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
