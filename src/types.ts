export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  stats: {
    totalInterviews: number;
    avgScore: number;
    completedQuizzes: number;
  };
}

export interface InterviewMessage {
  id?: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: any;
}

export interface InterviewFeedback {
  overallScore: number;
  communicationScore: number;
  topStrengths: string[];
  weakAreas: string[];
  generalAdvice: string;
}

export interface MockInterview {
  id: string;
  userId: string;
  role: string;
  company: string;
  difficulty: 'Entry' | 'Mid' | 'Senior';
  status: 'active' | 'completed';
  createdAt: any;
  feedback?: InterviewFeedback;
  focusAreas?: string[];
}

export interface QuizResult {
  id: string;
  userId: string;
  category: string;
  score: number;
  total: number;
  timestamp: any;
}
