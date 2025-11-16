import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MODEL_LIBRARY, getModelPalette, type ThemePalette } from './modelThemes'

type ModelSelectorProps = {
  palette: ThemePalette
  selectedModelId: string
  customColor: string
  onSelectModel: (modelId: string) => void
  onPickCustomColor: (hex: string) => void
  onAddModel: () => void
}

const ModelSelector = (props: ModelSelectorProps) => {
  const { palette, selectedModelId, customColor, onSelectModel, onPickCustomColor, onAddModel } = props
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selectedModel = useMemo(
    () => MODEL_LIBRARY.find((model) => model.id === selectedModelId) ?? MODEL_LIBRARY[0],
    [selectedModelId],
  )

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-full border bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:opacity-90 sm:min-w-[210px]"
        onClick={() => setIsOpen((state) => !state)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        style={{ borderColor: palette.border, color: palette.pillText }}
      >
        <span className="flex items-center gap-2 text-[10px] font-medium tracking-[0.4em]">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundImage: `linear-gradient(135deg, ${palette.accentFrom}, ${palette.accentTo})` }}
          />
          {selectedModel.name}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={clsx('h-4 w-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-10 w-72 rounded-3xl border border-white/15 bg-[#05070f]/95 p-3 shadow-2xl">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">Modelos</p>
          <ul className="mt-2 space-y-1">
            {MODEL_LIBRARY.map((model) => {
              const modelPalette = getModelPalette(model, customColor)
              const isActive = model.id === selectedModelId
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-xs tracking-normal text-slate-200 transition hover:bg-white/5"
                    style={{ borderColor: isActive ? modelPalette.accentFrom : 'transparent' }}
                    onClick={() => handleSelect(model.id)}
                  >
                    <span
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundImage: `linear-gradient(135deg, ${modelPalette.accentFrom}, ${modelPalette.accentTo})` }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{model.name}</p>
                      <p className="text-[11px] text-slate-400">{model.summary}</p>
                    </div>
                    {isActive && <span className="text-[12px] text-white">●</span>}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 rounded-2xl border border-white/10 px-3 py-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">
            Color personalizado
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={(event) => onPickCustomColor(event.target.value)}
              className="h-10 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <p className="text-[11px] text-slate-300">Actualiza el difuminado del fondo.</p>
          </div>
        </div>

          <button
            type="button"
            className="mt-3 w-full rounded-2xl border border-dashed border-white/20 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40"
            onClick={() => {
              onAddModel()
              setIsOpen(false)
            }}
          >
            + Agregar nuevo modelo
          </button>
        </div>
      )}
    </div>
  )
}

export default ModelSelector
