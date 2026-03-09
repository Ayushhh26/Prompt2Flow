import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const diagramLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/diagram", diagramLimiter);

app.post("/api/diagram", async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    if (!prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "Server missing OPENAI_API_KEY. Set it in server/.env (not committed).",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `
You are an expert at analyzing and converting code or instructional text into logical steps and visual flows.
Your task is to:
1. Analyze the given input (either code or plain text).
2. Extract the key logical steps or concepts.
3. Generate a JSON structure with:
   - **nodes**: Each key step as a labeled node.
   - **edges**: Connections between these steps as directional relationships.
4. Ensure the output format is fully compatible with React Flow.

### Output JSON Format:
{
  "nodes": [
    {
      "id": "1",
      "data": { "label": "Step description here" },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}

Return only the JSON object. Do not include any additional text or explanation.
Input: ${prompt}
            `,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(502).json({
        error: "Upstream OpenAI error",
        status: upstream.status,
        details: text.slice(0, 2000),
      });
    }

    const data = await upstream.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? "";

    let flowData;
    try {
      flowData = JSON.parse(rawContent);
    } catch {
      const jsonMatch = typeof rawContent === "string" ? rawContent.match(/\{[\s\S]*\}/) : null;
      if (!jsonMatch) {
        return res.status(502).json({ error: "Invalid JSON format from model" });
      }
      flowData = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(flowData?.nodes) || !Array.isArray(flowData?.edges)) {
      return res
        .status(502)
        .json({ error: "Model response missing nodes/edges arrays" });
    }

    return res.json({ nodes: flowData.nodes, edges: flowData.edges });
  } catch (err) {
    const isAbort = err?.name === "AbortError";
    return res.status(isAbort ? 504 : 500).json({
      error: isAbort ? "Upstream timeout" : "Server error",
    });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[prompt2flow-server] listening on http://localhost:${port}`);
});

