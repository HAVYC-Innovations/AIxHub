import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from 'react'

import AuthModal from '../auth/AuthModal'
import NavigationBar from '../navigation/NavigationBar'
import type { Role } from '../../types/roles'
import { roleLabelMap } from '../../types/roles'
import ModelSelector from './ModelSelector'
import { DEFAULT_MODEL_ID, MODEL_LIBRARY, getModelPalette, type ThemePalette } from './modelThemes'

type ModeOption = 'default' | 'deepthink' | 'search' | 'models'

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

  if (mode === 'deepthink') {
    return 'DeepThink activado. Estoy ejecutando una pasada de razonamiento antes de compartir la respuesta final.'
  }

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
  const [activeMode, setActiveMode] = useState<ModeOption>('default')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole)
  const [isCompactComposer, setIsCompactComposer] = useState(false)
  const [isMobileView, setIsMobileView] = useState(getIsMobileViewport)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID)
  const [customColor, setCustomColor] = useState('#3b82f6')
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId)
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation])
  const selectedModel = useMemo(
    () => MODEL_LIBRARY.find((model) => model.id === selectedModelId) ?? MODEL_LIBRARY[0],
    [selectedModelId],
  )
  const activeTheme: ThemePalette = useMemo(
    () => getModelPalette(selectedModel, customColor),
    [selectedModel, customColor],
  )

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
  const isPostFirstMessage = hasConversation
  const showConversationWindow = hasConversation || isThinking
  const showHero = !hasConversation
  const composerTargetLabel = activeMode === 'search' ? 'Search' : activeMode === 'models' ? 'Models' : 'AIxHub'

  const syncModeChange = (mode: ModeOption) => {
    if (mode === 'deepthink') {
      console.info('DeepThink enabled: trigger backend reasoning mode.')
    } else {
      console.info(`Composer mode set to ${mode}.`)
    }
  }

  const handleModeChange = (mode: ModeOption) => {
    setActiveMode((current) => {
      const nextMode = current === mode ? 'default' : mode
      syncModeChange(nextMode)
      return nextMode
    })
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
  }

  const handleCustomColorPick = (hex: string) => {
    setCustomColor(hex)
    setSelectedModelId('custom')
  }

  const handleAddModel = () => {
    console.info('TODO: open modal to create a new personalized model.')
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
    <div
      className="relative flex h-screen min-h-screen bg-[#02030a] text-slate-100"
      style={{ background: activeTheme.background }}
    >
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
            className="flex-1 w-full max-w-3xl overflow-hidden rounded-3xl border p-4 shadow-pane backdrop-blur sm:rounded-4xl sm:p-6"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.chatPanel }}
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
                        className="relative flex max-w-full flex-col rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[80%]"
                        style={
                          isUser
                            ? {
                                borderColor: activeTheme.accentFrom,
                                backgroundImage: `linear-gradient(135deg, ${activeTheme.accentFrom}33, ${activeTheme.accentTo}66)`,
                                color: '#f8fbff',
                              }
                            : {
                                borderColor: activeTheme.border,
                                backgroundColor: activeTheme.composerPanel,
                              }
                        }
                      >
                        <header
                          className={clsx(
                            'mb-1 flex items-center gap-2 text-xs font-semibold',
                            isUser ? 'text-sky-200' : 'text-indigo-200',
                          )}
                        >
                          <span>{isUser ? 'You' : 'AIxHub'}</span>
                          {!isUser && (
                            <span className="text-[11px] font-normal" style={{ color: activeTheme.mutedText }}>
                              {message.timestamp}
                            </span>
                          )}
                        </header>
                        <p className="break-words whitespace-pre-wrap text-sm text-slate-100 sm:text-base">{message.content}</p>
                        {!!message.attachments?.length && (
                          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                            {message.attachments.map((file) => (
                              <li
                                key={file.id}
                                className="flex items-center gap-2 rounded-2xl border px-3 py-1"
                                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.pillBg }}
                              >
                                <span>{file.name}</span>
                                <small style={{ color: activeTheme.mutedText }}>{file.size}</small>
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
                    <div
                      className="flex gap-2 rounded-3xl border px-4 py-3"
                      style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.pillBg }}
                    >
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="h-2 w-2 rounded-full animate-pulse-dot"
                          style={{
                            backgroundColor: activeTheme.accentFrom,
                            animationDelay: `${dot * 150}ms`,
                          }}
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

        <section
          className="w-full max-w-3xl rounded-3xl border p-5 shadow-pane backdrop-blur sm:rounded-4xl sm:p-6"
          style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.composerPanel }}
        >

          <div
            className={clsx(
              'rounded-3xl border shadow-inner transition sm:rounded-[30px]',
              isThinking && 'bg-[length:200%_200%] p-[2px] animate-rainbow',
            )}
            style={{
              borderColor: activeTheme.border,
              backgroundColor: activeTheme.composerPanel,
              ...(isThinking && {
                backgroundImage: `linear-gradient(120deg, ${activeTheme.accentFrom}, ${activeTheme.accentTo})`,
              }),
            }}
          >
            <div
              className={clsx(
                'flex flex-col gap-3 rounded-[24px] px-4 py-4 sm:flex-row sm:items-end sm:gap-4 sm:px-5',
                isPostFirstMessage && 'py-3 sm:px-4',
                isThinking && 'border',
              )}
              style={{
                borderColor: isThinking ? activeTheme.border : 'transparent',
                backgroundColor: isThinking ? '#03050c' : 'transparent',
              }}
            >
              <textarea
                ref={textareaRef}
                className="min-h-10 flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none sm:text-base"
                placeholder={`Message ${composerTargetLabel}`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
              />

              <div className={clsx('flex items-center gap-2 self-end sm:gap-2.5', isPostFirstMessage && 'gap-1.5 sm:gap-2')}>
                {attachmentsEnabled && (
                  <>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} hidden />
                    <button
                      type="button"
                      className={clsx(
                        'flex items-center justify-center border text-slate-200 transition',
                        isPostFirstMessage ? 'h-9 w-9 rounded-xl' : 'h-10 w-10 rounded-2xl',
                      )}
                      onClick={openFilePicker}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      aria-label="Attach files"
                      style={{
                        borderColor: activeTheme.border,
                        backgroundColor: isPostFirstMessage ? activeTheme.pillBg : 'transparent',
                        color: activeTheme.pillText,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        role="presentation"
                        focusable="false"
                        className={clsx('stroke-current', isPostFirstMessage ? 'h-3.5 w-3.5' : 'h-4 w-4')}
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
                  className={clsx(
                    'flex items-center justify-center text-night-900 transition disabled:cursor-not-allowed disabled:opacity-60',
                    isPostFirstMessage ? 'h-9 w-9 rounded-xl' : 'h-10 w-10 rounded-2xl',
                  )}
                  onClick={handleSend}
                  disabled={isThinking || limitReached}
                  aria-label={limitReached ? 'Prompt limit reached' : 'Send prompt'}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${activeTheme.accentFrom}, ${activeTheme.accentTo})`,
                  }}
                >
                  <span aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      role="presentation"
                      focusable="false"
                      className={clsx('fill-none stroke-current stroke-2', isPostFirstMessage ? 'h-3.5 w-3.5' : 'h-4 w-4')}
                    >
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
                <li
                  key={file.name}
                  className="flex items-center gap-1.5 rounded-2xl border px-3 py-1"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.pillBg }}
                >
                  <span className="font-medium text-white">{file.name}</span>
                  <small style={{ color: activeTheme.mutedText }}>{bytesToSize(file.size)}</small>
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
                'w-full rounded-full border px-4 py-2 tracking-[0.25em] transition sm:w-auto sm:px-6',
                activeMode === 'deepthink'
                  ? 'text-night-900 shadow-lg'
                  : 'text-slate-300 hover:text-white',
              )}
              onClick={() => handleModeChange('deepthink')}
              style={
                activeMode === 'deepthink'
                  ? {
                      borderColor: 'transparent',
                      backgroundImage: `linear-gradient(135deg, ${activeTheme.accentFrom}, ${activeTheme.accentTo})`,
                    }
                  : {
                      borderColor: activeTheme.border,
                      color: activeTheme.pillText,
                    }
              }
            >
              DeepThink
            </button>
            <ModelSelector
              palette={activeTheme}
              selectedModelId={selectedModelId}
              customColor={customColor}
              onSelectModel={handleModelSelect}
              onPickCustomColor={handleCustomColorPick}
              onAddModel={handleAddModel}
            />
          </div>

          {typeof promptLimit === 'number' && (
            <p
              className={clsx('mt-3 text-sm', limitReached ? 'text-rose-300' : '')}
              style={!limitReached ? { color: activeTheme.mutedText } : undefined}
            >
              {limitReached
                ? 'Prompt limit reached in guest mode. Create an account for unlimited sessions.'
                : `${promptsRemaining} prompt${promptsRemaining === 1 ? '' : 's'} remaining in this workspace.`}
            </p>
          )}
        </section>

        {knowledgeCenterSlot && (
          <div
            className="mt-10 w-full max-w-4xl rounded-3xl border p-6 shadow-pane"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.chatPanel }}
          >
            {knowledgeCenterSlot}
          </div>
        )}
      </section>

      <AuthModal open={isAuthOpen} defaultTab={authTab} onClose={closeAuthModal} onComplete={completeSignIn} />
    </div>
  )
}

export default ChatExperience
