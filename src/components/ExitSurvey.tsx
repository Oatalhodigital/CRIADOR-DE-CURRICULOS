'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { trackEvent } from '@/lib/gtag';

const REASONS = [
  { id: 'price', label: 'Preço' },
  { id: 'trust', label: 'Não confiei no site' },
  { id: 'complicated', label: 'Muito complicado/demorado' },
  { id: 'just_browsing', label: 'Só estava pesquisando' },
  { id: 'in_app', label: 'Navegador do app atrapalhou' },
  { id: 'other', label: 'Outro motivo' },
];

const STORAGE_KEY = 'exit_survey_dismissed';
const INACTIVITY_MS = 45000;

export default function ExitSurvey({ paid }: { paid: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (paid) return;
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // sessionStorage pode estar desabilitado
    }

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let shown = false;

    const showOnce = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
    };

    const resetInactivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(showOnce, INACTIVITY_MS);
    };

    // Desktop: mouseleave para a barra do navegador
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20) showOnce();
    };

    // Mobile: aba perde foco / fica oculta
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') showOnce();
    };

    const events = ['click', 'touchstart', 'input', 'scroll', 'keydown'];
    events.forEach((name) => document.addEventListener(name, resetInactivity));
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    resetInactivity();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach((name) => document.removeEventListener(name, resetInactivity));
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [paid]);

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    const payload = { reason, comment, url: window.location.href, paid: false };
    trackEvent('exit_feedback', { reason, paid: false });
    try {
      await fetch('/api/exit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // best-effort
    }
    setSubmitted(true);
    setTimeout(dismiss, 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={dismiss}>
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Ajude-nos a melhorar</h3>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <p className="text-emerald-700 bg-emerald-50 rounded-xl p-3 text-sm">Obrigado pelo feedback!</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Antes de você ir, o que fez você não continuar?</p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                    reason === r.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte um pouco mais (opcional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 outline-none mb-4"
              rows={3}
            />
            <button
              onClick={submit}
              disabled={!reason}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
