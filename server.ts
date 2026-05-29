import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middle-ware
  app.use(express.json());

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment.");
  }
  const ai = new GoogleGenAI({ 
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const MODELS = {
    FLASH: "gemini-3.5-flash",
    PRO: "gemini-3.5-flash",
  };

  // Helper function to call generateContent with retry and backup fallback mechanisms
  async function generateContentWithRetry(params: any, retries = 3, delayMs = 1000): Promise<any> {
    let attempt = 0;
    while (true) {
      try {
        return await ai.models.generateContent(params);
      } catch (error: any) {
        attempt++;
        console.warn(`[Gemini API] Attempt ${attempt} failed: ${error.message || error}`);
        
        const errMsg = (error.message || "").toLowerCase();
        const isTransient = error.status === 'UNAVAILABLE' || 
                            error.code === 503 ||
                            errMsg.includes("503") || 
                            errMsg.includes("high demand") || 
                            errMsg.includes("resource exhausted") || 
                            errMsg.includes("429") ||
                            errMsg.includes("unavailable");
        
        if (attempt >= retries || !isTransient) {
          // If the model was PRO and we have a transient or structural failure, try a fallback to gemini-3.5-flash
          if (params.model !== "gemini-3.5-flash") {
            console.warn(`[Gemini API] Falling back to gemini-3.5-flash to preserve uptime...`);
            const fallbackParams = { ...params, model: "gemini-3.5-flash" };
            try {
              return await ai.models.generateContent(fallbackParams);
            } catch (fallbackError: any) {
              console.error(`[Gemini API] Fallback to gemini-3.5-flash also failed:`, fallbackError);
              throw fallbackError;
            }
          }
          throw error;
        }
        
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[Gemini API] Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/generateQuestion", async (req, res) => {
    try {
      const { role, company, difficulty, history, focusAreas } = req.body;
      const focusStr = focusAreas && focusAreas.length > 0 ? `Please focus specifically on these areas: ${focusAreas.join(', ')}.` : '';
      
      const prompt = `You are an expert professional interviewer at ${company}. You are conducting a highly realistic, interactive, and structured interview for a ${difficulty} level ${role} position.
      ${focusStr}
      
      Current Interview History:
      ${history && history.length > 0 
        ? history.map((h: any) => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n')
        : '(None - start the interview with your very first question)'}
      
      CRITICAL INSTRUCTIONS:
      1. Review the interview history carefully.
      2. Identify all questions that you (Interviewer) have ALREADY asked previously in the history.
      3. **DO NOT REPEAT** any question that has already been asked or is extremely similar to past questions. Asking the same question twice destroys the realism of the interview.
      4. Acknowledge the candidate's last answer in a progressive way (if applicable) and ask a completely NEW, DISTINCT, and sequential question to move the interview forward.
      5. The question should be clean, concise, professional, slightly challenging, and belong to: HR, Technical, or Behavioral categories suitable for ${difficulty} level ${role}.
      6. Output ONLY the next interviewer question. Do not include any meta-text, markdown tags, introduction or prefix.`;

      const result = await generateContentWithRetry({
        model: MODELS.FLASH,
        contents: prompt,
      });

      res.json({ text: result.text || "Could you tell me more about your previous experience?" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/analyzeInterview", async (req, res) => {
    try {
      const { role, history } = req.body;
      const prompt = `Analyze the following interview for a ${role} position and provide feedback in JSON format.
      
      Interview Transcript:
      ${history.map((h: any) => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n')}
      
      Requirements:
      - overallScore: 0-100
      - communicationScore: 0-100
      - topStrengths: array of 3 strings
      - weakAreas: array of 3 strings
      - generalAdvice: A summary paragraph of how to improve.`;

      const result = await generateContentWithRetry({
        model: MODELS.PRO,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              communicationScore: { type: Type.NUMBER },
              topStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              generalAdvice: { type: Type.STRING },
            },
            required: ["overallScore", "communicationScore", "topStrengths", "weakAreas", "generalAdvice"],
          },
        },
      });

      res.json(JSON.parse(result.text || "{}"));
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/generateQuiz", async (req, res) => {
    try {
      const { category, difficulty } = req.body;
      const prompt = `Generate a technical quiz for ${category} at ${difficulty} level. 
      Provide 5 multiple choice questions.
      
      JSON Format:
      {
        "questions": [
          {
            "question": "string",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0
          }
        ]
      }`;

      const result = await generateContentWithRetry({
        model: MODELS.FLASH,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.NUMBER },
                  },
                  required: ["question", "options", "correctAnswer"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });

      res.json(JSON.parse(result.text || '{"questions": []}'));
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
