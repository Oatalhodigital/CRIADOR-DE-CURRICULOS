'use client'

import { useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIEnhanceButtonProps {
  text: string;
  context: string;
  profession?: string;
  onEnhanced: (enhancedText: string) => void;
  className?: string;
  fallback?: () => string;
}

const AIEnhanceButton = ({
  text,
  context,
  profession,
  onEnhanced,
  className = '',
  fallback,
}: AIEnhanceButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const handleEnhance = async () => {
    if (!text.trim()) return;

    // Cancela requisição anterior, se houver
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);
    setInfo(null);

    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context, profession }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao melhorar texto.');
      }

      const data = await res.json();

      if (requestId !== requestIdRef.current) return;

      onEnhanced(data.enhanced || text);
    } catch (err) {
      clearTimeout(timeoutId);

      if (requestId !== requestIdRef.current) return;

      console.error('Failed to enhance text:', err);
      const suggestion = fallback?.();
      if (suggestion && suggestion.trim()) {
        onEnhanced(suggestion);
        setError(null);
        setInfo('Sugestão gerada automaticamente.');
      } else {
        onEnhanced(text);
        setError(null);
        setInfo('A IA está indisponível agora. Você pode editar o texto manualmente.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleEnhance}
        disabled={isLoading || !text.trim()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isLoading || !text.trim()
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md'
        } ${className}`}
        title="Melhorar com IA"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span className="text-xs">IA</span>
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {info && <span className="text-xs text-gray-500">{info}</span>}
    </div>
  );
};

export default AIEnhanceButton;
