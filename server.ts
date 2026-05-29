import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { handleGenerateQuestion, handleAnalyzeInterview, handleGenerateQuiz } from "./api/gemini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middle-ware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Question generation route
  app.post("/api/generateQuestion", async (req, res) => {
    try {
      const { role, company, difficulty, history, focusAreas } = req.body;
      const question = await handleGenerateQuestion(role, company, difficulty, history, focusAreas);
      res.json({ text: question });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Interview analysis route
  app.post("/api/analyzeInterview", async (req, res) => {
    try {
      const { role, history } = req.body;
      const analysis = await handleAnalyzeInterview(role, history);
      res.json(analysis);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Quiz generation route
  app.post("/api/generateQuiz", async (req, res) => {
    try {
      const { category, difficulty } = req.body;
      const quiz = await handleGenerateQuiz(category, difficulty);
      res.json(quiz);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middle-ware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IntervAI Server running on http://localhost:${PORT}`);
  });
}

startServer();
