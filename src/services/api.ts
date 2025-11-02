import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  age?: number;
  gender?: string;
  profilePictureUrl?: string;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  totalExercisesCompleted: number;
  language: string;
  lastActivity?: string;
  createdAt?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  masterVolume: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEffects?: boolean;
  vibration?: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Exercise {
  id: number;
  category: string;
  type: string;
  difficulty: string;
  question_data: any;
  answer_data: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SocialLoginData {
  provider: 'google' | 'facebook';
  providerUserId: string;
  providerEmail?: string;
  userData?: {
    name?: string;
    picture?: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, username: string, fullName?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, username, fullName }),

  // Social login (direct API call for mobile apps)
  socialLogin: (data: SocialLoginData) =>
    api.post<AuthResponse>('/auth/social-login', data),

  // OAuth URLs for web redirects
  getGoogleAuthUrl: () => `${API_BASE_URL}/auth/google`,
  getFacebookAuthUrl: () => `${API_BASE_URL}/auth/facebook`,

  logout: () => api.post('/auth/logout'),
};

export interface UserScore {
  category: string;
  difficulty: string;
  high_score: number;
  attempts_count: number;
  best_time?: number;
  last_attempted: string;
  avg_accuracy: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  full_name?: string;
  total_score: number;
  longest_streak: number;
  total_attempts: number;
  total_correct: number;
  success_rate: number;
  average_accuracy: number;
}

export interface ExerciseLeaderboardEntry extends LeaderboardEntry {
  exercise_type: string;
  difficulty: string;
}

export interface SocialAccount {
  provider: 'google' | 'facebook';
  provider_email?: string;
  provider_data: any;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  getProfile: () => api.get<User>('/user/profile'),
  updateProfile: (data: {
    username?: string;
    fullName?: string;
    age?: number;
    gender?: string;
    language?: string;
    profilePictureUrl?: string;
  }) => api.put('/user/profile', data),
  updatePreferences: (data: Partial<UserPreferences>) =>
    api.put('/user/preferences', data),
  getScores: () => api.get<UserScore[]>('/user/scores'),

  // Leaderboard endpoints
  getGlobalLeaderboard: (limit: number = 50, offset: number = 0) =>
    api.get<LeaderboardEntry[]>(`/user/leaderboard/global?limit=${limit}&offset=${offset}`),
  getExerciseLeaderboard: (exerciseType: string, difficulty?: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (difficulty) params.append('difficulty', difficulty);
    return api.get<ExerciseLeaderboardEntry[]>(`/user/leaderboard/exercise/${exerciseType}?${params}`);
  },
  getLeaderboardPosition: (type: 'global' | 'exercise', exerciseType?: string, difficulty?: string) => {
    const params = new URLSearchParams({ type });
    if (exerciseType) params.append('exerciseType', exerciseType);
    if (difficulty) params.append('difficulty', difficulty);
    return api.get<{ rank: number | null; type: string; exerciseType?: string; difficulty?: string }>(`/user/leaderboard/position?${params}`);
  },
  getFriendsLeaderboard: () =>
    api.get<LeaderboardEntry[]>('/user/leaderboard/friends'),

  // Social accounts management
  getSocialAccounts: () =>
    api.get<{ socialAccounts: SocialAccount[] }>('/auth/social-accounts'),
  disconnectSocialAccount: (provider: 'google' | 'facebook') =>
    api.delete(`/auth/social-accounts/${provider}`),
};

export interface GuessNoteExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  correctNote: {
    name: string;
    frequency: number;
    displayName: string;
  };
  options: Array<{
    name: string;
    displayName: string;
  }>;
  correctAnswerIndex: number;
  points: number;
  totalNotes: number;
  difficultyInfo: string;
}

export interface GuessNoteValidationResponse {
  isCorrect: boolean;
  message: string;
  explanation: string | null;
}

export const exerciseApi = {
  getCategories: () => api.get<Category[]>('/exercise/categories'),
  fetchExercises: (category: string, difficulty: string, type?: string) =>
    api.get<Exercise[]>('/exercise/fetch', { params: { category, difficulty, type } }),
  submitExercise: (data: {
    category: string;
    difficulty: string;
    score: number;
    isCorrect: boolean;
  }) => api.post('/exercise/submit', data),
};

export interface PanningExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  sound: {
    type: string;
    frequency: number;
    displayName: string;
    description: string;
  };
  correctPanValue: number;
  correctPanPercentage: number;
  panDescription: string;
  points: number;
  tolerance: number;
  difficultyInfo: string;
}

export interface PanningValidationResponse {
  isCorrect: boolean;
  message: string;
  accuracy: number;
  userPanValue: number;
  correctPanValue: number;
  userPercentage: number;
  correctPercentage: number;
  difference: number;
  explanation: string;
}

export interface ExerciseSubmissionData {
  exerciseCategory: string;
  difficulty: string;
  isCorrect: boolean;
  userAnswer?: any;
  correctAnswer?: any;
  accuracy?: number;
  timeTaken?: number;
  exerciseData?: any;
}

export interface ExerciseSubmissionResponse {
  message: string;
  attemptId: number;
  pointsEarned: number;
  isCorrect: boolean;
  userStats: {
    totalScore: number;
    currentStreak: number;
    longestStreak: number;
    totalExercisesCompleted: number;
  };
}

export const exerciseService = {
  getGuessNoteExercise: async (difficulty: string = 'easy'): Promise<GuessNoteExercise> => {
    const response = await api.get<GuessNoteExercise>(`/exercise/guess-note/${difficulty}`);
    return response.data;
  },

  validateGuessNoteAnswer: async (data: {
    exerciseId: string;
    selectedAnswerIndex: number;
    correctAnswerIndex: number;
  }): Promise<GuessNoteValidationResponse> => {
    const response = await api.post<GuessNoteValidationResponse>('/exercise/validate/guess-note', data);
    return response.data;
  },

  submitExercise: async (data: ExerciseSubmissionData): Promise<ExerciseSubmissionResponse> => {
    const response = await api.post<ExerciseSubmissionResponse>('/exercise/submit', data);
    return response.data;
  },
};

export interface VolumeExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  note: {
    frequency: number;
    displayName: string;
  };
  referenceGain: number;
  secondGain: number;
  volumeDifference: number;
  tolerance: number;
  points: number;
  difficultyInfo: string;
  volumeDescription: string;
}

export interface VolumeValidationResponse {
  isCorrect: boolean;
  message: string;
  accuracy: number;
  userVolumeDifference: number;
  correctVolumeDifference: number;
  difference: number;
  explanation: string;
}

export const panningService = {
  getPanningExercise: async (difficulty: string = 'easy'): Promise<PanningExercise> => {
    const response = await api.get<PanningExercise>(`/exercise/panning/${difficulty}`);
    return response.data;
  },

  validatePanningAnswer: async (data: {
    exerciseId: string;
    userAnswer: number;
    correctAnswer: number;
    tolerance: number;
  }): Promise<PanningValidationResponse> => {
    const response = await api.post<PanningValidationResponse>('/exercise/validate/panning', data);
    return response.data;
  },
};

export const volumeService = {
  getVolumeExercise: async (difficulty: string = 'easy'): Promise<VolumeExercise> => {
    const response = await api.get<VolumeExercise>(`/exercise/volumes/${difficulty}`);
    return response.data;
  },

  validateVolumeAnswer: async (data: {
    exerciseId: string;
    userAnswer: number;
    correctAnswer: number;
    tolerance: number;
  }): Promise<VolumeValidationResponse> => {
    const response = await api.post<VolumeValidationResponse>('/exercise/validate/volumes', data);
    return response.data;
  },
};

export interface EqualizingExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  sound: {
    type: string;
    frequency: number;
    displayName: string;
    description: string;
  };
  targetFrequency: number;
  eqGainDb: number;
  isBoost: boolean;
  tolerance: number;
  qFactor: number;
  points: number;
  difficultyInfo: string;
  eqDescription: string;
}

export interface EqualizingValidationResponse {
  isCorrect: boolean;
  message: string;
  accuracy: number;
  userFrequency: number;
  correctFrequency: number;
  difference: number;
  tolerance: number;
  acceptanceRangeMin: number;
  acceptanceRangeMax: number;
  explanation: string;
}

export const equalizingService = {
  getEqualizingExercise: async (difficulty: string = 'easy'): Promise<EqualizingExercise> => {
    const response = await api.get<EqualizingExercise>(`/exercise/equalizing/${difficulty}`);
    return response.data;
  },

  validateEqualizingAnswer: async (data: {
    exerciseId: string;
    userFrequency: number;
    correctFrequency: number;
    tolerance: number;
  }): Promise<EqualizingValidationResponse> => {
    // Map parameters to what the backend expects
    const backendData = {
      exerciseId: data.exerciseId,
      userAnswer: data.userFrequency,
      correctAnswer: data.correctFrequency,
      tolerance: data.tolerance
    };
    const response = await api.post<EqualizingValidationResponse>('/exercise/validate/equalizing', backendData);
    return response.data;
  },
};

export interface IntervalsExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  sequence: Array<{
    note: string;
    frequency: number;
    displayName: string;
    isBlack: boolean;
  }>;
  noteCount: number;
  points: number;
  difficultyInfo: string;
  pianoNotes: Array<{
    note: string;
    frequency: number;
    displayName: string;
    isBlack: boolean;
  }>;
}

export interface IntervalsValidationResponse {
  isCorrect: boolean;
  message: string;
  accuracy: number;
  correctCount: number;
  totalNotes: number;
  userSequence: string[];
  correctSequence: string[];
  explanation: string;
}

export const intervalsService = {
  getIntervalsExercise: async (difficulty: string = 'easy'): Promise<IntervalsExercise> => {
    const response = await api.get<IntervalsExercise>(`/exercise/intervals/${difficulty}`);
    return response.data;
  },

  validateIntervalsAnswer: async (data: {
    exerciseId: string;
    userSequence: string[];
    correctSequence: string[];
  }): Promise<IntervalsValidationResponse> => {
    const response = await api.post<IntervalsValidationResponse>('/exercise/validate/intervals', data);
    return response.data;
  },
};

export interface HarmoniesExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  chord: Array<{
    note: string;
    frequency: number;
    displayName: string;
    isBlack: boolean;
  }>;
  noteCount: number;
  points: number;
  difficultyInfo: string;
  pianoNotes: Array<{
    note: string;
    frequency: number;
    displayName: string;
    isBlack: boolean;
  }>;
}

export interface HarmoniesValidationResponse {
  isCorrect: boolean;
  message: string;
  accuracy: number;
  correctCount: number;
  totalNotes: number;
  extraNotesCount: number;
  userNotes: string[];
  correctNotes: string[];
  matchedNotes: string[];
  extraNotes: string[];
  explanation: string;
}

export const harmoniesService = {
  getHarmoniesExercise: async (difficulty: string = 'easy'): Promise<HarmoniesExercise> => {
    const response = await api.get<HarmoniesExercise>(`/exercise/harmonies/${difficulty}`);
    return response.data;
  },

  validateHarmoniesAnswer: async (data: {
    exerciseId: string;
    userNotes: string[];
    correctNotes: string[];
  }): Promise<HarmoniesValidationResponse> => {
    const response = await api.post<HarmoniesValidationResponse>('/exercise/validate/harmonies', data);
    return response.data;
  },
};

export default api;