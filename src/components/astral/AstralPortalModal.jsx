"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * AstralPortalModal
 * Renderiza cualquier ventana flotante directamente en document.body mediante React Portal.
 * Garantiza:
 * 1. Centrado absoluto en cualquier tamaño de pantalla (móvil, tablet, escritorio).
 * 2. Cero cortes o desplazamientos extraños causados por contenedores padres con 'overflow-hidden' o 'transform'.
 * 3. Z-Index superior (z-[99999]), quedando 100% por encima del Nav Inferior y del Header.
 * 4. Control de altura máxima con scroll interno suave (no desborda pantallas cortas).
 * 5. Cierre al pulsar el fondo (backdrop) o con la tecla Escape.
 */
export const AstralPortalModal = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md",
  className = "",
  closeOnBackdropClick = true
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll del documento mientras el modal esté activo
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Cerrar con tecla Escape (solo si closeOnBackdropClick está activo)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose && closeOnBackdropClick) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdropClick]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-xl p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-fadeIn select-none"
      style={{ margin: 0 }}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidth} my-auto rounded-3xl border border-cyan-500/30 bg-[#080b18] p-4 sm:p-6 shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.3)] max-h-[90dvh] overflow-y-auto no-scrollbar text-left ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
