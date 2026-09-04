"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Play, Pause, Video, Sparkles, Check, Loader2, Clock, RotateCcw
} from 'lucide-react';
import { trimAndOptimizeVideo } from '../../lib/media-processor';

/**
 * Modal Interactivo para Selección de Rango (5.0s) y Encuadre de Video
 * Estándar: Portrait 3:4 con duración máxima de 5 segundos
 */
export function VideoCropperModal({
  isOpen,
  videoFile,
  onVideoComplete,
  onClose
}) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const videoRef = useRef(null);
  const TARGET_DURATION = 5.0;

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    setStartTime(0);
    setIsPlaying(false);
    setProgressPercent(0);

    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Manejar metadatos del video
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    videoRef.current.currentTime = 0;
  };

  // Mantener reproducción en bucle dentro de la ventana de 5 segundos
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const endTime = Math.min(duration, startTime + TARGET_DURATION);

    if (current >= endTime) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleConfirmVideo = async () => {
    if (!videoFile || isProcessing) return;
    setIsProcessing(true);
    setProgressPercent(5);

    try {
      const result = await trimAndOptimizeVideo(
        videoFile,
        startTime,
        TARGET_DURATION,
        (pct) => setProgressPercent(pct)
      );

      await onVideoComplete(result.file, result.previewUrl);
      onClose();
    } catch (err) {
      console.error('Error al recortar video:', err);
      alert(err.message || 'Error al procesar el mini video.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !videoUrl) return null;

  const maxStart = Math.max(0, duration - TARGET_DURATION);
  const endTime = Math.min(duration, startTime + TARGET_DURATION);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#0a0c16] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Cabecera */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Video size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Encuadre de Mini Video Astral
              </h3>
              <p className="text-[10px] text-gray-400">
                Selecciona los 5.0 segundos que mejor representen tu vibra
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── VISOR DEL VIDEO EN FORMATO 3:4 ─────────────────────────────────── */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-3 sm:p-4 min-h-[300px] max-h-[50vh]">
          <div className="relative aspect-[3/4] h-[46vh] max-h-[360px] rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-2xl bg-black group">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Overlay de Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 border border-purple-400/50 text-purple-300 flex items-center justify-center hover:scale-110 hover:bg-purple-600 hover:text-white transition shadow-xl"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            {/* Badge de Tiempo en Vivo */}
            <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md border border-purple-400/30 px-2.5 py-0.5 rounded-full text-[10px] text-purple-300 font-extrabold flex items-center gap-1 shadow">
              <Clock size={10} /> 5.0s En bucle
            </div>
          </div>
        </div>

        {/* ── LÍNEA DE TIEMPO INTERACTIVA PARA EL RECORTE DE 5s ─────────────── */}
        <div className="px-5 py-4 bg-black/50 border-t border-white/10 space-y-3">
          {duration > TARGET_DURATION ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Momento a mostrar:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {startTime.toFixed(1)}s - {endTime.toFixed(1)}s de {duration.toFixed(1)}s
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={maxStart}
                step="0.1"
                value={startTime}
                onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-2 bg-white/20 rounded-lg"
              />

              <p className="text-[10px] text-gray-400 text-center">
                Arrastra el control para elegir el mejor segmento de 5 segundos de tu video
              </p>
            </div>
          ) : (
            <div className="text-center py-1 text-xs text-cyan-300 font-medium">
              El video ya dura menos de 5 segundos ({duration.toFixed(1)}s). Se optimizará directamente.
            </div>
          )}

          {/* Barra de progreso de compresión */}
          {isProcessing && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-purple-300 font-semibold">
                <span>Comprimiendo y optimizando mini video...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-200 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition border border-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmVideo}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-white font-bold" />
                  <span>Guardar Mini Video (5s)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
