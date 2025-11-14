############################################################
# AIxHub · Workspace todo-en-uno impulsado por IA generativa #
############################################################

AIxHub entrega una experiencia tipo ChatGPT enfocada en productividad empresarial: un único espacio donde conversas con tu copiloto, cargas archivos pesados (PDF, DOCX, CSV, decks) y generas presentaciones, guiones o reportes accionables sin salir del chat.

---

## Panorama rápido

| Módulo     | Stack | Descripción |
|------------|-------|-------------|
| Frontend   | React 19 + Vite 7 + TypeScript | Interfaz tipo ChatGPT con subida de archivos, acciones rápidas y simulación de respuestas mientras se integra con servicios de IA. |
| Backend    | LangChain + LangGraph + Python 3.12 | Agente ReAct que puede orquestar modelos (Gemini, Claude, DeepSeek) y ejecutar herramientas de lectura/escritura JSON. |

---

## Capacidades clave

1. **Chat estilo ChatGPT** con historial persistente y mensajes en tiempo real.
2. **Carga de archivos ilimitada** (drag & drop o selector múltiple) para PDFs, hojas de cálculo, briefs y presentaciones previas.
3. **Generación de presentaciones** bajo demanda: crea decks completos, guiones, agendas y checklists ejecutivos.
4. **Análisis contextual** de adjuntos para producir resúmenes ejecutivos, insights y backlogs accionables.
5. **Automatizaciones rápidas** mediante plantillas predefinidas (crear deck, analizar archivos, preparar reunión) que precargan prompts de alto impacto.

---

## Requisitos previos

```
Node.js >= 20.19.0
npm >= 10
Python >= 3.12
uv (opcional pero recomendado para manejar dependencias del backend)
Variables de entorno válidas para las APIs que usarás:
  - GOOGLE_API_KEY
  - ANTHROPIC_API_KEY
  - DEEPSEEK_API_KEY
```

> Nota: Vite 7 exige Node 20.19+ o 22.12+. Si estás en 20.17, la compilación emite una advertencia; actualiza para garantizar compatibilidad completa.

---

## Puesta en marcha

### 1. Frontend (interfaz ChatGPT-like)

```
cd app/frontend
npm install
npm run dev
```

- Abre `http://localhost:5173` para interactuar con el chat.
- `npm run lint` valida el código con ESLint.
- `npm run build` genera artefactos de producción en `dist/`.

### 2. Backend (agente LangGraph)

Con **uv**:
```
cd app/backend
uv sync
uv run python main.py
```

Con `pip` tradicional:
```
cd app/backend
python -m venv .venv
.venv\Scripts\activate
pip install langchain langchain-anthropic langchain-deepseek langchain-google-genai langgraph python-dotenv
python main.py
```

El script abre un bucle REPL que reutiliza el historial, llama al agente ReAct y usa las herramientas JSON incluidas. Exporta tus claves antes de iniciar (`setx VARIABLE valor` en Windows PowerShell y vuelve a abrir la terminal).

---

## Flujo de trabajo sugerido

1. Lanza el backend para disponer del agente conectado a tus modelos preferidos.
2. Abre el frontend y crea una conversación nueva; describe tu objetivo como si fuera ChatGPT.
3. Arrastra los archivos de referencia. AIxHub confirmará la carga y preparará un backlog de lectura.
4. Usa los accesos rápidos (crear presentación, analizar archivos, guion de reunión) para acelerar prompts frecuentes.
5. Solicita entregables: decks con secciones, bullets, timings o scripts para exponer; AIxHub devuelve texto listo para copiar o exportar.

---

## Calidad y comprobaciones

- `npm run lint` y `npm run build` superados (con la advertencia de versión de Node mencionada arriba).
- `python -m py_compile backend/main.py` utilizado para garantizar que el backend no tenga errores de sintaxis.

---

## Próximos pasos recomendados

- Conectar el frontend al backend mediante un endpoint (REST o WebSocket) para persistir conversaciones reales.
- Extender las herramientas LangChain para interpretar archivos (PDF loaders, CSV agents) y exportar presentaciones a formatos PPTX/Google Slides.
- Añadir autenticación y espacios de trabajo si planeas múltiples equipos.
