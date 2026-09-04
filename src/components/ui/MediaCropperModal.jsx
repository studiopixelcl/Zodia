"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, RotateCw, ZoomIn, ZoomOut, Move, Sparkles, RefreshCw, Loader2,
  Maximize2, Eye, Sliders
} from 'lucide-react';
import { cropAndExportImage } from '../../lib/media-processor';

/**
 * Modal Interactivo de Recorte Cósmico para Fotografías
 * Estándar: Portrait 3:4 (~3072x4080) y Cuadrado 1:1 (Avatar)
 */
export function MediaCropperModal({
  isOpen,
  imageFile,
  initialAspect = '3:4', // '3:4' | '1:1'
  isAvatar = false,
  onCropComplete,
  onClose
}) {
  const [aspect, setAspect] = useState(initialAspect);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef(0);
  const zoomStartRef = useRef(1);

  // Cargar imagen como URL local al abrir
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      return;
    }
    if (typeof imageFile === 'string') {
      setImageSrc(imageFile);
    } else {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Resetear estados al abrir con nueva imagen o cambiar aspect
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setAspect(initialAspect);
    }
  }, [isOpen, imageFile, initialAspect]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // ── Controles de Arrastre (Mouse y Touch) ───────────────────────────────────
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // ── Touch Gestures (Pan & Pinch to Zoom) ───────────────────────────────────
  const getTouchDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      pinchStartDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      zoomStartRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current > 0) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = dist / pinchStartDistRef.current;
      const newZoom = Math.min(3.5, Math.max(0.8, zoomStartRef.current * factor));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    pinchStartDistRef.current = 0;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3.5, Math.max(0.8, Number((prev + delta).toFixed(2)))));
  };

  // ── Ejecutar Recorte de Alta Calidad ─────────────────────────────────────────
  const handleConfirmCrop = async () => {
    if (!imgRef.current || !containerRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const cropContainer = containerRef.current;
      const containerRect = cropContainer.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      // Calcular la escala de la imagen mostrada respecto a sus píxeles naturales
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      const isRotated90or270 = rotation === 90 || rotation === 270;
      const currentDisplayedWidth = isRotated90or270 ? imgRect.height : imgRect.width;
      const currentDisplayedHeight = isRotated90or270 ? imgRect.width : imgRect.height;

      const scaleX = naturalW / (currentDisplayedWidth / zoom);
      const scaleY = naturalH / (currentDisplayedHeight / zoom);

      // Desplazamiento del área visible respecto a la imagen
      const cropBoxLeft = containerRect.left;
      const cropBoxTop = containerRect.top;
      const cropBoxWidth = containerRect.width;
      const cropBoxHeight = containerRect.height;

      // Coordenadas relativas al contenedor de la imagen rotada
      const relativeLeft = (cropBoxLeft - imgRect.left) * (scaleX / zoom);
      const relativeTop = (cropBoxTop - imgRect.top) * (scaleY / zoom);
      const relativeWidth = cropBoxWidth * (scaleX / zoom);
      const relativeHeight = cropBoxHeight * (scaleY / zoom);

      const targetW = aspect === '1:1' ? 1200 : 1536; // 3:4 Estándar Proporcional a 3072x4080
      const targetH = aspect === '1:1' ? 1200 : 2048;

      const crop = {
        x: Math.max(0, relativeLeft),
        y: Math.max(0, relativeTop),
        width: Math.max(10, relativeWidth),
        height: Math.max(10, relativeHeight)
      };

      const result = await cropAndExportImage({
        img,
        crop,
        rotation,
        targetWidth: targetW,
        targetHeight: targetH,
        quality: 0.88,
        fileName: (imageFile?.name || 'foto_perfil').replace(/\.[^/.]+$/, '')
      });

      await onCropComplete(result.file, result.previewUrl);
      onClose();
    } catch (err) {
      console.error('Error al recortar:', err);
      alert('Hubo un error al procesar el recorte. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#0a0c16] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Cabecera Cósmica */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Encuadre Cósmico de Fotografía
              </h3>
              <p className="text-[10px] text-gray-400">
                {aspect === '3:4' ? 'Estándar Portrait 3:4 (~3072x4080)' : 'Formato Cuadrado 1:1'}
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

        {/* Selector de Relación de Aspecto */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-cyan-300/80 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sliders size={12} /> Proporción:
          </span>
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setAspect('3:4')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                aspect === '3:4'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Portrait 3:4
            </button>
            <button
              type="button"
              onClick={() => setAspect('1:1')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                aspect === '1:1'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Cuadrado 1:1
            </button>
          </div>
        </div>

        {/* ── VISOR DE RECORTE INTERACTIVO ───────────────────────────────────── */}
        <div 
          className="relative flex-1 bg-black flex items-center justify-center overflow-hidden p-4 min-h-[320px] sm:min-h-[380px] max-h-[55vh]"
          onWheel={handleWheel}
        >
          {/* Contenedor del Encuadre Objetivo */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative overflow-hidden cursor-move border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 ${
              aspect === '3:4' ? 'aspect-[3/4] h-[48vh] max-h-[380px]' : 'aspect-square h-[44vh] max-h-[340px]'
            }`}
          >
            {/* Imagen manipulable */}
            <div
              className="absolute inset-0 flex items-center justify-center origin-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Para recortar"
                draggable={false}
                className="max-w-none origin-center pointer-events-none transition-transform duration-75"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  maxHeight: '150%',
                  maxWidth: '150%'
                }}
              />
            </div>

            {/* Rejilla Regla de los Tercios */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-cyan-400" />
              <div className="border-r border-b border-cyan-400" />
              <div className="border-b border-cyan-400" />
              <div className="border-r border-b border-cyan-400" />
              <div className="border-r border-b border-cyan-400" />
              <div className="border-b border-cyan-400" />
              <div className="border-r border-cyan-400" />
              <div className="border-r border-cyan-400" />
              <div />
            </div>

            {/* Guía Circular para Avatar (si aplica) */}
            {isAvatar && (
              <div className="absolute inset-0 pointer-events-none rounded-full border border-amber-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            )}
          </div>

          {/* Badge informativo de control táctil */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-[10px] text-gray-300 flex items-center gap-1.5 shadow pointer-events-none">
            <Move size={11} className="text-cyan-400" /> Arrastra para posicionar • Rueda para zoom
          </div>
        </div>

        {/* ── CONTROLES INFERIORES: ZOOM Y ROTACIÓN ──────────────────────────── */}
        <div className="px-5 py-3.5 bg-black/50 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut size={15} className="text-gray-400 shrink-0" />
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <ZoomIn size={15} className="text-gray-400 shrink-0" />
              <span className="text-[11px] text-cyan-300 font-mono w-9 text-right font-bold">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition flex items-center gap-1 text-xs font-semibold"
                title="Girar 90°"
              >
                <RotateCw size={14} />
                <span className="hidden sm:inline">Girar</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition"
                title="Restablecer"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
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
              onClick={handleConfirmCrop}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl btn-mystic text-white text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Optimizando a WebP...</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-cyan-300 font-bold" />
                  <span>Recortar y Subir</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
