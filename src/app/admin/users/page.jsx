'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Eye, 
  RefreshCw, 
  X, 
  Sparkles,
  Heart,
  Calendar,
  Compass,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('Infracción de las directrices comunitarias de Zodia.');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/users?';
      if (searchTerm) url += `q=${encodeURIComponent(searchTerm)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await apiFetch(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleBanUser = async () => {
    if (!banModalUser) return;
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: banModalUser.id,
          action: 'ban',
          reason: banReason
        })
      });
      if (res.ok) {
        setBanModalUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error('Error banning user:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId) => {
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'unban'
        })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error('Error unbanning user:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`¿Estás completamente seguro de eliminar la cuenta de ${userName}? Esta acción borrará permanentemente sus chats y perfil astral.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedUser?.id === userId) setSelectedUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanupDemos = async () => {
    if (!confirm('¿Deseas purgar permanentemente todas las cuentas de prueba, bots simulados y registros de ejemplo? Esta acción dejará únicamente cuentas reales.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_demos' })
      });
      if (res.ok) {
        alert('Cuentas de prueba eliminadas correctamente.');
        fetchUsers();
      }
    } catch (e) {
      console.error('Error limpiando cuentas demo:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Directorio de Sintonizadores Reales</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de cuentas auténticas, cartas cósmicas, moderación y registros de la red Zodia.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleCleanupDemos}
            disabled={actionLoading || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-medium text-rose-300 border border-rose-500/30 transition-colors shadow-sm"
            title="Elimina cuentas demo o bots simulados de la base de datos"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purgar Cuentas Demo
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recargar Lista
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0a0e22] border border-cyan-500/15 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email o signo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400">Filtrar:</span>
          {['', 'active', 'banned'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${statusFilter === status 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}
              `}
            >
              {status === '' ? 'Todos' : status === 'active' ? 'Activos' : 'Baneados'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#0a0e22] border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Usuario / Alias</th>
                <th className="px-5 py-3.5">Signo & Elemento</th>
                <th className="px-5 py-3.5">Arquetipo</th>
                <th className="px-5 py-3.5">Fecha Nac.</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    Sincronizando registros con la base de datos...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No se encontraron sintonizadores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-cyan-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs shrink-0">
                            {user.name ? user.name[0].toUpperCase() : 'Z'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {(user.id?.includes('google') || (!user.id?.startsWith('tuner_') && user.id?.length > 15)) ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">Google</span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">Email</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{user.email || user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200">{user.sign || 'Sin calcular'}</div>
                      {user.element && (
                        <span className="text-[10px] text-slate-400">{user.element}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {user.archetype || 'Explorador'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {user.birth_date || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.status === 'banned' ? (
                        <div className="inline-flex flex-col">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 w-max">
                            Baneado
                          </span>
                          {user.ban_reason && (
                            <span className="text-[9px] text-rose-400/80 truncate max-w-[130px] mt-0.5" title={user.ban_reason}>
                              {user.ban_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          title="Ver Perfil Completo"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {user.status === 'banned' ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            title="Desbanear Usuario"
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors border border-emerald-500/30"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanModalUser(user)}
                            title="Banear Usuario"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          title="Eliminar Cuenta"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Detalles del Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c1228] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              {selectedUser.image ? (
                <img
                  src={selectedUser.image}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full bg-[#0a0e22] rounded-[14px] flex items-center justify-center text-xl font-bold text-white">
                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'Z'}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                <p className="text-xs text-cyan-400 font-mono">{selectedUser.email || selectedUser.id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${selectedUser.status === 'banned' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                    {selectedUser.status === 'banned' ? 'Baneado' : 'Activo'}
                  </span>
                  <span className="text-xs text-slate-400">{selectedUser.sign} ({selectedUser.element})</span>
                </div>
              </div>
            </div>

            {/* Profile Data */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Arquetipo Astral</span>
                  <div className="text-white font-medium mt-0.5">{selectedUser.archetype || 'El Sintonizador'}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Camino de Vida</span>
                  <div className="text-white font-medium mt-0.5">Número #{selectedUser.life_path_number || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Fecha de Nacimiento</span>
                  <div className="text-white font-medium mt-0.5">{selectedUser.birth_date || 'Sin registrar'}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Registro / Creación</span>
                  <div className="text-white font-medium mt-0.5">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('es-CL') : 'Reciente'}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Intención</span>
                  <div className="text-white font-medium mt-0.5">{selectedUser.intent || 'Citas y Pareja'}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Ubicación</span>
                  <div className="text-white font-medium mt-0.5">{selectedUser.location || 'Santiago, Chile'}</div>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 uppercase text-[10px] font-mono">Biografía Cósmica</span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{selectedUser.bio}</p>
                </div>
              )}

              {/* Intereses */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] font-mono mb-2 block">Intereses / Pasiones</span>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    let parsed = [];
                    try {
                      parsed = typeof selectedUser.interests === 'string' ? JSON.parse(selectedUser.interests) : (selectedUser.interests || []);
                    } catch {}
                    if (parsed.length === 0) return <span className="text-slate-500 italic">Sin intereses seleccionados</span>;
                    return parsed.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px]">
                        {tag}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Multimedia: Galería de Fotos y Video */}
              {(() => {
                let photosArr = [];
                try {
                  photosArr = typeof selectedUser.photos === 'string' ? JSON.parse(selectedUser.photos) : (selectedUser.photos || []);
                } catch {}
                if (!Array.isArray(photosArr)) photosArr = [];

                return (photosArr.length > 0 || selectedUser.video_url) ? (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 uppercase text-[10px] font-mono mb-2 block">
                      Archivos Multimedia ({photosArr.length} fotos {selectedUser.video_url ? '+ 1 mini-video' : ''})
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {photosArr.map((pUrl, idx) => (
                        <a key={idx} href={pUrl} target="_blank" rel="noreferrer" className="block relative group">
                          <img 
                            src={pUrl} 
                            alt={`Foto ${idx+1}`} 
                            className="w-16 h-16 object-cover rounded-lg border border-slate-700 hover:border-cyan-400 transition-colors shadow" 
                          />
                        </a>
                      ))}
                      {selectedUser.video_url && (
                        <div className="relative">
                          <video 
                            src={selectedUser.video_url} 
                            className="w-16 h-16 object-cover rounded-lg border border-indigo-500 shadow" 
                            controls 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {selectedUser.status === 'banned' && selectedUser.ban_reason && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <span className="uppercase text-[10px] font-mono block font-semibold mb-0.5">Motivo del Baneo</span>
                  <p>{selectedUser.ban_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Banear Usuario */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c1228] border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Suspender / Banear Sintonizador</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Estás a punto de suspender la cuenta de <strong className="text-white">{banModalUser.name}</strong> ({banModalUser.id}). El usuario no podrá iniciar sesión y verá el motivo de su suspensión al intentar entrar.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                Motivo de la Sanción
              </label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="Escribe el motivo..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBanModalUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleBanUser}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
              >
                {actionLoading ? 'Aplicando...' : 'Confirmar Baneo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
