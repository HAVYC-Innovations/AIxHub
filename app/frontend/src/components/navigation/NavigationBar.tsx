import clsx from 'clsx'
import type { ReactNode } from 'react'

export type HistoryEntry = {
  id: string
  title: string
  timestamp: string
}

export type ProfileCard = {
  initials: string
  name: string
  subtitle: string
  cta: string
}

type NavigationBarProps = {
  isExpanded: boolean
  onToggle: () => void
  onNewChat: () => void
  onProfileClick: () => void
  onSelectHistoryEntry?: (id: string) => void
  activeHistoryId?: string
  historyEntries: HistoryEntry[]
  profileCard: ProfileCard
  emptyState?: ReactNode
}

const NavigationBar = ({
  isExpanded,
  onToggle,
  onNewChat,
  onProfileClick,
  onSelectHistoryEntry,
  activeHistoryId,
  historyEntries,
  profileCard,
  emptyState,
}: NavigationBarProps) => {
  const historyIsEmpty = historyEntries.length === 0
  const logoSize = isExpanded ? 'text-lg' : 'text-base'
  const LogoBadge = (
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-night-900 shadow-lg">
      <span className={clsx('font-semibold', logoSize)}>△</span>
    </div>
  )

  return (
    <aside
      className={clsx(
        'flex h-screen min-h-screen flex-col gap-5 border-r border-white/5 bg-[#07090f]/95 text-slate-100 transition-[width,padding] duration-200 ease-out overflow-y-auto',
        isExpanded ? 'w-[300px] px-6 py-8' : 'w-24 items-center px-3 py-8',
      )}
    >
      <div className={clsx('flex w-full items-center gap-3', isExpanded ? 'justify-between' : 'justify-center')}>
        <div className={clsx('flex items-center gap-3', isExpanded ? 'flex-1 justify-center' : 'justify-center')}>
          {isExpanded ? (
            <>
              {LogoBadge}
              <strong className="text-base tracking-[0.2em] text-white">AIxHub</strong>
            </>
          ) : (
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 p-1 transition hover:border-indigo-400/70 hover:bg-indigo-500/10"
              onClick={onToggle}
              aria-label="Expand navigation"
            >
              {LogoBadge}
            </button>
          )}
        </div>
        {isExpanded && (
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-indigo-400/70 hover:bg-indigo-500/10"
            onClick={onToggle}
            aria-label="Collapse navigation"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth={1.8}>
              <path d="M14.5 6l-5 6 5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {isExpanded && (
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-[22px] bg-gradient-to-r from-indigo-500 to-sky-400 px-4 py-3 text-base font-semibold text-night-900 shadow-lg transition hover:from-indigo-400 hover:to-sky-300"
          onClick={onNewChat}
        >
          New chat
        </button>
      )}

      <div className="mt-2 flex w-full flex-1 flex-col gap-3">
        {isExpanded ? (
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Chats</p>
            <ul className="flex flex-1 flex-col gap-3 w-full">
              {historyIsEmpty && (
                <li className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  {emptyState ?? 'No chats yet'}
                </li>
              )}
              {historyEntries.map((entry) => {
                const isActive = entry.id === activeHistoryId
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onSelectHistoryEntry?.(entry.id)}
                      className={clsx(
                        'w-full rounded-2xl border px-3 py-2 text-left transition',
                        isActive
                          ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                          : 'border-white/5 bg-white/5 text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-500/10',
                      )}
                    >
                      <div className="flex flex-col">
                        <strong className="block truncate text-sm font-semibold leading-tight text-white">{entry.title}</strong>
                        <small className="text-xs text-slate-400">{entry.timestamp}</small>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-auto w-full">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10"
            onClick={onProfileClick}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 font-semibold text-night-900">
              {profileCard.initials}
            </div>
            <div className="flex flex-col text-sm">
              <strong className="text-base">{profileCard.name}</strong>
              <span className="text-slate-400">{profileCard.subtitle}</span>
            </div>
            <span className="ml-auto text-sm text-indigo-300">{profileCard.cta}</span>
          </button>
        </div>
      )}
    </aside>
  )
}

export default NavigationBar
