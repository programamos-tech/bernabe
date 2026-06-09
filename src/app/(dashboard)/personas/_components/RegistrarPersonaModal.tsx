"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NuevaPersonaClient from "../nuevo/NuevaPersonaClient";

export function RegistrarPersonaModal({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered?: (personaId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div className="fixed inset-0 min-h-[100dvh] w-full bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-[1] flex max-h-[min(96dvh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#111111] sm:rounded-2xl"
        role="dialog"
        aria-labelledby="registrar-persona-modal-title"
        aria-modal="true"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <NuevaPersonaClient
            embedded
            initialPersonalModalOpen
            onCancel={onClose}
            onRegistered={(personaId) => {
              onRegistered?.(personaId);
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
