import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });
const MODELS = {
  FLASH: "gemini-3-flash-preview",
  PRO: "gemini-3.1-pro-preview",
};

app.post("/api/generateQuestion", async (req, res) => {
  try {
    const { role, company, difficulty, history, focusAreas } = req.body;
    const focusStr = focusAreas && focusAreas.length > 0 ? `Please focus specifically on these areas: ${focusAreas.join(', ')}.` : '';
    
    const prompt = `You are a professional interviewer at ${company}. You are interviewing a candidate for a ${difficulty} level ${role} position.
    ${focusStr}
    
    Current Interview History:
    ${history.map((h: any) => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n')}
    
    Based on the history, ask the NEXT relevant interview question. 
    It should be one of: HR, Technical, or Behavioral.
    Be concise, professional, and slightly challenging.
    Only output the question text.`;

    const result = await ai.models.generateContent({
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

    const result = await ai.models.generateContent({
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

    const result = await ai.models.generateContent({
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

export default app;
