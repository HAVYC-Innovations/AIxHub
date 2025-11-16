import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

type ModelKnowledgeCenterProps = {
  role: 'admin' | 'user_pro'
}

type RoleCopy = {
  eyebrow: string
  title: string
  description: string
  dailyList: string[]
  reminders: string[]
}

type KnowledgeAsset = {
  id: string
  name: string
  size: string
  type: string
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, index)
  return `${size.toFixed(1)} ${units[index]}`
}

const makeId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `asset-${Math.random().toString(36).slice(2, 10)}`
}

const copyByRole: Record<ModelKnowledgeCenterProps['role'], RoleCopy> = {
  admin: {
    eyebrow: 'Modelos estratégicos',
    title: 'Memoria corporativa de tu AIxHub',
    description: 'Carga manuales, roadmaps y decks del board para que cada respuesta esté alineada al plan maestro.',
    dailyList: ['OKRs globales', 'Reglas de cumplimiento', 'Gobernanza y flujos de aprobación'],
    reminders: ['Documentos del board prevalecen ante cualquier prompt.', 'La IA cita fuentes internas cada vez que entrega un resumen.', 'Puedes congelar un modelo diario antes de cada junta.'],
  },
  user_pro: {
    eyebrow: 'Modelos personales',
    title: 'Tu copiloto con memoria viva',
    description: 'Entrena un modelo base para tareas recurrentes y otro hiper contextual por cliente o proyecto.',
    dailyList: ['Rutinas operativas', 'Checklists de calidad', 'Macros o prompts favoritos'],
    reminders: ['La IA conserva el moodboard y guías de tono.', 'Cada archivo queda versionado, puedes revertir cuando quieras.', 'Los adjuntos privados nunca salen de tu workspace.'],
  },
}

const ModelKnowledgeCenter = ({ role }: ModelKnowledgeCenterProps) => {
  const [activeModel, setActiveModel] = useState<'daily' | 'custom'>('daily')
  const [assets, setAssets] = useState<KnowledgeAsset[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const roleCopy = copyByRole[role]

  const reminders = useMemo(() => {
    const base: string[] = [...roleCopy.reminders]
    if (assets.length > 0) {
      base.unshift(`La IA ya memoriza ${assets.length} archivo${assets.length === 1 ? '' : 's'} cargado${assets.length === 1 ? '' : 's'}.`)
    } else {
      base.unshift('Todavía no has cargado archivos, pero la IA respetará tus instrucciones fijas.')
    }
    return base
  }, [assets.length, roleCopy.reminders])

  const persistFiles = (files: File[]) => {
    if (!files.length) return
    const mapped = files.map((file) => ({
      id: makeId(),
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || 'Documento',
    }))
    setAssets((prev) => [...prev, ...mapped])
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    persistFiles(Array.from(event.target.files))
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    persistFiles(Array.from(event.dataTransfer.files || []))
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const openFileDialog = () => fileInputRef.current?.click()

  const removeAsset = (id: string) => setAssets((prev) => prev.filter((asset) => asset.id !== id))

  return (
    <section className="model-center" aria-label="Centro de modelos de conocimiento">
      <header className="model-center__header">
        <div>
          <p className="model-center__eyebrow">{roleCopy.eyebrow}</p>
          <h2>{roleCopy.title}</h2>
          <p>{roleCopy.description}</p>
        </div>
        <div className="model-center__badge">
          <strong>{assets.length}</strong>
          <small>archivos cargados</small>
        </div>
      </header>

      <div className="model-center__modes" role="group" aria-label="Tipo de modelo">
        <button
          type="button"
          className={activeModel === 'daily' ? 'active' : ''}
          onClick={() => setActiveModel('daily')}
        >
          Modelo día a día
        </button>
        <button
          type="button"
          className={activeModel === 'custom' ? 'active' : ''}
          onClick={() => setActiveModel('custom')}
        >
          Modelo dedicado
        </button>
      </div>

      <div className="model-center__grid">
        <article className={`model-card ${activeModel === 'daily' ? 'active' : ''}`}>
          <header>
            <span>Rutina base</span>
            <strong>Memoria operativa</strong>
          </header>
          <p>Conecta al instante el estado del plan maestro, responsables y reglas que nunca deben romperse.</p>
          <ul>
            {roleCopy.dailyList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button" className="model-card__action">
            Sincronizar contexto
          </button>
        </article>

        <article className={`model-card dedicated ${activeModel === 'custom' ? 'active' : ''}`}>
          <header>
            <span>Brief infinito</span>
            <strong>Modelo hiper personal</strong>
          </header>
          <p>Carga PDFs, PPT, hojas técnicas o bases de datos exportadas. Todo quedará disponible cada vez que preguntes.</p>

          <div
            className={`model-upload ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.csv"
              multiple
              onChange={handleFileChange}
              hidden
            />
            <p>Arrastra tus archivos aquí o haz clic para buscarlos.</p>
            <small>Formatos soportados: PDF, PPT/PPTX, DOC/DOCX, CSV.</small>
            <button type="button">Cargar archivos</button>
          </div>

          {assets.length > 0 && (
            <ul className="model-upload__list">
              {assets.map((asset) => (
                <li key={asset.id}>
                  <div>
                    <strong>{asset.name}</strong>
                    <small>
                      {asset.type} · {asset.size}
                    </small>
                  </div>
                  <button type="button" onClick={() => removeAsset(asset.id)} aria-label={`Quitar ${asset.name}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="model-center__memory">
        <div>
          <h4>Recordatorios para la IA</h4>
          <p>Todo lo que cargues se fija en memoria y se cita en cada respuesta.</p>
        </div>
        <ul>
          {reminders.map((reminder) => (
            <li key={reminder}>{reminder}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ModelKnowledgeCenter
