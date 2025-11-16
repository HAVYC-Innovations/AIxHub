import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from 'react'

import AuthModal from '../auth/AuthModal'
import NavigationBar from '../navigation/NavigationBar'
import type { Role } from '../../types/roles'
import { roleLabelMap } from '../../types/roles'

type ModeOption = 'deepthink' | 'search'

type Attachment = {
  id: string
  name: string
  size: string
}

type Message = {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: string
  attachments?: Attachment[]
}

type Conversation = {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export type ChatExperienceProps = {
  role: Role
  headline: string
  subheadline: string
  attachmentsEnabled?: boolean
  promptLimit?: number
  introMessages?: string[]
  knowledgeCenterSlot?: ReactNode
}

const createTimestamp = () =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const bytesToSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, index)
  return `${size.toFixed(1)} ${units[index]}`
}

const makeId = () => {
  const safeCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (safeCrypto?.randomUUID) return safeCrypto.randomUUID()
  return `msg-${Math.random().toString(36).slice(2, 10)}`
}

const hydrateIntroMessages = (introMessages: string[]): Message[] =>
  introMessages.map((content) => ({
    id: makeId(),
    role: 'assistant' as const,
    content,
    timestamp: createTimestamp(),
  }))

const makeConversation = (introMessages: string[]): Conversation => ({
  id: makeId(),
  title: 'New chat',
  messages: hydrateIntroMessages(introMessages),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const formatHistoryTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))

const craftAiResponse = (prompt: string, attachments: Attachment[], role: Role, mode: ModeOption) => {
  const wantsPresentation = /presentation|deck|slides?/i.test(prompt)
  const wantsSummary = /summary|analy|insight|report/i.test(prompt)
  const hasFiles = attachments.length > 0

  if (mode === 'search') {
    return 'Launching a quick research sweep. I will blend fresh sources with our context and report back with references.'
  }

  if (role === 'guest') {
    return 'I captured your request. To unlock more prompts and file uploads, sign in or upgrade when you are ready.'
  }

  if (wantsPresentation && hasFiles) {
    return 'I will read the files you shared and outline a slide-by-slide narrative with talking points, next steps, and visuals.'
  }

  if (wantsPresentation) {
    return 'Understood. I will prepare a presentation blueprint with objectives, sections, and storytelling angles.'
  }

  if (wantsSummary || hasFiles) {
    return 'Give me a moment to synthesize the context. I will return with an executive summary, risks, and prioritized backlog.'
  }

  return 'Message received. I will start drafting the work plan and keep the chat updated as I progress.'
}

const ChatExperience = (props: ChatExperienceProps) => {
  const {
    role: initialRole,
    headline,
    subheadline,
    attachmentsEnabled = true,
    promptLimit,
    introMessages: introMessagesProp,
    knowledgeCenterSlot,
  } = props
  const introMessages = useMemo(
    () => (introMessagesProp ? [...introMessagesProp] : []),
    [introMessagesProp],
  )
  const [conversations, setConversations] = useState<Conversation[]>(() => [makeConversation(introMessages)])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [promptCount, setPromptCount] = useState(0)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [activeMode, setActiveMode] = useState<ModeOption>('deepthink')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole)
  const [isCompactComposer, setIsCompactComposer] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId)
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation])

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    setSelectedRole(initialRole)
  }, [initialRole])

  useEffect(() => {
    const freshConversation = makeConversation(introMessages)
    setConversations([freshConversation])
    setActiveConversationId(freshConversation.id)
    setPendingFiles([])
    setPromptCount(0)
    setInput('')
  }, [selectedRole, introMessages])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const updateLayout = () => {
      setIsCompactComposer(window.innerWidth < 700)
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  const promptsRemaining = typeof promptLimit === 'number' ? Math.max(promptLimit - promptCount, 0) : undefined
  const limitReached = typeof promptLimit === 'number' && promptsRemaining === 0

  const persistFiles = (files: File[]) => {
    if (!attachmentsEnabled || files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files])
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    persistFiles(Array.from(event.target.files))
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    persistFiles(Array.from(event.dataTransfer.files || []))
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
  }

  const removePendingFile = (name: string) => {
    setPendingFiles((current) => current.filter((file) => file.name !== name))
  }

  const buildAttachments = (files: File[]): Attachment[] =>
    files.map((file) => ({
      id: makeId(),
      name: file.name,
      size: bytesToSize(file.size),
    }))

  const pushMessage = (message: Message) => {
    setConversations((prev) => {
      const fallbackId = prev[0]?.id
      const targetId = prev.some((conversation) => conversation.id === activeConversationId)
        ? activeConversationId
        : fallbackId

      return prev.map((conversation) => {
        if (conversation.id !== targetId) return conversation
        const nextMessages = [...conversation.messages, message]
        const nextTitle =
          conversation.title === 'New chat' && message.role === 'user' && message.content.trim().length > 0
            ? message.content.length > 60
              ? `${message.content.slice(0, 57)}…`
              : message.content
            : conversation.title
        return {
          ...conversation,
          title: nextTitle,
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        }
      })
    })
  }

  const resetInputState = () => {
    setInput('')
    setPendingFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNewChat = () => {
  const freshConversation = makeConversation(introMessages)
  setConversations((prev) => [freshConversation, ...prev])
  setActiveConversationId(freshConversation.id)
  setPromptCount(0)
  setPendingFiles([])
  setInput('')
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if ((trimmed === '' && pendingFiles.length === 0) || limitReached) return

    const attachments = attachmentsEnabled ? buildAttachments(pendingFiles) : []

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content: trimmed || (attachments.length ? '(Files attached)' : ''),
      timestamp: createTimestamp(),
      attachments,
    }

    pushMessage(userMessage)
    resetInputState()
    setIsThinking(true)
    setPromptCount((count) => count + 1)

    setTimeout(() => {
      const aiMessage: Message = {
        id: makeId(),
        role: 'assistant',
        content: craftAiResponse(trimmed, attachments, selectedRole, activeMode),
        timestamp: createTimestamp(),
      }
      pushMessage(aiMessage)
      setIsThinking(false)
    }, 900)
  }

  const historyEntries = useMemo(() => {
    return conversations.slice(0, 8).map((conversation) => ({
      id: conversation.id,
      title:
        conversation.title === 'New chat'
          ? 'Untitled chat'
          : conversation.title,
      timestamp: formatHistoryTimestamp(conversation.updatedAt),
    }))
  }, [conversations])

  const toggleSidebar = () => setIsSidebarExpanded((state) => !state)
  const hasConversation = messages.some((message) => message.role === 'user')
  const showConversationWindow = hasConversation || isThinking
  const handleModeChange = (mode: ModeOption) => {
    setActiveMode(mode)
  }

  const handleHistorySelect = (conversationId: string) => {
    setActiveConversationId(conversationId)
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isCompactComposer) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const profileCard = selectedRole === 'guest'
    ? { name: 'Guest', subtitle: 'Preview mode', cta: 'Access' }
    : {
        name: selectedRole === 'admin' ? 'Administrator' : 'Workspace member',
        subtitle: 'Account center',
        cta: 'Manage',
      }
  const profileInitials = profileCard.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
  const navigationProfileCard = {
    initials: profileInitials,
    name: profileCard.name,
    subtitle: profileCard.subtitle,
    cta: profileCard.cta,
  }

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthTab(tab)
    setIsAuthOpen(true)
  }

  const closeAuthModal = () => setIsAuthOpen(false)
  const completeSignIn = (nextRole: Role) => {
    setSelectedRole(nextRole)
    setIsAuthOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_20%_-10%,rgba(68,83,149,0.55),rgba(6,8,12,1)_55%)] text-slate-100">
      <NavigationBar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
        onProfileClick={() => openAuthModal('signin')}
        onSelectHistoryEntry={handleHistorySelect}
        activeHistoryId={activeConversationId}
        historyEntries={historyEntries}
        profileCard={navigationProfileCard}
        emptyState="No chats yet"
      />

      <section className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-10 lg:px-12">
        <header className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl text-night-900">
            △
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{roleLabelMap[selectedRole]}</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">{headline}</h1>
          <p className="max-w-2xl text-lg text-slate-300">{subheadline}</p>
        </header>

        {showConversationWindow && (
          <section className="mt-10 w-full max-w-3xl space-y-6 rounded-4xl border border-white/5 bg-white/5 p-6 shadow-pane backdrop-blur">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              return (
                <article
                  key={message.id}
                  className={clsx('flex w-full gap-4', isUser ? 'flex-row-reverse text-right' : 'text-left')}
                >
                  <div
                    className={clsx(
                      'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
                      isUser ? 'bg-sky-500/20 text-sky-200' : 'bg-indigo-500/20 text-indigo-200',
                    )}
                  >
                    {isUser ? 'You' : 'AI'}
                  </div>
                  <div
                    className={clsx(
                      'flex max-w-[80%] flex-col rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow-sm',
                      isUser ? 'border-sky-500/30 bg-night-900/70 text-slate-100' : 'border-white/10 bg-white/5 text-slate-100',
                    )}
                  >
                    <header className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                      <strong className="font-semibold text-white">{isUser ? 'You' : 'AIxHub'}</strong>
                      <span>{message.timestamp}</span>
                    </header>
                    <p className="whitespace-pre-wrap text-base text-slate-100">{message.content}</p>
                    {!!message.attachments?.length && (
                      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                        {message.attachments.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1"
                          >
                            <span>{file.name}</span>
                            <small className="text-slate-400">{file.size}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              )
            })}
            {isThinking && (
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                  AI
                </div>
                <div className="flex gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 rounded-full bg-white/70 opacity-80 animate-pulse-dot"
                      style={{ animationDelay: `${dot * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </section>
        )}

        <section className="mt-10 w-full max-w-3xl rounded-4xl border border-white/10 bg-night-900/70 p-6 shadow-pane backdrop-blur">
          <div className="mb-4 flex flex-col text-left text-sm text-slate-400">
            <span className="text-base font-semibold text-white">AIxHub</span>
            <span>How can I help you?</span>
          </div>

          <div
            className={clsx(
              'rounded-3xl border border-white/10 bg-[#03050c]/80 shadow-inner transition',
              isThinking && 'border-transparent bg-gradient-to-r from-sky-400 via-fuchsia-500 to-amber-400 bg-[length:200%_200%] p-[2px] animate-rainbow',
            )}
          >
            <div
              className={clsx(
                'flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-end',
                isThinking && 'border border-white/10 bg-[#03050c]/95',
              )}
            >
              <textarea
                className="min-h-[88px] flex-1 resize-none bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
                placeholder={`Message ${activeMode === 'deepthink' ? 'AIxHub' : 'Search'}`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
              />

              <div className="flex items-center gap-3 self-end">
                {attachmentsEnabled && (
                  <>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} hidden />
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-lg text-white transition hover:border-sky-400/60 hover:text-sky-200"
                      onClick={openFilePicker}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      📎
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-night-900 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSend}
                  disabled={isThinking || limitReached}
                  aria-label={limitReached ? 'Prompt limit reached' : 'Send prompt'}
                >
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false" className="h-5 w-5 fill-none stroke-current stroke-2">
                      <path d="M5 12h12.5M14.5 7l5 5-5 5" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            {isCompactComposer
              ? 'Tap the arrow to send. Shift+Enter adds a line break.'
              : 'Press Enter to send. Use Shift+Enter for a new line.'}
          </p>

          {attachmentsEnabled && pendingFiles.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {pendingFiles.map((file) => (
                <li key={file.name} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-sm">
                  <span className="font-medium text-white">{file.name}</span>
                  <small className="text-slate-400">{bytesToSize(file.size)}</small>
                  <button
                    type="button"
                    onClick={() => removePendingFile(file.name)}
                    aria-label={`Remove ${file.name}`}
                    className="text-slate-400 transition hover:text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex gap-3 rounded-3xl border border-white/10 bg-white/5 p-1">
            {(['deepthink', 'search'] as ModeOption[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={clsx(
                  'flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition',
                  mode === activeMode
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-night-900'
                    : 'text-slate-300 hover:text-white',
                )}
                onClick={() => handleModeChange(mode)}
              >
                {mode === 'deepthink' ? 'DeepThink' : 'Search'}
              </button>
            ))}
          </div>

          {typeof promptLimit === 'number' && (
            <p className={clsx('mt-3 text-sm', limitReached ? 'text-rose-300' : 'text-slate-400')}>
              {limitReached
                ? 'Prompt limit reached in guest mode. Create an account for unlimited sessions.'
                : `${promptsRemaining} prompt${promptsRemaining === 1 ? '' : 's'} remaining in this workspace.`}
            </p>
          )}
        </section>

        {knowledgeCenterSlot && (
          <div className="mt-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-pane">
            {knowledgeCenterSlot}
          </div>
        )}
      </section>

      <AuthModal open={isAuthOpen} defaultTab={authTab} onClose={closeAuthModal} onComplete={completeSignIn} />
    </div>
  )
}

export default ChatExperience
