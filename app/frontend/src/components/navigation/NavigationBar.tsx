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

  return (
    <aside
      className={clsx(
        'flex min-h-screen flex-col gap-5 border-r border-white/5 bg-[#07090f]/95 text-slate-100 transition-[width,padding] duration-200 ease-out',
        isExpanded ? 'w-[300px] px-6 py-8' : 'w-24 items-center px-3 py-8',
      )}
    >
      <div className={clsx('flex w-full items-center gap-3', isExpanded ? 'justify-between' : 'justify-center')}>
        <div className={clsx('flex items-center gap-3', isExpanded ? 'flex-1 justify-center' : 'justify-center')}>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-night-900 shadow-lg">
            <span className={clsx('font-semibold', logoSize)}>△</span>
          </div>
          {isExpanded && <strong className="text-base tracking-[0.2em] text-white">AIxHub</strong>}
        </div>
        {isExpanded && (
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white transition hover:border-indigo-400/70 hover:bg-indigo-500/10"
            onClick={onToggle}
            aria-label="Collapse navigation"
          >
            ↩
          </button>
        )}
      </div>

      <button
        type="button"
        className={clsx(
          'flex flex-col items-center justify-center gap-1 rounded-[22px] border border-white/10 bg-white/5 p-4 text-white transition hover:border-indigo-400/60 hover:bg-indigo-500/10',
          isExpanded ? 'w-20 self-center' : 'w-full',
        )}
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="block h-0.5 w-6 rounded-full bg-white" />
        <span className="block h-0.5 w-6 rounded-full bg-white" />
        <span className="block h-0.5 w-6 rounded-full bg-white" />
      </button>

      <button
        type="button"
        className={clsx(
          'flex w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-indigo-500 to-sky-400 px-4 py-3 text-base font-semibold text-night-900 shadow-lg transition hover:from-indigo-400 hover:to-sky-300',
          !isExpanded && 'h-16 w-16 rounded-2xl px-0 py-0 text-2xl',
        )}
        onClick={onNewChat}
      >
        <span>＋</span>
        {isExpanded && <span>New chat</span>}
      </button>

      <div className="mt-2 flex w-full flex-1 flex-col gap-3">
        {isExpanded && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Chats</p>}
        <ul className="flex flex-1 flex-col gap-3 w-full">
          {historyIsEmpty && isExpanded && (
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
                    'w-full rounded-2xl border px-3 py-2 transition',
                    isExpanded
                      ? 'border-white/5 bg-white/5 text-left'
                      : 'border-transparent bg-transparent text-center text-xs',
                    isActive
                      ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                      : 'text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-500/10',
                  )}
                >
                  {isExpanded ? (
                    <div>
                      <strong className="block text-sm font-semibold leading-tight">{entry.title}</strong>
                      <small className="text-xs text-slate-400">{entry.timestamp}</small>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide">{entry.title?.slice(0, 1) ?? '•'}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-auto w-full">
        <button
          type="button"
          className={clsx(
            'flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10',
            !isExpanded && 'flex-col text-center',
          )}
          onClick={onProfileClick}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 font-semibold text-night-900">
            {profileCard.initials}
          </div>
          {isExpanded && (
            <div className="flex flex-col text-sm">
              <strong className="text-base">{profileCard.name}</strong>
              <span className="text-slate-400">{profileCard.subtitle}</span>
            </div>
          )}
          {isExpanded && <span className="ml-auto text-sm text-indigo-300">{profileCard.cta}</span>}
        </button>
      </div>
    </aside>
  )
}

export default NavigationBar
