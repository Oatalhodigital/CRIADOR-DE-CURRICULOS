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

  const handleEnhance = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      // Placeholder for AI enhancement - will be implemented later
      // For now, just return the original text
      await new Promise(resolve => setTimeout(resolve, 1000));
      onEnhanced(text);
    } catch (error) {
      console.error('Failed to enhance text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
};

export default AIEnhanceButton;
