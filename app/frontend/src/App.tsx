import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import './App.css'

type Role = 'user' | 'assistant'

type Attachment = {
  id: string
  name: string
  size: string
}

type Message = {
  id: string
  role: Role
  content: string
  timestamp: string
  attachments?: Attachment[]
}

const createTimestamp = () =>
  new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const bytesToSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msg-${Math.random().toString(36).slice(2, 10)}`
}

const heroMessages: Message[] = [
  {
    id: makeId(),
    role: 'assistant',
    content:
      'Hola, soy AIxHub: tu workspace todo-en-uno con chat estilo ChatGPT, carga de archivos y generación de presentaciones y reportes interactivos.',
    timestamp: createTimestamp(),
  },
  {
    id: makeId(),
    role: 'assistant',
    content:
      'Puedo leer PDFs, hojas de cálculo o briefs para construir decks, guías o guiones. Comparte tus archivos o describe lo que necesitas y me encargo.',
    timestamp: createTimestamp(),
  },
]

const quickActions = [
  {
    id: 'presentation',
    title: 'Crear presentación',
    description: 'Resume un briefing y diseña un deck section-by-section.',
    prompt:
      'Necesito una presentación de 8 diapositivas sobre la estrategia comercial 2025. Incluye insights accionables y llamados a la acción.',
  },
  {
    id: 'file-analysis',
    title: 'Analizar archivos',
    description: 'Carga PDF o Excel y obtén conclusiones accionables.',
    prompt:
      'Analiza los archivos adjuntos y dame un resumen ejecutivo + backlog de acciones priorizadas.',
  },
  {
    id: 'meeting',
    title: 'Guion de reunión',
    description: 'Convierte notas dispersas en un storytelling claro.',
    prompt:
      'Construye un guion para presentar resultados trimestrales ante el comité. Usa tono ejecutivo y bullets claros.',
  },
]

const capabilityHighlights = [
  {
    label: 'Carga ilimitada',
    detail: 'Arrastra PDFs, CSV, DOCX o presentaciones completas.',
  },
  {
    label: 'Presentaciones on-demand',
    detail: 'Crea decks, guiones y documentos listos para exportar.',
  },
  {
    label: 'Contexto persistente',
    detail: 'Cada chat guarda archivos, decisiones y versiones.',
  },
]

function App() {
  const [messages, setMessages] = useState<Message[]>(heroMessages)
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pendingSize = useMemo(
    () => pendingFiles.reduce((acc, file) => acc + file.size, 0),
    [pendingFiles],
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const persistFiles = (files: File[]) => {
    if (!files.length) return
    setPendingFiles((prev) => [...prev, ...files])
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    persistFiles(files)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files || [])
    persistFiles(files)
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

  const craftAiResponse = (prompt: string, attachments: Attachment[]): string => {
    const wantsPresentation = /presentaci[óo]n|deck|diapositiva/i.test(prompt)
    const hasFiles = attachments.length > 0

    if (wantsPresentation && hasFiles) {
      return 'Voy a leer los archivos que compartiste y armaré una propuesta de presentación con resumen ejecutivo, agenda, storytelling y bullets accionables para cada slide.'
    }

    if (wantsPresentation) {
      return 'Entendido. Prepararé una presentación con narrativa, objetivos, secciones clave y sugerencias visuales. Indícame si necesitas un formato específico.'
    }

    if (hasFiles) {
      return 'Ya estoy analizando los archivos cargados. Te entregaré insights, riesgos detectados y un backlog priorizado en cuanto termine.'
    }

    return 'Registré tu mensaje y comenzaré con el plan de trabajo. Puedes sumar archivos cuando quieras para enriquecer el contexto.'
  }

  const pushMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed && pendingFiles.length === 0) return

    const attachments = buildAttachments(pendingFiles)
    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content: trimmed || '(Archivos adjuntos)',
      timestamp: createTimestamp(),
      attachments,
    }

    pushMessage(userMessage)
    setInput('')
    setPendingFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsThinking(true)

    setTimeout(() => {
      const aiMessage: Message = {
        id: makeId(),
        role: 'assistant',
        content: craftAiResponse(trimmed, attachments),
        timestamp: createTimestamp(),
      }
      pushMessage(aiMessage)
      setIsThinking(false)
    }, 900)
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
  }

  return (
    <div className="app-shell">
      <div className="chat-surface">
        <header className="hero">
          <div>
            <p className="hero-kicker">AIxHub · AI todo-en-uno</p>
            <h1>Chat estilo ChatGPT con carga de archivos y generación de presentaciones</h1>
            <p className="hero-subtitle">
              Centraliza research, documentación y storytelling. Guarda el contexto de cada conversación, itera versiones
              y exporta entregables listos para compartir.
            </p>
          </div>
          <div className="hero-badges">
            {capabilityHighlights.map((item) => (
              <div key={item.label} className="badge-card">
                <span className="badge-label">{item.label}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="actions-grid">
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.id}
              className="action-card"
              onClick={() => handleQuickPrompt(action.prompt)}
            >
              <div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <span>Insertar prompt</span>
            </button>
          ))}
        </section>

        <section className="chat-window">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === 'assistant' ? 'AI' : 'Tú'}</div>
              <div className="bubble">
                <header>
                  <strong>{message.role === 'assistant' ? 'AIxHub' : 'Tú'}</strong>
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

        <section className="composer">
          {pendingFiles.length > 0 && (
            <div className="pending-files">
              <div>
                <strong>Archivos listos</strong>
                <small>{pendingFiles.length} adjunto(s) · {bytesToSize(pendingSize)}</small>
              </div>
              <ul>
                {pendingFiles.map((file) => (
                  <li key={file.name}>
                    <div>
                      <span>{file.name}</span>
                      <small>{bytesToSize(file.size)}</small>
                    </div>
                    <button type="button" onClick={() => removePendingFile(file.name)}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="input-row">
            <label
              className="file-uploader"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
              />
              <p>Arrastra archivos o haz clic para cargar</p>
            </label>

            <textarea
              placeholder="Describe lo que necesitas..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
            />

            <button type="button" className="send" onClick={handleSend} disabled={isThinking}>
              Enviar
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
