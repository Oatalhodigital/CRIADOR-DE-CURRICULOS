'use client'

import { useRef, useEffect, useState } from 'react'
import { Play, Pause } from 'lucide-react'

export default function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
            setIsPlaying(true)
          } else {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-3xl mx-auto mt-10"
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-gray-200"
        style={{ aspectRatio: '16 / 9' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          poster="/videos/demo-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Demonstração de como criar um currículo no site"
        >
          <source src="/videos/demo-curriculo.mp4" type="video/mp4" />
        </video>

        <button
          onClick={togglePlayPause}
          className="absolute bottom-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg transition-colors backdrop-blur-sm"
          aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
