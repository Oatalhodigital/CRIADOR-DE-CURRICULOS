'use client'

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIEnhanceButtonProps {
  text: string;
  context: string;
  onEnhanced: (enhancedText: string) => void;
  className?: string;
}

const AIEnhanceButton = ({
  text,
  context,
  onEnhanced,
  className = '',
}: AIEnhanceButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
  };

  const handleEnhance = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao melhorar texto.');
      }

      const data = await res.json();
      onEnhanced(data.enhanced || text);
    } catch (err) {
      console.error('Failed to enhance text:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
      onEnhanced(text);
    } finally {
      setIsLoading(false);
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
    </div>
  );
};

export default AIEnhanceButton;
