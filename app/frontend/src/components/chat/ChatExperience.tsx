import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from 'react'

import AuthModal from '../auth/AuthModal'
import NavigationBar from '../navigation/NavigationBar'
import type { Role } from '../../types/roles'
import { roleLabelMap } from '../../types/roles'

type ModeOption = 'deepthink' | 'search' | 'models'

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

  if (mode === 'models') {
    return 'Opening the model library. I will compare capabilities, latency, and pricing so you can pick the best fit.'
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

const getIsMobileViewport = () =>
  (typeof window !== 'undefined' ? window.innerWidth < 768 : false)

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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => !getIsMobileViewport())
  const [activeMode, setActiveMode] = useState<ModeOption>('deepthink')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole)
  const [isCompactComposer, setIsCompactComposer] = useState(false)
  const [isMobileView, setIsMobileView] = useState(getIsMobileViewport)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const modelMenuRef = useRef<HTMLDivElement | null>(null)

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
      const width = window.innerWidth
      setIsCompactComposer(width < 700)
      setIsMobileView(width < 768)
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  useEffect(() => {
    if (!isMobileView) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobileView])

  useEffect(() => {
    if (!isModelMenuOpen) return undefined
    const handleClick = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isModelMenuOpen])

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
    closeMobileMenuIfNeeded()
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

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsMobileMenuOpen((state) => !state)
      return
    }
    setIsSidebarExpanded((state) => !state)
  }
  const closeMobileMenuIfNeeded = () => {
    if (isMobileView) {
      setIsMobileMenuOpen(false)
    }
  }
  const hasConversation = messages.some((message) => message.role === 'user')
  const showConversationWindow = hasConversation || isThinking
  const showHero = !hasConversation
  const handleModeChange = (mode: ModeOption) => {
    setActiveMode(mode)
  }

  const handleModelMenuSelect = (action: 'add' | 'view') => {
    setIsModelMenuOpen(false)
    console.info(`Model menu action: ${action}`)
  }

  const handleHistorySelect = (conversationId: string) => {
    setActiveConversationId(conversationId)
    closeMobileMenuIfNeeded()
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

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [input])

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
  const navIsExpanded = isMobileView ? true : isSidebarExpanded

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin') => {
    closeMobileMenuIfNeeded()
    setAuthTab(tab)
    setIsAuthOpen(true)
  }

  const closeAuthModal = () => setIsAuthOpen(false)
  const completeSignIn = (nextRole: Role) => {
    setSelectedRole(nextRole)
    setIsAuthOpen(false)
  }

  return (
    <div className="relative flex h-screen min-h-screen bg-[radial-gradient(circle_at_20%_-10%,rgba(68,83,149,0.55),rgba(6,8,12,1)_55%)] text-slate-100">
      {isMobileView && (
        <button
          type="button"
          className={clsx(
            'fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#04060d]/90 text-white shadow-lg backdrop-blur md:hidden',
            isMobileMenuOpen && 'opacity-0 pointer-events-none',
          )}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current" fill="none" strokeWidth={1.8}>
            <path d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <div
        className={clsx(
          'z-40 transition-transform duration-300 md:static md:translate-x-0 md:shadow-none',
          isMobileView
            ? [
                'fixed inset-y-0 left-0 w-[280px] max-w-[80vw] shadow-2xl',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
              ]
            : ''
        )}
      >
        <NavigationBar
          isExpanded={navIsExpanded}
          onToggle={toggleSidebar}
          onNewChat={handleNewChat}
          onProfileClick={() => openAuthModal('signin')}
          onSelectHistoryEntry={handleHistorySelect}
          activeHistoryId={activeConversationId}
          historyEntries={historyEntries}
          profileCard={navigationProfileCard}
          emptyState="No chats yet"
        />
      </div>

      {isMobileView && isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <section
        className={clsx(
          'flex flex-1 flex-col items-center gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-12',
          showHero ? 'overflow-y-auto' : 'overflow-hidden',
        )}
      >
        {showHero && (
          <header className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl text-night-900">
              △
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{roleLabelMap[selectedRole]}</p>
            <h1 className="text-3xl font-semibold text-white sm:text-5xl">{headline}</h1>
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">{subheadline}</p>
          </header>
        )}

        {showConversationWindow && (
          <section
            className="flex-1 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-4 shadow-pane backdrop-blur sm:rounded-4xl sm:p-6"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {messages.map((message) => {
                  const isUser = message.role === 'user'
                  return (
                    <article
                      key={message.id}
                      className={clsx(
                        'flex w-full',
                        isUser ? 'justify-end text-right' : 'justify-start text-left',
                      )}
                    >
                      <div
                        className={clsx(
                          'relative flex max-w-full flex-col rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[80%]',
                          isUser
                            ? 'border-sky-500/30 bg-[#03050c]/90 text-slate-100'
                            : 'border-white/10 bg-white/5 text-slate-100',
                        )}
                      >
                        <header
                          className={clsx(
                            'mb-1 flex items-center gap-2 text-xs font-semibold',
                            isUser ? 'text-sky-200' : 'text-indigo-200',
                          )}
                        >
                          <span>{isUser ? 'You' : 'AIxHub'}</span>
                          {!isUser && (
                            <span className="text-[11px] font-normal text-slate-400">{message.timestamp}</span>
                          )}
                        </header>
                        <p className="break-words whitespace-pre-wrap text-sm text-slate-100 sm:text-base">{message.content}</p>
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
                  <div className="flex w-full justify-start">
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
              </div>
            </div>
          </section>
        )}

  <section className="w-full max-w-3xl rounded-3xl border border-white/8 bg-[#05070f]/85 p-5 shadow-pane backdrop-blur sm:rounded-4xl sm:p-6">

          <div
            className={clsx(
              'rounded-3xl border border-white/10 bg-[#03050c]/80 shadow-inner transition sm:rounded-[30px]',
              isThinking && 'border-transparent bg-gradient-to-r from-sky-400 via-fuchsia-500 to-amber-400 bg-[length:200%_200%] p-[2px] animate-rainbow',
            )}
          >
            <div
              className={clsx(
                'flex flex-col gap-3 rounded-[24px] px-4 py-4 sm:flex-row sm:items-end sm:gap-4 sm:px-5',
                isThinking && 'border border-white/10 bg-[#03050c]/95',
              )}
            >
              <textarea
                ref={textareaRef}
                className="min-h-10 flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none sm:text-base"
                placeholder={`Message ${
                  activeMode === 'deepthink' ? 'AIxHub' : activeMode === 'search' ? 'Search' : 'Models'
                }`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
              />

              <div className="flex items-center gap-2 self-end sm:gap-2.5">
                {attachmentsEnabled && (
                  <>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} hidden />
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 text-slate-200 transition hover:border-sky-400/60 hover:text-white"
                      onClick={openFilePicker}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      aria-label="Attach files"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        role="presentation"
                        focusable="false"
                        className="h-4 w-4 stroke-current"
                        fill="none"
                        strokeWidth={1.8}
                      >
                        <path d="M7 13l6.5-6.5a3.5 3.5 0 015 5L10 20a4.5 4.5 0 11-6.364-6.364L14 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-night-900 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSend}
                  disabled={isThinking || limitReached}
                  aria-label={limitReached ? 'Prompt limit reached' : 'Send prompt'}
                >
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false" className="h-4 w-4 fill-none stroke-current stroke-2">
                      <path d="M5 12h12.5M14.5 7l5 5-5 5" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          

          {attachmentsEnabled && pendingFiles.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2.5 text-sm">
              {pendingFiles.map((file) => (
                <li key={file.name} className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
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

          <div className="mt-5 flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className={clsx(
                'w-full rounded-full border border-white/15 px-4 py-2 tracking-[0.25em] transition sm:w-auto sm:px-6',
                activeMode === 'deepthink'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-night-900 shadow-lg'
                  : 'text-slate-300 hover:text-white',
              )}
              onClick={() => handleModeChange('deepthink')}
            >
              DeepThink
            </button>

            <div ref={modelMenuRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-full border border-white/15 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-indigo-400/40 sm:min-w-[170px]"
                onClick={() => setIsModelMenuOpen((state) => !state)}
                aria-haspopup="menu"
                aria-expanded={isModelMenuOpen}
              >
                Models
                <svg
                  viewBox="0 0 24 24"
                  className={clsx('h-4 w-4 transition-transform', isModelMenuOpen ? 'rotate-180' : 'rotate-0')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isModelMenuOpen && (
                <div className="absolute right-0 top-12 z-10 w-48 rounded-3xl border border-white/10 bg-[#090d18]/95 p-2 shadow-xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                    onClick={() => handleModelMenuSelect('add')}
                  >
                    Add model
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                    onClick={() => handleModelMenuSelect('view')}
                  >
                    View models
                  </button>
                </div>
              )}
            </div>
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
