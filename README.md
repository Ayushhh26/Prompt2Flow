# Prompt2Flow

Prompt2Flow is a small web app that turns **plain text** into an **editable flow diagram** (nodes + edges). It renders the result on an interactive canvas (React Flow), so you can drag nodes, connect steps, re-layout, and export a screenshot.

## What it does

- **Text → diagram**: paste a process/system description and generate a flow graph.
- **Interactive editing**: drag nodes, connect edges, zoom/pan.
- **Auto layout**: apply horizontal/vertical layout (Dagre).
- **Export**: download the canvas as a PNG.
- **Theme**: light/dark mode.

## Tech

- **Frontend**: React (Create React App) + `@xyflow/react` (React Flow)
- **Layout**: Dagre (`@dagrejs/dagre`)
- **Icons**: `react-icons`, `lucide-react`
- **Screenshot**: `html2canvas`
- **LLM**: OpenAI (via a local server-side proxy)

## Running locally

### 1) Start the API proxy (server)

Create `server/.env` (do not commit it):

```bash
OPENAI_API_KEY=your_openai_key_here
```

Install and run:

```bash
cd server
npm install
npm start
```

This starts the proxy on `http://localhost:3001`.

### 2) Start the frontend

In another terminal:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Security notes (important)

- **Never put API keys in frontend code**. Anything shipped to the browser can be extracted.
- This repo uses a **server-side proxy** so the browser calls `/api/diagram` and only the server reads `OPENAI_API_KEY`.

## API proxy contract

`POST /api/diagram`

- **Request body**:
  - `prompt` (string)
- **Response body**:
  - `nodes` (array)
  - `edges` (array)
