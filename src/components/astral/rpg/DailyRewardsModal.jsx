"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Calendar, Gift, Sparkles, Flame, Zap, Heart, Compass, Crown, 
  CheckCircle2, Lock, Clock, Swords, Landmark, Users, Target, 
  ArrowRight, Shield, Award, Check
} from 'lucide-react';
import { 
  DAILY_STREAK_REWARDS, 
  DAILY_QUESTS_TEMPLATE, 
  DAILY_MASTER_CHEST_REWARD,
  getDailyResetInfo, 
  claimDailyStreakReward, 
  initializeOrSyncDailyQuests,
  claimDailyQuestReward, 
  claimDailyMasterChest,
  EQUIPMENT_CATALOG
} from './rpg-data';
import { playDailyClaimSound, playLootChestSound, playBattleVictorySound, playIncomingChimeSound } from '../../../lib/sound-effects';

export function DailyRewardsModal({ isOpen, onClose, hero, onHeroUpdate, transitBuff, isInline = false }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('streak'); // 'streak' | 'quests'
  const [claimAlert, setClaimAlert] = useState(null);
  const [timeLeft, setTimeToMidnight] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la página mientras el modal esté abierto (solo si no es inline)
  useEffect(() => {
    if (isOpen && !isInline) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, isInline]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen && !isInline) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose && !isInline) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInline, onClose]);

  // Sincronizar misiones si es un nuevo día
  useEffect(() => {
    if (hero && (isOpen || isInline)) {
      const synced = initializeOrSyncDailyQuests(hero);
      if (synced !== hero && onHeroUpdate) {
        onHeroUpdate(synced);
      }
    }
  }, [hero, isOpen, isInline, onHeroUpdate]);

  // Contador de cuenta regresiva hasta la próxima medianoche local
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight - now;

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeToMidnight(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if ((!isOpen && !isInline) || !hero || !mounted) return null;

  const resetInfo = getDailyResetInfo(hero);
  const quests = hero.dailyQuests || [];
  const completedQuestsCount = quests.filter(q => q.completed).length;
  const claimableQuestsCount = quests.filter(q => q.completed && !q.claimed).length;
  const isMasterChestAvailable = completedQuestsCount >= 3 && !hero.dailyMasterChestClaimed;

  // Reclamar recompensa de racha de 7 días
  const handleClaimStreak = () => {
    const res = claimDailyStreakReward(hero);
    if (res.rewardDef) {
      playDailyClaimSound();
      onHeroUpdate(res.updatedHero);
      let alertText = `¡Reclamaste el ${res.rewardDef.badge}! +${res.rewardDef.polvoEstelar} Polvo, +${res.rewardDef.exp} EXP`;
      if (res.rewardDef.potions) alertText += `, +${res.rewardDef.potions} Pociones`;
      if (res.gainedItem) alertText += ` y equipo [${res.gainedItem.name}]`;
      setClaimAlert(alertText);
      setTimeout(() => setClaimAlert(null), 5000);
    }
  };

  // Reclamar misión individual
  const handleClaimQuest = (questId) => {
    const res = claimDailyQuestReward(hero, questId);
    if (res.reward) {
      playDailyClaimSound();
      onHeroUpdate(res.updatedHero);
      let alertText = `¡Misión Reclamada! +${res.reward.polvoEstelar} Polvo, +${res.reward.exp} EXP`;
      if (res.reward.pvpPoints) alertText += `, +${res.reward.pvpPoints} Pts de Gloria`;
      if (res.reward.potions) alertText += `, +${res.reward.potions} Poción`;
      setClaimAlert(alertText);
      setTimeout(() => setClaimAlert(null), 4500);
    }
  };

  // Reclamar cofre maestro
  const handleClaimMasterChest = () => {
    const res = claimDailyMasterChest(hero);
    if (res.reward) {
      playLootChestSound();
      onHeroUpdate(res.updatedHero);
      let alertText = `¡COFRE MAESTRO ABIERTO! +${res.reward.polvoEstelar} Polvo, +${res.reward.exp} EXP, +${res.reward.potions} Pociones`;
      if (res.gainedItem) alertText += ` y [${res.gainedItem.name}]`;
      setClaimAlert(alertText);
      setTimeout(() => setClaimAlert(null), 6000);
    }
  };

  const getDayIcon = (iconName) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Gift': return <Gift className="w-5 h-5 text-emerald-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-purple-400" />;
      case 'Crown': return <Crown className="w-5 h-5 text-amber-300 animate-bounce" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const getQuestIcon = (iconName) => {
    switch (iconName) {
      case 'Landmark': return <Landmark className="w-5 h-5 text-amber-400" />;
      case 'Swords': return <Swords className="w-5 h-5 text-rose-400" />;
      case 'Users': return <Users className="w-5 h-5 text-cyan-400" />;
      case 'Target': return <Target className="w-5 h-5 text-purple-400" />;
      default: return <Award className="w-5 h-5 text-indigo-400" />;
    }
  };

  const modalBody = (
    <div 
      className={`relative w-full ${isInline ? 'rounded-3xl' : 'max-w-2xl rounded-3xl max-h-[92dvh] sm:max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.2)]'} bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-amber-500/40 overflow-hidden flex flex-col text-left`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Cabecera del Modal */}
      <div className="relative px-5 py-4 border-b border-indigo-500/20 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-serif">
              Recompensas Cósmicas Diarias
              <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-normal">
                Racha: {hero.dailyStreak || 0}d
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-indigo-300/80 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reinicio en: <strong className="text-amber-300 font-mono">{timeLeft}</strong></span>
            </div>
          </div>
        </div>
        {!isInline && onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Banner de Primera Victoria del Día */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-b border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              <strong>Bono Primera Victoria del Día:</strong> Multiplicador de <span className="text-amber-300 font-bold">x1.5 EXP y Polvo</span>
            </span>
          </div>
          {resetInfo.isFirstWinAvailable ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium">
              ¡Disponible Hoy!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-400">
              ✓ Obtenido Hoy
            </span>
          )}
        </div>

        {/* Alerta de Reclamo */}
        {claimAlert && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{claimAlert}</span>
          </div>
        )}

        {/* Selector de Pestañas */}
        <div className="flex border-b border-indigo-500/20 bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'streak'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Racha de 7 Días
            {resetInfo.canClaimStreak && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'quests'
                ? 'border-indigo-400 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Misiones del Oráculo
            {(claimableQuestsCount > 0 || isMasterChestAvailable) && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-white font-bold">
                {claimableQuestsCount + (isMasterChestAvailable ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* ================= PESTAÑA: RACHA DE 7 DÍAS ================= */}
          {activeTab === 'streak' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Progreso del Ciclo Astral
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-0.5">
                    Ingresa a diario para desbloquear recompensas progresivas. ¡El Día 7 otorga un Arma Legendaria!
                  </p>
                </div>
                {resetInfo.canClaimStreak ? (
                  <button
                    onClick={handleClaimStreak}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Gift className="w-4 h-4" />
                    ¡Reclamar Día {((hero.dailyStreak || 0) % 7) + 1}!
                  </button>
                ) : (
                  <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs flex items-center gap-1.5 shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reclamado Hoy</span>
                  </div>
                )}
              </div>

              {/* Cuadrícula de los 7 Días */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DAILY_STREAK_REWARDS.map((reward, index) => {
                  const currentStreakDay = ((hero.dailyStreak || 0) % 7);
                  const isClaimedPast = !resetInfo.canClaimStreak 
                    ? index < (hero.dailyStreak ? ((hero.dailyStreak - 1) % 7) + 1 : 0)
                    : index < currentStreakDay;
                  const isAvailableToday = resetInfo.canClaimStreak && index === currentStreakDay;
                  const isFuture = !isClaimedPast && !isAvailableToday;

                  let borderStyle = 'border-slate-800/80 bg-slate-900/40 text-slate-400';
                  if (isClaimedPast) {
                    borderStyle = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300';
                  } else if (isAvailableToday) {
                    borderStyle = 'border-amber-400 bg-amber-950/30 text-amber-200 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10 animate-pulse';
                  }

                  const itemData = reward.itemDropId ? EQUIPMENT_CATALOG.find(i => i.id === reward.itemDropId) : null;

                  return (
                    <div 
                      key={reward.day}
                      className={`relative p-3 rounded-xl border flex flex-col justify-between transition-all ${borderStyle} ${
                        reward.day === 7 ? 'col-span-2 sm:col-span-2' : ''
                      }`}
                    >
                      {/* Badge superior */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isAvailableToday 
                            ? 'bg-amber-400 text-slate-950' 
                            : isClaimedPast 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-800 text-slate-400'
                        }`}>
                          {reward.badge}
                        </span>
                        {isClaimedPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isAvailableToday ? (
                          <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>

                      {/* Icono y Título */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${
                          isAvailableToday ? 'bg-amber-500/20' : 'bg-slate-800/50'
                        }`}>
                          {getDayIcon(reward.icon)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{reward.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{reward.desc}</p>
                        </div>
                      </div>

                      {/* Recompensas */}
                      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          +{reward.polvoEstelar} Polvo
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                          +{reward.exp} EXP
                        </span>
                        {reward.potions > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            +{reward.potions} Poción
                          </span>
                        )}
                        {itemData && (
                          <span className="w-full mt-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-200 font-bold truncate">
                            🎁 {itemData.name}
                          </span>
                        )}
                      </div>

                      {/* Botón rápido si está disponible hoy */}
                      {isAvailableToday && (
                        <button
                          onClick={handleClaimStreak}
                          className="mt-2 w-full py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold transition-transform active:scale-95"
                        >
                          Reclamar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA: MISIONES DEL ORÁCULO ================= */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              {/* Tarjeta de Cofre Maestro Diario */}
              <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                hero.dailyMasterChestClaimed
                  ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                  : isMasterChestAvailable
                    ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-amber-400/60 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-900/60 border-indigo-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                      <Crown className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white font-serif">
                          Cofre Dorado del Oráculo
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {completedQuestsCount} / 3 Misiones
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300/80 mt-0.5">
                        Completa al menos 3 misiones para abrir este gran cofre: +180 Polvo, +150 EXP, 2 Pociones y Armadura Épica.
                      </p>
                    </div>
                  </div>

                  {hero.dailyMasterChestClaimed ? (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Cofre Reclamado</span>
                    </div>
                  ) : isMasterChestAvailable ? (
                    <button
                      onClick={handleClaimMasterChest}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Gift className="w-4 h-4" />
                      ¡Abrir Cofre Dorado!
                    </button>
                  ) : (
                    <div className="w-full sm:w-36">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progreso</span>
                        <span>{completedQuestsCount}/3</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all"
                          style={{ width: `${Math.min(100, (completedQuestsCount / 3) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de las 4 Misiones */}
              <div className="space-y-2.5">
                {DAILY_QUESTS_TEMPLATE.map(template => {
                  const quest = quests.find(q => q.id === template.id) || {
                    progress: 0,
                    target: template.target,
                    completed: false,
                    claimed: false
                  };

                  const isClaimable = quest.completed && !quest.claimed;

                  return (
                    <div 
                      key={template.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        quest.claimed
                          ? 'bg-slate-900/30 border-slate-800/80 opacity-70'
                          : isClaimable
                            ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                            : 'bg-slate-900/60 border-indigo-500/20 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 ${
                          quest.claimed
                            ? 'bg-slate-800/50 text-slate-500'
                            : isClaimable
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {getQuestIcon(template.icon)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-bold text-white">{template.title}</h5>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                              {quest.progress} / {quest.target}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300/80 mt-0.5">{template.desc}</p>
                          
                          {/* Recompensas */}
                          <div className="flex items-center gap-2 mt-2 text-[10px]">
                            <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                              +{template.reward.polvoEstelar} Polvo
                            </span>
                            <span className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-medium">
                              +{template.reward.exp} EXP
                            </span>
                            {template.reward.pvpPoints && (
                              <span className="text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-medium">
                                +{template.reward.pvpPoints} Gloria
                              </span>
                            )}
                            {template.reward.potions && (
                              <span className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                                +{template.reward.potions} Poción
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acción */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {quest.claimed ? (
                          <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-400 text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Completada
                          </span>
                        ) : isClaimable ? (
                          <button
                            onClick={() => handleClaimQuest(template.id)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Reclamar
                          </button>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-indigo-300/70">En progreso</span>
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-indigo-500 transition-all"
                                style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-indigo-500/20 bg-slate-900/60 flex items-center justify-between text-xs text-indigo-300/70">
          <span>El cosmos renueva sus bendiciones cada 24 horas a medianoche.</span>
          {!isInline && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>

      </div>
    );

  if (isInline) {
    return (
      <div className="w-full select-none">
        {modalBody}
      </div>
    );
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {modalBody}
    </div>,
    document.body
  );
}
