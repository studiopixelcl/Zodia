"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Dices, RotateCcw, Award, ArrowLeft, Star, Zap, Volume2, VolumeX, Trophy, Swords, Share2, Users, Radio, Check, Copy, MessageCircle, Play, Settings, Bot, UserCheck, UserX } from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { apiFetch } from '../../lib/api';

// Mapa Astrológico de Signos a Elementos
const SIGN_ELEMENT_MAP = {
  Aries: 'Fuego', Leo: 'Fuego', Sagitario: 'Fuego',
  Tauro: 'Tierra', Virgo: 'Tierra', Capricornio: 'Tierra',
  Géminis: 'Aire', Libra: 'Aire', Acuario: 'Aire',
  Cáncer: 'Agua', Escorpio: 'Agua', Piscis: 'Agua',
};

const ZODIAC_SIGNS_LIST = [
  "Aries", "Tauro", "Géminis", "Cáncer",
  "Leo", "Virgo", "Libra", "Escorpio",
  "Sagitario", "Capricornio", "Acuario", "Piscis"
];

// Configuración de Facciones Elementales con Signos Zodiacales 3D
const BASE_ELEMENTS_CONFIG = [
  { 
    id: 'Fuego',  
    name: 'Fuego',
    sign: 'Leo',
    color: 'amber',   
    bg: 'from-amber-950/90 via-[#0e0703] to-red-950/70',   
    border: 'border-amber-500/60', 
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    text: 'text-amber-400', 
    hex: '#f59e0b', 
    symbol: '🔥', 
    basePos: [[1,1], [1,4], [4,1], [4,4]] 
  },
  { 
    id: 'Tierra', 
    name: 'Tierra', 
    sign: 'Capricornio',
    color: 'emerald', 
    bg: 'from-emerald-950/90 via-[#030e09] to-teal-950/70', 
    border: 'border-emerald-500/60', 
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.5)]',
    text: 'text-emerald-400', 
    hex: '#10b981', 
    symbol: '⛰️', 
    basePos: [[1,10], [1,13], [4,10], [4,13]] 
  },
  { 
    id: 'Aire',   
    name: 'Aire',
    sign: 'Géminis',
    color: 'cyan',    
    bg: 'from-cyan-950/90 via-[#030b14] to-blue-950/70',    
    border: 'border-cyan-500/60', 
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.5)]',
    text: 'text-cyan-400', 
    hex: '#06b6d4', 
    symbol: '🌬️', 
    basePos: [[10,10], [10,13], [13,10], [13,13]] 
  },
  { 
    id: 'Agua',   
    name: 'Agua', 
    sign: 'Escorpio',
    color: 'purple',  
    bg: 'from-purple-950/90 via-[#0a0314] to-indigo-950/70',
    border: 'border-purple-500/60', 
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
    text: 'text-purple-400', 
    hex: '#a855f7', 
    symbol: '💧', 
    basePos: [[10,1], [10,4], [13,1], [13,4]] 
  },
];

// Pista Principal de 52 casillas
const TRACK_COORDS = [
  [6,1], [6,2], [6,3], [6,4], [6,5],
  [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7], [0,8],
  [1,8], [2,8], [3,8], [4,8], [5,8],
  [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14], [8,14],
  [8,13], [8,12], [8,11], [8,10], [8,9],
  [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7], [14,6],
  [13,6], [12,6], [11,6], [10,6], [9,6],
  [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
  [7,0], [6,0]
];

const START_OFFSETS = { Fuego: 0, Tierra: 13, Aire: 26, Agua: 39 };

const HOME_STRETCHES = {
  Fuego:  [[7,1], [7,2], [7,3], [7,4], [7,5]],
  Tierra: [[1,7], [2,7], [3,7], [4,7], [5,7]],
  Aire:   [[7,13], [7,12], [7,11], [7,10], [7,9]],
  Agua:   [[13,7], [12,7], [11,7], [10,7], [9,7]]
};

const SAFE_SQUARES_SET = new Set([
  "6-1", "1-8", "8-13", "13-6",
  "2-6", "8-2", "12-8", "6-12"
]);

// Sintetizador Web Audio API Místico Avanzado
const playAstralSound = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'roll') {
      [432, 864, 1296].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + 0.25);
      });
    } else if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'fusion') {
      [528, 639, 741, 852, 963].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + 0.45);
      });
    } else if (type === 'capture') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.32);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } else if (type === 'win') {
      [528, 660, 792, 1056, 1320, 1584].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + 0.7);
      });
    }
  } catch {
    // Silencioso
  }
};

export const TabLudoAstral = ({ profile, onBack }) => {
  // Cálculo automático del Signo y Elemento del Jugador
  const userSign = profile?.sign || profile?.solarSign || 'Capricornio';
  const userElemName = profile?.element || SIGN_ELEMENT_MAP[userSign] || 'Tierra';

  const userIndex = BASE_ELEMENTS_CONFIG.findIndex(e => e.id.toLowerCase() === userElemName.toLowerCase());
  const myPlayerIndex = userIndex !== -1 ? userIndex : 1;

  // Estado principal de pantalla: 'setup' (Lobby Previo) o 'playing' (Tablero Activo)
  const [gameState, setGameState]   = useState('setup');
  // Modo de juego previa: 'duelo' (2 gemas) o 'clasico' (4 gemas)
  const [gameMode, setGameMode]     = useState('duelo');
  // Tipo de partida previa: 'ia' (offline) o 'online' (multijugador)
  const [playType, setPlayType]     = useState('ia');

  // CONFIGURACIÓN DE JUGADORES Y BOTS
  const [playerCount, setPlayerCount] = useState(2); // 2, 3 o 4 jugadores
  const [enableBots, setEnableBots]   = useState(true); // Rellenar vacíos con IA

  // Asignación personalizada de Signos Zodiacales para cada Slot (Permite mismo elemento con distinto signo)
  const [slotSigns, setSlotSigns] = useState({
    0: 'Leo',         // Base Fuego
    1: userSign,      // Base Tierra (Jugador principal o personalizado)
    2: 'Géminis',     // Base Aire
    3: 'Escorpio',    // Base Agua
  });

  // Configuración de Sala Multijugador
  const [activeRoomCode, setActiveRoomCode] = useState(null);
  const [whatsappUrl, setWhatsappUrl]       = useState(null);
  const [copiedSuccess, setCopiedSuccess]   = useState(false);
  
  // Lista de Jugadores en Sala Previa
  const [connectedPlayers, setConnectedPlayers] = useState([
    { name: profile?.name || 'TÚ (Host)', sign: userSign, element: userElemName, ready: true }
  ]);

  // Facciones dinámicas con signos zodiacales individuales
  const activeElements = BASE_ELEMENTS_CONFIG.map((cfg, i) => {
    const customSign = slotSigns[i] || cfg.sign;
    return { ...cfg, sign: customSign };
  });

  // Determinar qué Slots están activos en la partida
  const isSlotActive = (idx) => {
    if (playerCount === 2) return idx === 0 || idx === myPlayerIndex || idx === 1; // 2 jugadores activos
    if (playerCount === 3) return idx !== 3; // 3 jugadores activos
    return true; // 4 jugadores activos
  };

  const isSlotBot = (idx) => {
    if (idx === myPlayerIndex) return false; // El usuario nunca es bot
    if (playType === 'online' && idx < connectedPlayers.length) return false;
    return enableBots; // Es bot si la IA está activada para vacíos
  };

  const [turn, setTurn]           = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving]   = useState(false);
  const [mustMove, setMustMove]   = useState(false);
  const [winner, setWinner]       = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [eventBanner, setEventBanner] = useState(null);
  const [logs, setLogs]           = useState([
    "🌌 Ludo Astral - Sala Lista.",
    `✦ Presiona Iniciar Partida cuando estés listo.`
  ]);

  const cpuTimerRef = useRef(null);

  const getInitialPawns = (mode) => {
    const count = mode === 'duelo' ? 2 : 4;
    return {
      Fuego:  Array(count).fill(-1),
      Tierra: Array(count).fill(-1),
      Aire:   Array(count).fill(-1),
      Agua:   Array(count).fill(-1),
    };
  };

  const [pawns, setPawns] = useState(() => getInitialPawns('duelo'));

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev.slice(0, 10)]);
  };

  const showBanner = (text, type = 'info') => {
    setEventBanner({ text, type });
    setTimeout(() => setEventBanner(null), 3200);
  };

  const canReleasePawn = (val) => val === 1 || val === 6;
  const doesRollGrantExtraTurn = (val) => val === 6;

  // ── GERENTE DE TURNOS CPU (SOLO ACTIVO PARA SLOTS CON BOT HABILITADO) ──
  useEffect(() => {
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }

    const currentTurnIsBot = isSlotBot(turn) && isSlotActive(turn);

    if (
      gameState === 'playing' &&
      currentTurnIsBot &&
      !isRolling &&
      !isMoving &&
      !mustMove &&
      !winner
    ) {
      cpuTimerRef.current = setTimeout(() => {
        rollDice();
      }, 950);
    }

    return () => {
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
    };
  }, [turn, isRolling, isMoving, mustMove, winner, gameState, enableBots, playerCount]);

  // ── LÓGICA DE SALAS WHATSAPP ─────────────────────────────────────────────
  const handleCreateRoomWhatsApp = async () => {
    setPlayType('online');
    try {
      const res = await apiFetch('/api/ludo/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          mode: gameMode,
          player: { name: profile?.name || 'Viajero Astral', sign: userSign, element: userElemName }
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoomCode(data.roomCode);
        setWhatsappUrl(data.whatsappUrl);
        
        setConnectedPlayers([
          { name: profile?.name || 'TÚ (Host)', sign: userSign, element: userElemName, ready: true },
          { name: 'Invitado WhatsApp', sign: 'Escorpio', element: 'Agua', ready: true }
        ]);

        window.open(data.whatsappUrl, '_blank');
      }
    } catch {
      const mockCode = 'ZOD-' + Math.floor(1000 + Math.random() * 9000);
      const shareText = `🌌 ¡Te desafío a una partida de Ludo Astral en Zodia! 🎲\n\nÚnete a mi sala cósmica con el código: *${mockCode}*\nEntra a jugar desde aquí: https://zodia.app/dashboard?game=ludo&room=${mockCode}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      setActiveRoomCode(mockCode);
      setWhatsappUrl(waUrl);
      setConnectedPlayers([
        { name: profile?.name || 'TÚ (Host)', sign: userSign, element: userElemName, ready: true },
        { name: 'Invitado WhatsApp', sign: 'Escorpio', element: 'Agua', ready: true }
      ]);
      window.open(waUrl, '_blank');
    }
  };

  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleStartGame = () => {
    setPawns(getInitialPawns(gameMode));
    // Asegurar que el primer turno inicie en un slot activo
    let firstTurn = 0;
    while (!isSlotActive(firstTurn)) {
      firstTurn = (firstTurn + 1) % 4;
    }
    setTurn(firstTurn);
    setGameState('playing');
    addLog(`🚀 Partida iniciada para ${playerCount} Jugadores (${enableBots ? 'con Bots' : 'Sin Bots'}).`);
  };

  // ── TIRAR DADO ─────────────────────────────────────────────────────────────
  const rollDice = () => {
    if (isRolling || isMoving || mustMove || winner || gameState !== 'playing') return;
    
    const currentTurnIdx = turn;
    setIsRolling(true);
    playAstralSound('roll', soundEnabled);

    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 7) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        processTurnAfterRoll(finalVal, currentTurnIdx);
      }
    }, 70);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.key === ' ') && gameState === 'playing') {
        e.preventDefault();
        if (!isRolling && !isMoving && !mustMove && turn === myPlayerIndex && !winner) {
          rollDice();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, isMoving, mustMove, turn, myPlayerIndex, winner, gameState]);

  const processTurnAfterRoll = (val, currentTurnIdx) => {
    const activeElem = activeElements[currentTurnIdx].id;
    const currentPawns = pawns[activeElem];

    const movableIndices = currentPawns.map((pos, idx) => {
      if (pos === -1 && canReleasePawn(val)) return idx;
      if (pos >= 0 && pos < 56 && (pos + val <= 56)) return idx;
      return null;
    }).filter(i => i !== null);

    addLog(`🎲 ${activeElements[currentTurnIdx].id} (${activeElements[currentTurnIdx].sign}) tiró un ${val}.`);

    if (movableIndices.length === 0) {
      const grantExtra = doesRollGrantExtraTurn(val);
      if (grantExtra) {
        addLog(`⚡ ¡Sacaste un 6 pero no tienes movimientos! Repites turno.`);
      } else {
        addLog(`⚠️ Sin movimientos para ${activeElements[currentTurnIdx].id}. Turno pasa.`);
      }
      setIsMoving(true);
      setTimeout(() => {
        nextTurn(grantExtra, currentTurnIdx);
      }, 700);
      return;
    }

    const uniquePosMap = new Map();
    movableIndices.forEach(idx => {
      const pos = currentPawns[idx];
      if (!uniquePosMap.has(pos)) {
        uniquePosMap.set(pos, idx);
      }
    });

    const choiceIndices = Array.from(uniquePosMap.values());

    if (choiceIndices.length === 1) {
      const autoChoiceIdx = choiceIndices[0];
      setTimeout(() => movePawn(currentTurnIdx, autoChoiceIdx, val), 400);
    } else {
      if (!isSlotBot(currentTurnIdx)) {
        setMustMove(true);
        addLog(`👉 Varias gemas disponibles. Selecciona cuál mover.`);
      } else {
        setTimeout(() => {
          const chosen = choiceIndices[Math.floor(Math.random() * choiceIndices.length)];
          movePawn(currentTurnIdx, chosen, val);
        }, 650);
      }
    }
  };

  const movePawn = (playerIdx, pawnIdx, val) => {
    setIsMoving(true);
    const elem = activeElements[playerIdx].id;
    const currentPos = pawns[elem][pawnIdx];

    const isStacked = currentPos >= 0 && pawns[elem].filter(p => p === currentPos).length > 1;

    const indicesToMove = isStacked
      ? pawns[elem].map((p, i) => p === currentPos ? i : null).filter(i => i !== null)
      : [pawnIdx];

    if (currentPos === -1 && canReleasePawn(val)) {
      playAstralSound('step', soundEnabled);
      const newPawnsState = {
        ...pawns,
        [elem]: pawns[elem].map((p, i) => indicesToMove.includes(i) ? 0 : p)
      };
      setPawns(newPawnsState);
      addLog(`✨ ${elem} liberó gema de ${activeElements[playerIdx].sign} con un ${val}.`);
      finishPawnMove(playerIdx, pawnIdx, 0, newPawnsState, val);
      return;
    }

    if (currentPos >= 0) {
      const targetPos = Math.min(56, currentPos + val);
      let stepPos = currentPos;

      const stepInterval = setInterval(() => {
        stepPos += 1;
        playAstralSound('step', soundEnabled);

        setPawns(prev => {
          const updated = prev[elem].map((p, i) => indicesToMove.includes(i) ? stepPos : p);
          const nextState = { ...prev, [elem]: updated };

          if (stepPos >= targetPos) {
            clearInterval(stepInterval);
            setTimeout(() => {
              finishPawnMove(playerIdx, pawnIdx, targetPos, nextState, val);
            }, 80);
          }

          return nextState;
        });
      }, 160);
    }
  };

  const finishPawnMove = (playerIdx, pawnIdx, newPos, currentPawnsState, val) => {
    const elem = activeElements[playerIdx].id;
    let newPawnsState = { ...currentPawnsState };
    let capturedAny = false;

    if (newPos === 56) {
      addLog(`👑 ¡Gema de ${elem} ingresó exitosamente al Núcleo del Éter!`);
      showBanner(`👑 GEMA EN EL ÉTER (${elem})`, 'info');
    }

    const countAtNewPos = newPawnsState[elem].filter(p => p === newPos).length;
    if (countAtNewPos > 1 && newPos >= 0 && newPos < 56) {
      playAstralSound('fusion', soundEnabled);
      showBanner(`⚡ ¡FUSIÓN ASTRAL X${countAtNewPos}! (${elem})`, 'fusion');
      addLog(`⚡ ¡${elem} fusionó ${countAtNewPos} gemas en x${countAtNewPos}!`);
    }

    if (newPos >= 0 && newPos < 51) {
      const [targetR, targetC] = getPawnCoords(elem, pawnIdx, newPos);
      const targetCoordKey = `${targetR}-${targetC}`;
      const isSquareSafe = SAFE_SQUARES_SET.has(targetCoordKey);

      if (!isSquareSafe) {
        activeElements.forEach((otherElem, oIdx) => {
          if (otherElem.id !== elem && isSlotActive(oIdx)) {
            const enemyPawnsAtCell = newPawnsState[otherElem.id].map((p, idx) => {
              if (p < 0 || p >= 51) return false;
              const [eR, eC] = getPawnCoords(otherElem.id, idx, p);
              return eR === targetR && eC === targetC;
            });

            if (enemyPawnsAtCell.some(Boolean)) {
              capturedAny = true;
              newPawnsState[otherElem.id] = newPawnsState[otherElem.id].map((p, idx) => enemyPawnsAtCell[idx] ? -1 : p);
              addLog(`💥 ¡${elem} transmutó gemas de ${otherElem.id}!`);
            }
          }
        });

        if (capturedAny) {
          playAstralSound('capture', soundEnabled);
          showBanner(`💥 ¡TRANSMUTACIÓN CÓSMICA! Gemas devueltas al Templo`, 'capture');
        }
      }
    }

    setPawns(newPawnsState);

    if (newPawnsState[elem].every(p => p === 56)) {
      setWinner(elem);
      playAstralSound('win', soundEnabled);
      addLog(`🏆 ¡${elem} (${activeElements[playerIdx].sign}) conquistó el Éter!`);
      return;
    }

    const repeatTurn = doesRollGrantExtraTurn(val) || capturedAny;
    nextTurn(repeatTurn, playerIdx);
  };

  // Salta automáticamente jugadores inactivos cuando playerCount < 4
  const nextTurn = (repeat = false, fromTurnIdx = turn) => {
    if (repeat) {
      addLog(`⚡ ¡Turno extra para ${activeElements[fromTurnIdx].id}!`);
      setTurn(fromTurnIdx);
    } else {
      let nextIdx = (fromTurnIdx + 1) % 4;
      while (!isSlotActive(nextIdx)) {
        nextIdx = (nextIdx + 1) % 4;
      }
      setTurn(nextIdx);
    }
    setDiceValue(null);
    setMustMove(false);
    setIsMoving(false);
  };

  const getPawnCoords = (elemId, pawnIdx, pos) => {
    const elemIdx = BASE_ELEMENTS_CONFIG.findIndex(e => e.id === elemId);
    const baseCoordsArray = getBaseSocketsForMode(BASE_ELEMENTS_CONFIG[elemIdx].basePos, gameMode);
    
    if (pos === -1) {
      return baseCoordsArray[pawnIdx] || baseCoordsArray[0];
    }
    if (pos >= 51 && pos <= 55) {
      const homeStep = pos - 51;
      return HOME_STRETCHES[elemId][homeStep];
    }
    if (pos === 56) {
      return [7, 7];
    }
    const globalOffset = START_OFFSETS[elemId];
    const trackIndex = (pos + globalOffset) % 52;
    return TRACK_COORDS[trackIndex];
  };

  const getBaseSocketsForMode = (basePosArray, mode) => {
    if (mode === 'duelo') {
      return [basePosArray[0], basePosArray[3]];
    }
    return basePosArray;
  };

  const resetGame = () => {
    setGameState('setup');
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    setTurn(0);
    setDiceValue(null);
    setIsRolling(false);
    setIsMoving(false);
    setMustMove(false);
    setWinner(null);
    setEventBanner(null);
  };

  const trackCells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const inFuegoBase  = r < 6 && c < 6;
      const inTierraBase = r < 6 && c > 8;
      const inAireBase   = r > 8 && c > 8;
      const inAguaBase   = r > 8 && c < 6;
      const inCore       = r >= 6 && r <= 8 && c >= 6 && c <= 8;

      if (!inFuegoBase && !inTierraBase && !inAireBase && !inAguaBase && !inCore) {
        trackCells.push({ r, c });
      }
    }
  }

  const getCorePawnCount = (elemId) => {
    return pawns[elemId].filter(p => p === 56).length;
  };

  const targetPawnsCount = gameMode === 'duelo' ? 2 : 4;

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[100] bg-[#02030a] flex flex-col justify-between animate-fadeIn p-2 sm:p-4 select-none overflow-hidden max-h-screen">
      
      {/* ── FASE 1: SALA PREVIA DE CONFIGURACIÓN Y DESACTIVACIÓN DE BOTS ── */}
      {gameState === 'setup' && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[110] bg-[#02030a] flex flex-col justify-between animate-fadeIn p-4 sm:p-6 overflow-y-auto">
          
          {/* Cabecera */}
          <div className="flex items-center justify-between shrink-0">
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-cyan-400 rounded-full hover:bg-white/10 flex items-center gap-1.5 text-xs font-bold uppercase">
              <ArrowLeft size={18} /> Salir a Arcadia
            </button>

            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
              ⚙️ CONFIGURACIÓN PREVIA DE SALA
            </span>
          </div>

          {/* Panel Central de Configuración Previas */}
          <div className="max-w-xl mx-auto w-full space-y-4 my-auto py-3">
            
            <div className="text-center space-y-1">
              <h2 className="mystic-font text-3xl sm:text-4xl text-white font-black flex items-center justify-center gap-3">
                <Dices className="text-cyan-400" size={36} /> LUDO ASTRAL
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300 font-light">
                Configura jugadores (2 a 4), activa o desactiva bots, y personaliza los signos zodiacales.
              </p>
            </div>

            {/* 1. SELECCIÓN DE MODO DE JUEGO */}
            <div className="glass-panel p-3.5 border border-cyan-500/40 bg-black/60 rounded-2xl space-y-2.5">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest block">
                1. Modo de Juego (Gemas por Jugador)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGameMode('duelo')}
                  className={`p-3.5 rounded-xl border-2 text-left transition ${
                    gameMode === 'duelo'
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/80 to-black text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="mystic-font text-xs font-black text-cyan-400 flex items-center gap-1">
                      <Swords size={14} /> DUELO RÁPIDO
                    </span>
                    <span className="bg-cyan-500 text-black text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                      2 GEMAS
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-tight">
                    Partida ultradinámica de ~3 min en celular.
                  </p>
                </button>

                <button
                  onClick={() => setGameMode('clasico')}
                  className={`p-3.5 rounded-xl border-2 text-left transition ${
                    gameMode === 'clasico'
                      ? 'border-purple-400 bg-gradient-to-r from-purple-950/80 to-black text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="mystic-font text-xs font-black text-purple-400 flex items-center gap-1">
                      <Award size={14} /> MODO CLÁSICO
                    </span>
                    <span className="bg-purple-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                      4 GEMAS
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-tight">
                    Partida tradicional completa.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. CANTIDAD DE JUGADORES (DESDE 2 JUGADORES) Y DESACTIVACIÓN DE BOTS */}
            <div className="glass-panel p-3.5 border border-amber-500/40 bg-black/60 rounded-2xl space-y-3">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest block">
                2. Cantidad de Jugadores y Control de IA / Bots
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setPlayerCount(num)}
                    className={`py-2 px-2 rounded-xl border font-extrabold text-xs uppercase tracking-wider transition ${
                      playerCount === num
                        ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_12px_#06b6d4]'
                        : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {num} Jugadores
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-xs text-gray-300 font-bold flex items-center gap-1.5">
                  <Bot size={16} className="text-cyan-400" /> Rellenar casilleros vacíos con IA (Bots):
                </span>
                <button
                  onClick={() => setEnableBots(!enableBots)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition border ${
                    enableBots
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_#10b981]'
                      : 'bg-red-500/20 text-red-300 border-red-400/50'
                  }`}
                >
                  {enableBots ? '✓ Bots Habilitados' : '✕ Sin Bots (Solo Humanos)'}
                </button>
              </div>
            </div>

            {/* 3. TIPO DE PARTIDA & WHATSAPP */}
            <div className="glass-panel p-3.5 border border-emerald-500/40 bg-black/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest">
                  3. Tipo de Partida & Invitaciones
                </span>
                {playType === 'online' && activeRoomCode && (
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    SALA: {activeRoomCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setPlayType('ia');
                    setActiveRoomCode(null);
                    setConnectedPlayers([
                      { name: profile?.name || 'TÚ (Host)', sign: userSign, element: userElemName, ready: true }
                    ]);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    playType === 'ia'
                      ? 'border-amber-400 bg-amber-950/30 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-black text-amber-400 block mb-0.5">🎮 MODO LOCAL / IA</span>
                  <span className="text-[10px] text-gray-300 block">Juega desde 2 a 4 participantes</span>
                </button>

                <button
                  onClick={handleCreateRoomWhatsApp}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    playType === 'online'
                      ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-black text-emerald-400 block mb-0.5">📲 INVITAR POR WHATSAPP</span>
                  <span className="text-[10px] text-gray-300 block">Envía la sala a tus contactos</span>
                </button>
              </div>

              {playType === 'online' && activeRoomCode && (
                <div className="p-3 rounded-xl bg-black/90 border border-emerald-500/50 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-extrabold flex items-center gap-1.5">
                      <MessageCircle size={15} /> SALA GENERADA: <strong className="font-mono text-cyan-300">{activeRoomCode}</strong>
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold hover:bg-emerald-500/30 flex items-center gap-1 border border-emerald-400/40"
                    >
                      {copiedSuccess ? <Check size={12} /> : <Copy size={12} />}
                      {copiedSuccess ? "¡COPIADO!" : "COPIAR LINK"}
                    </button>
                  </div>

                  <button
                    onClick={() => window.open(whatsappUrl, '_blank')}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle size={16} /> REENVIAR INVITACIÓN POR WHATSAPP
                  </button>
                </div>
              )}
            </div>

            {/* 4. SELECCIÓN INDIVIDUAL DE SIGNO Y FICHA PARA CADA JUGADOR (MISION: MISMO ELEMENTO C/ DISTINTO SIGNO) */}
            <div className="glass-panel p-3.5 border border-cyan-500/40 bg-black/70 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Users size={16} className="text-cyan-400" /> 4. Facciones y Signos Zodiacales ({playerCount} Activos)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {activeElements.map((elem, idx) => {
                  const active = isSlotActive(idx);
                  const isBot = isSlotBot(idx);

                  return (
                    <div
                      key={elem.id}
                      className={`p-2 rounded-xl border flex items-center justify-between ${
                        active
                          ? 'bg-gradient-to-r from-cyan-950/50 to-black border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-black/30 border-white/5 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ZodiacBadge sign={elem.sign} size="xs" zoom={1.3} />
                        <div className="overflow-hidden">
                          <span className={`text-xs font-black block leading-none truncate ${elem.text}`}>
                            {elem.id}
                          </span>
                          
                          {/* Selector de Signo Individual para cada Slot */}
                          {active ? (
                            <select
                              value={slotSigns[idx] || elem.sign}
                              onChange={(e) => setSlotSigns(prev => ({ ...prev, [idx]: e.target.value }))}
                              className="bg-black/80 text-[10px] text-cyan-300 font-bold border border-white/20 rounded px-1 py-0.5 mt-1 focus:outline-none cursor-pointer"
                            >
                              {ZODIAC_SIGNS_LIST.map(s => (
                                <option key={s} value={s} className="bg-black text-white">{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {active ? (
                          isBot ? (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[8px] px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                              <Bot size={10} /> IA
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[8px] px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                              <UserCheck size={10} /> {idx === myPlayerIndex ? 'TÚ' : 'HUMANO'}
                            </span>
                          )
                        ) : (
                          <span className="text-[8px] text-gray-600 font-mono">OFF</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN MONUMENTAL: INICIAR PARTIDA EN EL TABLERO */}
            <button
              onClick={handleStartGame}
              className="btn-mystic w-full py-3.5 rounded-2xl text-white font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-[1.02] transition-transform"
            >
              <Play size={20} className="fill-white" /> 🚀 INICIAR PARTIDA CON {playerCount} JUGADORES
            </button>

          </div>
        </div>
      )}

      {/* ── FASE 2: TABLERO 15x15 DE JUEGO ACTIVO ── */}
      {gameState === 'playing' && (
        <>
          {/* 1. PARTE DE ARRIBA: CABECERA + BARRA DE NOTIFICACIONES */}
          <div className="space-y-2 shrink-0">
            <div className="glass-panel px-3 py-1.5 flex items-center justify-between shadow-md border border-cyan-500/30 bg-black/80">
              <div className="flex items-center gap-2">
                <button onClick={resetGame} className="p-1.5 text-gray-400 hover:text-cyan-400 transition rounded-full hover:bg-white/10" title="Configurar Sala">
                  <Settings size={18} />
                </button>
                <div>
                  <h3 className="mystic-font text-sm sm:text-base text-white flex items-center gap-1.5 leading-none">
                    <Dices className="text-cyan-400" size={16} /> LUDO ASTRAL
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] sm:text-[9px] text-cyan-400 uppercase tracking-widest font-semibold">
                      {gameMode === 'duelo' ? '⚡ Duelo (2 Gemas)' : '🌌 Clásico (4 Gemas)'} • {playerCount} Jugadores {enableBots ? '(con IA)' : '(Sin IA)'}
                    </span>
                    {activeRoomCode && (
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[8px] px-1.5 py-0.2 rounded font-mono">
                        SALA: {activeRoomCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
                  title="Sonido"
                >
                  {soundEnabled ? <Volume2 size={15} className="text-cyan-400" /> : <VolumeX size={15} className="text-gray-500" />}
                </button>
                <button
                  onClick={resetGame}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10"
                >
                  <RotateCcw size={12} /> Salir a Configuración
                </button>
              </div>
            </div>

            {/* Ventana de Notificaciones y Marcador de Gemas en Vivo */}
            <div className="glass-panel p-2.5 px-4 border-2 border-cyan-500/40 bg-gradient-to-r from-[#060814] via-[#0e1328] to-[#060814] shadow-[0_0_20px_rgba(6,182,212,0.25)] rounded-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full border border-cyan-500/30 shrink-0">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold hidden xs:inline">Turno:</span>
                  <span className={`text-xs sm:text-sm font-black ${activeElements[turn].text} flex items-center gap-1.5`}>
                    <ZodiacBadge sign={activeElements[turn].sign} size="xs" zoom={1.35} /> {activeElements[turn].id}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300 ml-1">
                    ({getCorePawnCount(activeElements[turn].id)}/{targetPawnsCount} 👑)
                  </span>
                  {!isSlotBot(turn) && (
                    <span className="bg-cyan-400 text-black text-[8px] px-2 py-0.2 rounded-full font-black uppercase shadow-md animate-pulse">
                      {turn === myPlayerIndex ? 'TÚ' : 'HUMANO'}
                    </span>
                  )}
                  {isSlotBot(turn) && (
                    <span className="bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                      IA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-hidden text-right">
                  {eventBanner ? (
                    <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide truncate ${
                      eventBanner.type === 'fusion' ? 'text-cyan-300 animate-pulse' :
                      eventBanner.type === 'capture' ? 'text-red-300 animate-bounce' :
                      'text-amber-300'
                    }`}>
                      {eventBanner.text}
                    </span>
                  ) : (
                    <span className="text-xs text-cyan-200 font-semibold truncate flex items-center gap-1.5 justify-end">
                      <Sparkles size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate">{logs[0]}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. CENTRO: TABLERO 15x15 ASTRAL REINVENTADO */}
          <div className="flex-1 flex items-center justify-center min-h-0 my-1">
            <div className="relative aspect-square h-full max-h-[44vh] max-w-[44vh] sm:max-h-[48vh] sm:max-w-[48vh] bg-[#020309] rounded-2xl border-2 border-cyan-400/60 overflow-hidden shadow-[0_0_70px_rgba(6,182,212,0.4)]">
              <div
                className="w-full h-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(15, 1fr)',
                  gridTemplateRows: 'repeat(15, 1fr)'
                }}
              >
                {/* 🔴 BASE FUEGO */}
                <div
                  className={`bg-gradient-to-br from-amber-950/90 via-[#0f0703] to-red-950/70 border-2 border-amber-500/60 rounded-tl-xl p-2 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(245,158,11,0.3)] ${!isSlotActive(0) ? 'opacity-30' : ''}`}
                  style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-black/60 border border-amber-500/40 shadow-inner">
                    <ZodiacBadge sign={activeElements[0].sign} size="xs" zoom={1.35} className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">{activeElements[0].id}</span>
                  </div>
                </div>

                {/* 🟢 BASE TIERRA */}
                <div
                  className={`bg-gradient-to-br from-emerald-950/90 via-[#030f0a] to-teal-950/70 border-2 border-emerald-500/60 rounded-tr-xl p-2 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] ${!isSlotActive(1) ? 'opacity-30' : ''}`}
                  style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-black/60 border border-emerald-500/40 shadow-inner">
                    <ZodiacBadge sign={activeElements[1].sign} size="xs" zoom={1.35} className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">{activeElements[1].id}</span>
                  </div>
                </div>

                {/* 🔵 BASE AIRE */}
                <div
                  className={`bg-gradient-to-br from-cyan-950/90 via-[#030c17] to-blue-950/70 border-2 border-cyan-500/60 rounded-br-xl p-2 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(6,182,212,0.3)] ${!isSlotActive(2) ? 'opacity-30' : ''}`}
                  style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-black/60 border border-cyan-500/40 shadow-inner">
                    <ZodiacBadge sign={activeElements[2].sign} size="xs" zoom={1.35} className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">{activeElements[2].id}</span>
                  </div>
                </div>

                {/* 🟣 BASE AGUA */}
                <div
                  className={`bg-gradient-to-br from-purple-950/90 via-[#0a0316] to-indigo-950/70 border-2 border-purple-500/60 rounded-bl-xl p-2 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(168,85,247,0.3)] ${!isSlotActive(3) ? 'opacity-30' : ''}`}
                  style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-black/60 border border-purple-500/40 shadow-inner">
                    <ZodiacBadge sign={activeElements[3].sign} size="xs" zoom={1.35} className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">{activeElements[3].id}</span>
                  </div>
                </div>

                {/* 🌟 NÚCLEO ÉTER CENTRAL */}
                <div
                  className="bg-gradient-to-br from-cyan-600/40 via-purple-600/50 to-amber-500/40 border-2 border-cyan-300/50 shadow-[0_0_35px_rgba(6,182,212,0.5)] flex flex-col items-center justify-center"
                  style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
                >
                  <Sparkles size={22} className="text-amber-300 animate-spin" />
                  <span className="text-[7px] font-mystic text-cyan-300 font-black tracking-widest mt-1">ÉTER</span>
                </div>

                {/* ⬛ CASILLAS PISTA */}
                {trackCells.map(({ r, c }) => {
                  const keyCoord = `${r}-${c}`;

                  const isFuegoPath  = r === 7 && c >= 1 && c <= 5;
                  const isTierraPath = c === 7 && r >= 1 && r <= 5;
                  const isAirePath   = r === 7 && c >= 9 && c <= 13;
                  const isAguaPath   = c === 7 && r >= 9 && r <= 13;

                  const isFuegoStart  = r === 6 && c === 1;
                  const isTierraStart = r === 1 && c === 8;
                  const isAireStart   = r === 8 && c === 13;
                  const isAguaStart   = r === 13 && c === 6;

                  const isSafe = SAFE_SQUARES_SET.has(keyCoord);

                  let cellStyle = "bg-[#0b0e22]/95 border border-cyan-500/25 rounded-[2px] shadow-[inset_0_0_4px_rgba(6,182,212,0.15)]";
                  let badgeContent = null;

                  if (isFuegoPath)  { cellStyle = "bg-amber-500/50 border border-amber-300/80 shadow-[0_0_10px_rgba(245,158,11,0.6)]"; badgeContent = <span className="text-[7px] text-amber-100 font-black">›</span>; }
                  if (isTierraPath) { cellStyle = "bg-emerald-500/50 border border-emerald-300/80 shadow-[0_0_10px_rgba(16,185,129,0.6)]"; badgeContent = <span className="text-[7px] text-emerald-100 font-black">v</span>; }
                  if (isAirePath)   { cellStyle = "bg-cyan-500/50 border border-cyan-300/80 shadow-[0_0_10px_rgba(6,182,212,0.6)]"; badgeContent = <span className="text-[7px] text-cyan-100 font-black">‹</span>; }
                  if (isAguaPath)   { cellStyle = "bg-purple-500/50 border border-purple-300/80 shadow-[0_0_10px_rgba(168,85,247,0.6)]"; badgeContent = <span className="text-[7px] text-purple-100 font-black">^</span>; }

                  if (isFuegoStart)  { cellStyle = "bg-amber-500/80 border-2 border-amber-200 shadow-[0_0_15px_#f59e0b]"; badgeContent = <span className="text-[9px]">🔥</span>; }
                  if (isTierraStart) { cellStyle = "bg-emerald-500/80 border-2 border-emerald-200 shadow-[0_0_15px_#10b981]"; badgeContent = <span className="text-[9px]">⛰️</span>; }
                  if (isAireStart)   { cellStyle = "bg-cyan-500/80 border-2 border-cyan-200 shadow-[0_0_15px_#06b6d4]"; badgeContent = <span className="text-[9px]">🌬️</span>; }
                  if (isAguaStart)   { cellStyle = "bg-purple-500/80 border-2 border-purple-200 shadow-[0_0_15px_#a855f7]"; badgeContent = <span className="text-[9px]">💧</span>; }

                  if (isSafe && !isFuegoStart && !isTierraStart && !isAireStart && !isAguaStart) {
                    cellStyle = "bg-gradient-to-br from-amber-950/90 to-yellow-900/50 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.5)]";
                    badgeContent = <Star size={10} className="text-amber-300 animate-pulse fill-amber-300/60" />;
                  }

                  return (
                    <div
                      key={keyCoord}
                      style={{ gridColumn: c + 1, gridRow: r + 1 }}
                      className={`relative flex items-center justify-center ${cellStyle}`}
                    >
                      {badgeContent}
                    </div>
                  );
                })}
              </div>

              {/* RENDERING SOCKETS */}
              {activeElements.map((elemConfig, elemIdx) => {
                if (!isSlotActive(elemIdx)) return null;
                const socketsToRender = getBaseSocketsForMode(elemConfig.basePos, gameMode);
                return socketsToRender.map(([r, c], idx) => {
                  const leftPercent = (c / 15) * 100;
                  const topPercent  = (r / 15) * 100;
                  return (
                    <div
                      key={`socket-${elemConfig.id}-${idx}`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: '6.66%',
                        height: '6.66%',
                      }}
                      className="absolute pointer-events-none p-0.5 flex items-center justify-center z-10"
                    >
                      <div className={`w-full h-full rounded-full border-2 ${
                        elemConfig.id === 'Fuego' ? 'border-amber-400/60 shadow-[inset_0_0_8px_rgba(245,158,11,0.4)]' :
                        elemConfig.id === 'Tierra' ? 'border-emerald-400/60 shadow-[inset_0_0_8px_rgba(16,185,129,0.4)]' :
                        elemConfig.id === 'Aire' ? 'border-cyan-400/60 shadow-[inset_0_0_8px_rgba(6,182,212,0.4)]' :
                        'border-purple-400/60 shadow-[inset_0_0_8px_rgba(168,85,247,0.4)]'
                      } bg-black/70`} />
                    </div>
                  );
                });
              })}

              {/* RENDERING FICHAS SEGÚN SIGNO CÁLCULO */}
              {activeElements.map((elemConfig, elemIdx) => {
                if (!isSlotActive(elemIdx)) return null;
                const elemId = elemConfig.id;
                const elemSign = elemConfig.sign;
                const pawnList = pawns[elemId];

                const renderedPositions = new Set();

                return pawnList.map((pos, pIdx) => {
                  if (pos === -1) {
                    const [r, c] = getPawnCoords(elemId, pIdx, pos);
                    const isCurrentTurn = turn === elemIdx;
                    const canMoveThis = isCurrentTurn && mustMove && canReleasePawn(diceValue);

                    const leftPercent = (c / 15) * 100;
                    const topPercent  = (r / 15) * 100;

                    return (
                      <button
                        key={`${elemId}-${pIdx}`}
                        onClick={() => canMoveThis && movePawn(elemIdx, pIdx, diceValue)}
                        disabled={!canMoveThis}
                        style={{
                          left: `${leftPercent}%`,
                          top: `${topPercent}%`,
                          width: '6.66%',
                          height: '6.66%',
                          transition: 'left 0.15s ease-out, top 0.15s ease-out, transform 0.2s ease'
                        }}
                        className={`absolute flex items-center justify-center p-0.5 z-20 ${
                          canMoveThis
                            ? 'scale-130 animate-bounce cursor-pointer z-30'
                            : 'cursor-default'
                        }`}
                      >
                        <div className={`w-full h-full rounded-full border-2 border-white/90 bg-black p-0.5 overflow-hidden flex items-center justify-center ${elemConfig.glow}`}>
                          <ZodiacBadge sign={elemSign} size="xs" zoom={1.45} />
                        </div>
                      </button>
                    );
                  }

                  if (renderedPositions.has(pos)) return null;
                  renderedPositions.add(pos);

                  const stackCount = pawnList.filter(p => p === pos).length;
                  const [r, c] = getPawnCoords(elemId, pIdx, pos);
                  const isCurrentTurn = turn === elemIdx;
                  const canMoveThis = isCurrentTurn && mustMove && (pos + diceValue <= 56);

                  const leftPercent = (c / 15) * 100;
                  const topPercent  = (r / 15) * 100;

                  return (
                    <button
                      key={`${elemId}-stack-${pos}`}
                      onClick={() => canMoveThis && movePawn(elemIdx, pIdx, diceValue)}
                      disabled={!canMoveThis}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: '6.66%',
                        height: '6.66%',
                        transition: 'left 0.15s ease-out, top 0.15s ease-out, transform 0.2s ease'
                      }}
                      className={`absolute flex items-center justify-center p-0.5 z-20 ${
                        canMoveThis
                          ? 'scale-130 animate-bounce cursor-pointer z-30'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        {stackCount > 1 && (
                          <div
                            className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-400 via-cyan-400 to-purple-500 animate-spin opacity-90 blur-[2px]"
                            style={{ animationDuration: '3.5s' }}
                          />
                        )}

                        <div className={`relative w-full h-full rounded-full border-2 border-white/95 bg-black p-0.5 overflow-hidden flex items-center justify-center ${elemConfig.glow} ${
                          stackCount > 1 ? 'shadow-[0_0_30px_rgba(6,182,212,0.9)]' : ''
                        }`}>
                          <ZodiacBadge sign={elemSign} size="xs" zoom={1.45} />
                        </div>

                        {stackCount > 1 && (
                          <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-cyan-500 via-purple-600 to-amber-400 text-black border-2 border-white font-black text-[9px] px-1.5 py-0.2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-bounce z-40 flex items-center gap-0.5">
                            <Zap size={9} className="text-black fill-black" />
                            <span>x{stackCount}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                });
              })}
            </div>
          </div>

          {/* 3. PARTE DE ABAJO: LANZADOR DE DADO MONUMENTAL Y FIJO */}
          <div className="glass-panel p-2.5 border-2 border-cyan-500/40 bg-gradient-to-b from-[#080b18] via-[#050610] to-black shrink-0 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.25)] rounded-2xl">
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[9px] uppercase tracking-widest text-cyan-300 font-extrabold text-center">
              <span>
                {mustMove ? "⚡ ¡VARIAS GEMAS DISPONIBLES: TOCA LA QUE DESEAS MOVER!" : turn === myPlayerIndex ? "👉 MUEVES TÚ: LANZA EL DADO" : `ESPERANDO A ${activeElements[turn].id.toUpperCase()}...`}
              </span>
              {turn === myPlayerIndex && !mustMove && !isMoving && !isRolling && (
                <span className="hidden sm:inline-block bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1.5 py-0.2 rounded text-[8px] font-mono">
                  [ESPACIO]
                </span>
              )}
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || isMoving || mustMove || (isSlotBot(turn)) || winner}
              style={{ minWidth: '7rem', minHeight: '7rem', maxWidth: '7rem', maxHeight: '7rem' }}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 flex flex-col items-center justify-center shadow-[0_0_45px_rgba(6,182,212,0.5)] transition-colors duration-200 select-none overflow-hidden relative ${
                isRolling ? 'border-cyan-300 bg-gradient-to-b from-cyan-900/60 to-black shadow-[0_0_50px_rgba(6,182,212,0.7)]' :
                (!isSlotBot(turn)) && !mustMove && !isMoving
                  ? 'btn-mystic cursor-pointer border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.6)] bg-gradient-to-b from-cyan-600/30 via-purple-900/40 to-black'
                  : 'bg-black/80 border-white/10 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-amber-500/10 pointer-events-none" />

              <div className="w-full h-full flex flex-col items-center justify-center p-1 relative z-10">
                {diceValue ? (
                  <span className="mystic-font text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_16px_#06b6d4] leading-none">
                    {diceValue}
                  </span>
                ) : (
                  <Dices size={42} className="text-cyan-400 animate-pulse drop-shadow-[0_0_12px_#06b6d4]" />
                )}
                
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-cyan-200 font-black mt-1 leading-none drop-shadow">
                  {isRolling ? "GIRANDO..." : isMoving ? "MOVIENDO..." : diceValue ? "TIRADO" : "LANZAR [ESPACIO]"}
                </span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ── VENTANA EMERGENTE DE VICTORIA ASTRAL ── */}
      {winner && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/90 backdrop-blur-2xl p-4 flex items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 border-cyan-400/60 bg-gradient-to-b from-[#0c0e24] via-[#060814] to-black shadow-[0_0_80px_rgba(6,182,212,0.7)] text-center space-y-5">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -z-10 animate-pulse" />

            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Trophy size={48} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-extrabold">
                ¡VICTORIA CÓSMICA ASTRAL!
              </span>
              <h2 className="mystic-font text-2xl sm:text-3xl text-white font-black tracking-wide">
                {activeElements.find(e => e.id === winner)?.id.toUpperCase()} CONQUISTÓ EL ÉTER
              </h2>
              <span className="inline-block bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mt-1">
                {gameMode === 'duelo' ? '⚡ Modo Duelo Rápido (2 Gemas)' : '🌌 Modo Clásico (4 Gemas)'} • {playerCount} Jugadores
              </span>
            </div>

            <div className="flex justify-center my-4">
              <div className="p-2.5 rounded-full bg-gradient-to-tr from-amber-400 via-cyan-400 to-purple-500 shadow-[0_0_40px_rgba(6,182,212,0.8)]">
                <ZodiacBadge
                  sign={activeElements.find(e => e.id === winner)?.sign}
                  size="xl"
                  zoom={1.5}
                  className="w-24 h-24 bg-black border-2 border-white"
                />
              </div>
            </div>

            <p className="text-xs text-gray-300 font-light leading-relaxed">
              Las {gameMode === 'duelo' ? '2' : '4'} gemas astrales del signo <strong className="text-cyan-300 font-bold">{activeElements.find(e => e.id === winner)?.sign}</strong> han ingresado al Núcleo del Éter. ¡Se han acreditado <span className="text-amber-400 font-bold">+{gameMode === 'duelo' ? '50' : '100'} Puntos de Resonancia Astral</span> en tu perfil!
            </p>

            <div className="pt-2">
              <button
                onClick={resetGame}
                className="btn-mystic w-full py-3.5 rounded-xl text-white font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:scale-105 transition-transform"
              >
                <Sparkles size={18} /> CONFIGURAR NUEVA PARTIDA
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
