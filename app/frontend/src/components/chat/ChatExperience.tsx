import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

import AuthModal from '../auth/AuthModal'
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

export type ChatExperienceProps = {
  role: Role
  headline: string
  subheadline: string
  attachmentsEnabled?: boolean
  promptLimit?: number
  introMessages?: string[]
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
  } = props
  const introMessages = useMemo(
    () => (introMessagesProp ? [...introMessagesProp] : []),
    [introMessagesProp],
  )
  const [messages, setMessages] = useState<Message[]>(() => hydrateIntroMessages(introMessages))
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [promptCount, setPromptCount] = useState(0)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [activeMode, setActiveMode] = useState<ModeOption>('deepthink')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole)
  const [rainbowPulse, setRainbowPulse] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    setSelectedRole(initialRole)
  }, [initialRole])

  useEffect(() => {
    setMessages(hydrateIntroMessages(introMessages))
    setPendingFiles([])
    setPromptCount(0)
  }, [selectedRole, introMessages])

  useEffect(() => {
    if (!rainbowPulse) return undefined
    const timer = window.setTimeout(() => setRainbowPulse(false), 1100)
    return () => window.clearTimeout(timer)
  }, [rainbowPulse])

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
    setMessages((prev) => [...prev, message])
  }

  const resetInputState = () => {
    setInput('')
    setPendingFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNewChat = () => {
    setMessages(hydrateIntroMessages(introMessages))
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
    setRainbowPulse(true)

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
    const entries = messages
      .filter((message) => message.role === 'user' && message.content.trim())
      .map((message) => ({
        id: message.id,
        title: message.content.length > 60 ? `${message.content.slice(0, 57)}…` : message.content,
        timestamp: message.timestamp,
      }))
    return entries.slice(-8).reverse()
  }, [messages])

  const toggleSidebar = () => setIsSidebarExpanded((state) => !state)
  const hasConversation = messages.some((message) => message.role === 'user')
  const showConversationWindow = hasConversation || isThinking
  const handleModeChange = (mode: ModeOption) => {
    setActiveMode(mode)
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
    <div className="minimal-shell">
      <aside className={`chat-sidebar ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo" aria-label="AIxHub logo">
            <span>🜂</span>
            {isSidebarExpanded && <strong>AIxHub</strong>}
          </div>
          <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <span />
            <span />
            <span />
          </button>
        </div>

        <button type="button" className="sidebar-new" onClick={handleNewChat}>
          <span>＋</span>
          {isSidebarExpanded && <p>New chat</p>}
        </button>

        <div className="sidebar-history">
          {isSidebarExpanded && <p>Chats</p>}
          <ul>
            {historyEntries.length === 0 && isSidebarExpanded && <li className="sidebar-empty">No chats yet</li>}
            {historyEntries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <small>{entry.timestamp}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-profile">
          <button type="button" className="profile-card" onClick={() => openAuthModal('signin')}>
            <div className="profile-avatar">{profileInitials}</div>
            {isSidebarExpanded && (
              <div className="profile-copy">
                <strong>{profileCard.name}</strong>
                <small>{profileCard.subtitle}</small>
              </div>
            )}
            {isSidebarExpanded && <span className="profile-cta">{profileCard.cta}</span>}
          </button>
        </div>
      </aside>

      <section className="minimal-main">
        <header className="minimal-hero">
          <div className="hero-logo">🜂</div>
          <p className="hero-role">{roleLabelMap[selectedRole]}</p>
          <h1>{headline}</h1>
          <p className="hero-subcopy">{subheadline}</p>
        </header>

        {showConversationWindow && (
          <section className="minimal-window">
            {messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="avatar">{message.role === 'assistant' ? 'AI' : 'You'}</div>
                <div className="bubble">
                  <header>
                    <strong>{message.role === 'assistant' ? 'AIxHub' : 'You'}</strong>
                    <span>{message.timestamp}</span>
                  </header>
                  <p>{message.content}</p>
                  {!!message.attachments?.length && (
                    <ul className="attachments">
                      {message.attachments.map((file) => (
                        <li key={file.id}>
                          <span>{file.name}</span>
                          <small>{file.size}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
            {isThinking && (
              <div className="thinking">
                <div className="avatar">AI</div>
                <div className="bubble typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </section>
        )}

        <section className={`minimal-composer ${rainbowPulse ? 'rainbow' : ''}`}>
          <div className="composer-brand">
            <span>AIxHub</span>
            <p>How can I help you?</p>
          </div>

          <div className="input-wrapper">
            <textarea
              placeholder={`Message ${activeMode === 'deepthink' ? 'AIxHub' : 'Search'}`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
            />

            <div className="composer-controls">
              {attachmentsEnabled && (
                <>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} hidden />
                  <button type="button" className="icon-button" onClick={openFilePicker} onDrop={handleDrop} onDragOver={handleDragOver}>
                    📎
                  </button>
                </>
              )}
              <button
                type="button"
                className="icon-button primary"
                onClick={handleSend}
                disabled={isThinking || limitReached}
                aria-label={limitReached ? 'Prompt limit reached' : 'Send prompt'}
              >
                ↑
              </button>
            </div>
          </div>

          {attachmentsEnabled && pendingFiles.length > 0 && (
            <ul className="file-chips">
              {pendingFiles.map((file) => (
                <li key={file.name}>
                  <span>{file.name}</span>
                  <small>{bytesToSize(file.size)}</small>
                  <button type="button" onClick={() => removePendingFile(file.name)} aria-label={`Remove ${file.name}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mode-switch">
            {(['deepthink', 'search'] as ModeOption[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={mode === activeMode ? 'active' : ''}
                onClick={() => handleModeChange(mode)}
              >
                {mode === 'deepthink' ? 'DeepThink' : 'Search'}
              </button>
            ))}
          </div>

          {typeof promptLimit === 'number' && (
            <p className={`limit-copy ${limitReached ? 'exhausted' : ''}`}>
              {limitReached
                ? 'Prompt limit reached in guest mode. Create an account for unlimited sessions.'
                : `${promptsRemaining} prompt${promptsRemaining === 1 ? '' : 's'} remaining in this workspace.`}
            </p>
          )}
        </section>
      </section>

      <AuthModal open={isAuthOpen} defaultTab={authTab} onClose={closeAuthModal} onComplete={completeSignIn} />
    </div>
  )
}

export default ChatExperience
