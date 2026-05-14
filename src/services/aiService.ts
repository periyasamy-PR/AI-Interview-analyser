import { InterviewFeedback } from "../types";

export const aiService = {
  async generateInterviewQuestion(role: string, company: string, difficulty: string, history: { role: string, text: string }[], focusAreas?: string[]) {
    try {
      const response = await fetch('/api/generateQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, company, difficulty, history, focusAreas })
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data.text;
    } catch (e) {
      console.error(e);
      return "Could you tell me more about your previous experience?";
    }
  },

  async analyzeInterview(role: string, history: { role: string, text: string }[]) {
    try {
      const response = await fetch('/api/analyzeInterview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, history })
      });
      if (!response.ok) throw new Error('API error');
      return await response.json() as InterviewFeedback;
    } catch (e) {
      console.error(e);
      return {} as InterviewFeedback;
    }
  },

  async generateQuiz(category: string, difficulty: string) {
    try {
      const response = await fetch('/api/generateQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty })
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (e) {
      console.error(e);
      return { questions: [] };
    }
  }
};
