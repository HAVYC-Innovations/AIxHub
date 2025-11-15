#########################################################################################################################

# AIxHub · All-in-one AI workspace for chat + presentations ## AIxHub · Workspace todo-en-uno impulsado por IA generativa #

#########################################################################################################################



AIxHub delivers a ChatGPT-style cockpit tailored for teams: chat with your copilot, drag heavy files, and generate decks, scripts, or executive summaries inside a single interface.AIxHub entrega una experiencia tipo ChatGPT enfocada en productividad empresarial: un único espacio donde conversas con tu copiloto, cargas archivos pesados (PDF, DOCX, CSV, decks) y generas presentaciones, guiones o reportes accionables sin salir del chat.



------



## Quick landscape## Panorama rápido



| Module   | Stack | Purpose || Módulo     | Stack | Descripción |

|----------|-------|---------||------------|-------|-------------|

| Frontend | React 19 · Vite 7 · TypeScript | Chat surface with role-aware routing, dynamic menu, file uploads, and the centered rainbow prompt console. || Frontend   | React 19 + Vite 7 + TypeScript | Interfaz tipo ChatGPT con subida de archivos, acciones rápidas y simulación de respuestas mientras se integra con servicios de IA. |

| Backend  | LangChain · LangGraph · Python 3.12 | ReAct agent that can chain Gemini, Claude, or DeepSeek models plus JSON read/write tools. || Backend    | LangChain + LangGraph + Python 3.12 | Agente ReAct que puede orquestar modelos (Gemini, Claude, DeepSeek) y ejecutar herramientas de lectura/escritura JSON. |



------



## Role-aware flows & menu## Capacidades clave



- `src/utils/cookie.ts` (now TypeScript) exposes typed helpers to read/set/delete the `aixhub_role` cookie so the landing page can auto-route between **admin**, **user**, **user_pro**, or **guest** modes from `src/pages/Home.jsx`.1. **Chat estilo ChatGPT** con historial persistente y mensajes en tiempo real.

- Each role folder (`src/pages/admin|user|user_pro`) configures its own quick actions, feature highlights, and menu actions—no hardcoded UI strings.2. **Carga de archivos ilimitada** (drag & drop o selector múltiple) para PDFs, hojas de cálculo, briefs y presentaciones previas.

- The top-right menu shows live chat history and account actions; on desktops it stays open by default, while on mobile it slides in and reveals the same dynamic data.3. **Generación de presentaciones** bajo demanda: crea decks completos, guiones, agendas y checklists ejecutivos.

- The prompt composer sits in the center of the viewport, features a Telegram-like arrow button, and fires an Apple-Intelligence-inspired rainbow pulse every time you send a prompt.4. **Análisis contextual** de adjuntos para producir resúmenes ejecutivos, insights y backlogs accionables.

5. **Automatizaciones rápidas** mediante plantillas predefinidas (crear deck, analizar archivos, preparar reunión) que precargan prompts de alto impacto.

---

---

## Key capabilities

## Requisitos previos

1. **Chat-like copilots** with message history, role-specific hero copy, and guest prompt limits.

2. **File ingestion** via drag & drop or the uploader, with attachment pills rendered inline for every message.```

3. **Quick action templates** that drop curated prompts for creating presentations, analyzing files, or drafting scripts.Node.js >= 20.19.0

4. **Dynamic side menu** showing recent chats plus login/export actions based on the current role.npm >= 10

5. **Rainbow prompt console** centered on the page with a Telegram-style arrow button and gradient feedback after each send.Python >= 3.12

uv (opcional pero recomendado para manejar dependencias del backend)

---Variables de entorno válidas para las APIs que usarás:

  - GOOGLE_API_KEY

## Requirements  - ANTHROPIC_API_KEY

  - DEEPSEEK_API_KEY

``````

Node.js  >= 20.19.0   (Vite 7 enforces this)

npm      >= 10> Nota: Vite 7 exige Node 20.19+ o 22.12+. Si estás en 20.17, la compilación emite una advertencia; actualiza para garantizar compatibilidad completa.

Python   >= 3.12

uv       (optional but handy for backend deps)---

Environment variables:

  GOOGLE_API_KEY## Puesta en marcha

  ANTHROPIC_API_KEY

  DEEPSEEK_API_KEY### 1. Frontend (interfaz ChatGPT-like)

```

```

> If you are still on Node 20.17 the build will finish but Vite warns you to upgrade—do it to stay supported.cd app/frontend

npm install

---npm run dev

```

## Getting started

- Abre `http://localhost:5173` para interactuar con el chat.

### Frontend (Vite/React)- `npm run lint` valida el código con ESLint.

- `npm run build` genera artefactos de producción en `dist/`.

```

cd app/frontend### 2. Backend (agente LangGraph)

npm install

npm run devCon **uv**:

``````

cd app/backend

- Open `http://localhost:5173` to chat.uv sync

- `npm run lint` keeps ESLint happy.uv run python main.py

- `npm run build` emits production assets in `dist/`.```



### Backend (LangGraph agent)Con `pip` tradicional:

```

With **uv**:cd app/backend

```python -m venv .venv

cd app/backend.venv\Scripts\activate

uv syncpip install langchain langchain-anthropic langchain-deepseek langchain-google-genai langgraph python-dotenv

uv run python main.pypython main.py

``````



With `pip`:El script abre un bucle REPL que reutiliza el historial, llama al agente ReAct y usa las herramientas JSON incluidas. Exporta tus claves antes de iniciar (`setx VARIABLE valor` en Windows PowerShell y vuelve a abrir la terminal).

```

cd app/backend---

python -m venv .venv

.venv\Scripts\activate## Flujo de trabajo sugerido

pip install langchain langchain-anthropic langchain-deepseek langchain-google-genai langgraph python-dotenv

python main.py1. Lanza el backend para disponer del agente conectado a tus modelos preferidos.

```2. Abre el frontend y crea una conversación nueva; describe tu objetivo como si fuera ChatGPT.

3. Arrastra los archivos de referencia. AIxHub confirmará la carga y preparará un backlog de lectura.

The script launches a REPL loop that reuses history and executes the JSON tools. Remember to export your API keys (`setx VARIABLE value` in Windows PowerShell) before starting.4. Usa los accesos rápidos (crear presentación, analizar archivos, guion de reunión) para acelerar prompts frecuentes.

5. Solicita entregables: decks con secciones, bullets, timings o scripts para exponer; AIxHub devuelve texto listo para copiar o exportar.

---

---

## Hosting on Vercel

## Calidad y comprobaciones

A ready-to-edit descriptor lives in `vercel/project.json`:

- `npm run lint` y `npm run build` superados (con la advertencia de versión de Node mencionada arriba).

- Builds the React frontend via `npm run build` and serves `app/frontend/dist`.- `python -m py_compile backend/main.py` utilizado para garantizar que el backend no tenga errores de sintaxis.

- Rewrites `/api/*` calls to `app/backend/main.py` so you can expose LangChain functions as serverless handlers.

- Lists the required API keys so you can add them to Vercel secrets without hunting through the repo.---



Adjust the commands as needed for monorepo mode or separate projects.## Próximos pasos recomendados



---- Conectar el frontend al backend mediante un endpoint (REST o WebSocket) para persistir conversaciones reales.

- Extender las herramientas LangChain para interpretar archivos (PDF loaders, CSV agents) y exportar presentaciones a formatos PPTX/Google Slides.

## Recommended workflow- Añadir autenticación y espacios de trabajo si planeas múltiples equipos.


1. Run the backend to provide live reasoning tools.
2. Visit the frontend—`Home.jsx` inspects the cookie and routes you to Admin/User/User Pro/Guest automatically.
3. Drag reference files into the centered composer and watch them appear as attachment chips in the conversation.
4. Fire a quick action to preload a prompt for presentations, file analysis, or meeting scripts.
5. Use the menu to review chat history, start a new session, or trigger sign-in/export actions.

---

## Quality gates

- `npm run lint` and `npm run build` (Node 20.19+) keep the frontend green.
- `python -m py_compile backend/main.py` ensures the LangGraph entry point parses correctly.

---

## Next steps

- Wire the chat UI to real backend endpoints (REST or WebSockets) to replace the simulated responses.
- Expand LangChain tools for PDF/CSV ingestion and deck export (PPTX / Google Slides APIs).
- Layer authentication plus workspace management so multiple teams can share the same deployment.
