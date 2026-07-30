'use client'

import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface StepItem<T extends string> {
  id: T
  label: string
  icon: LucideIcon
}

interface StepsNavProps<T extends string> {
  steps: StepItem<T>[]
  currentStep: T
  currentStepIndex: number
  onStepChange: (step: T) => void
}

export default function StepsNav<T extends string>({
  steps,
  currentStep,
  currentStepIndex,
  onStepChange,
}: StepsNavProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollHints = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < maxScroll - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollHints()
    el.addEventListener('scroll', updateScrollHints, { passive: true })
    window.addEventListener('resize', updateScrollHints)

    return () => {
      el.removeEventListener('scroll', updateScrollHints)
      window.removeEventListener('resize', updateScrollHints)
    }
  }, [steps.length])

  // Keep the active step visible without scrolling the page vertically.
  useEffect(() => {
    const container = scrollRef.current
    const active = activeRef.current
    if (!container || !active) return

    const target = active.offsetLeft + active.offsetWidth / 2 - container.clientWidth / 2
    const maxScroll = container.scrollWidth - container.clientWidth
    container.scrollTo({
      left: Math.max(0, Math.min(target, maxScroll)),
      behavior: 'smooth',
    })
    updateScrollHints()
  }, [currentStepIndex])

  return (
    <div className="relative">
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-gray-50 to-transparent"
          aria-hidden="true"
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-gray-50 to-transparent"
          aria-hidden="true"
        />
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Etapas do currículo"
        className="flex items-start flex-nowrap gap-0 overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x px-1 pb-1"
      >
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = index < currentStepIndex

          return (
            <div
              key={step.id}
              ref={isActive ? activeRef : undefined}
              className="flex items-center flex-shrink-0"
            >
              <div className="flex flex-col items-center flex-shrink-0 w-[68px] sm:w-auto sm:min-w-[64px]">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => onStepChange(step.id)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
                <span
                  className={`text-[11px] sm:text-xs mt-2 text-center leading-tight ${
                    isActive ? 'text-emerald-600 font-semibold' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-px mx-1 sm:mx-2 mt-[-18px] flex-shrink-0 ${
                    isCompleted ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
