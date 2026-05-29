import express from "express";
import { handleGenerateQuestion, handleAnalyzeInterview, handleGenerateQuiz } from "./gemini";

const app = express();
app.use(express.json());

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

export default app;
