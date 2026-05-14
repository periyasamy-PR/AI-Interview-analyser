# IntervAI

IntervAI is a cutting-edge AI-powered career intelligence platform designed to help professionals master their next interview. By leveraging advanced generative AI models, the application conducts realistic mock interviews tailored to specific roles, companies, and disciplines.

## Features

- **Neural Mockups:** Real-time contextual simulations for high-stakes roles.
- **Dynamic Feedback:** Immediate, deep-dive analysis of technical accuracy, logic, and communication.
- **Skill Assessments:** Auto-generated structured quizzes across varied development domains.
- **Progress Tracking:** Performance velocity tracking to refine and pinpoint areas of growth.
- **Audio-Ready Context:** Built-in Speech-to-Text inputs and responsive Text-to-Speech playback.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (v4)
- **Backend:** Node.js, Express, Vercel Serverless Functions (`/api`), Firebase Firestore
- **Authentication:** Firebase Auth
- **AI Integration:** Google GenAI SDK (Gemini Flash & Pro Preview Models)
- **Deployment:** Vercel & GitHub

## Environment Variables

To run the project locally or deploy it to Vercel, you need to set up the following environment variables.

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY="your-google-gemini-api-key"
```

## Running Locally

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Start the local full-stack development environment:

```bash
npm run dev
```

This runs both the Express backend and the Vite frontend simultaneously at `http://localhost:3000`.

## GitHub & Vercel Deployment

This project is configured out-of-the-box for **Vercel** serverless deployment. Code execution is safely sandboxed by placing Gemini-related logic inside isolated `/api` endpoints, protecting your API keys from client-side exposure.

### 1. Push to GitHub

Initialize your Git repository, commit your code, and push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/intervAI.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Log into your **Vercel** dashboard.
2. Click **Add New Project** and select your repository.
3. Vercel will automatically detect **Vite** as a framework.
4. **Environment Variables:** In the Vercel deployment settings, add:
   - `GEMINI_API_KEY` with your AI key.
5. Expand the **Build and Output Settings** (if needed, but usually automatically detected matching your `package.json`):
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. Click **Deploy**.

Vercel will successfully compile your Vite bundle to `/dist` and automatically mount the Express endpoints declared in `api/index.ts` as serverless functions.
