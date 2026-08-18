"use client";
import React from 'react';
import { SessionProvider } from "next-auth/react";

/**
 * SessionWrapper
 * * Este componente envuelve la aplicación para proveer el contexto de NextAuth.
 * Es necesario que sea un "Client Component" para manejar el estado de la sesión
 * en el navegador del usuario.
 */
export default function SessionWrapper({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}