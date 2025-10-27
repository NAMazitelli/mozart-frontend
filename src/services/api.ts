import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
  coins: number;
  currentStreak: number;
  longestStreak: number;
  language: string;
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

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (email: string, password: string, username: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, username }),
};

export const userApi = {
  getProfile: () => api.get<User>('/user/profile'),
  updateProfile: (data: { username?: string; language?: string }) =>
    api.put('/user/update', data),
  getScores: () => api.get('/user/scores'),
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

export const exerciseService = {
  getGuessNoteExercise: async (difficulty: string = 'easy'): Promise<GuessNoteExercise> => {
    const response = await api.get<GuessNoteExercise>('/exercise/guess-note', {
      params: { difficulty }
    });
    return response.data;
  },

  validateGuessNoteAnswer: async (data: {
    exerciseId: string;
    selectedAnswerIndex: number;
    correctAnswerIndex: number;
  }): Promise<GuessNoteValidationResponse> => {
    const response = await api.post<GuessNoteValidationResponse>('/exercise/guess-note/validate', data);
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
    const response = await api.get<PanningExercise>('/exercise/panning', {
      params: { difficulty }
    });
    return response.data;
  },

  validatePanningAnswer: async (data: {
    exerciseId: string;
    userPanValue: number;
    correctPanValue: number;
    tolerance: number;
  }): Promise<PanningValidationResponse> => {
    const response = await api.post<PanningValidationResponse>('/exercise/panning/validate', data);
    return response.data;
  },
};

export const volumeService = {
  getVolumeExercise: async (difficulty: string = 'easy'): Promise<VolumeExercise> => {
    const response = await api.get<VolumeExercise>('/exercise/volumes', {
      params: { difficulty }
    });
    return response.data;
  },

  validateVolumeAnswer: async (data: {
    exerciseId: string;
    userVolumeDifference: number;
    correctVolumeDifference: number;
    tolerance: number;
  }): Promise<VolumeValidationResponse> => {
    const response = await api.post<VolumeValidationResponse>('/exercise/volumes/validate', data);
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
    const response = await api.get<EqualizingExercise>('/exercise/equalizing', {
      params: { difficulty }
    });
    return response.data;
  },

  validateEqualizingAnswer: async (data: {
    exerciseId: string;
    userFrequency: number;
    correctFrequency: number;
    tolerance: number;
  }): Promise<EqualizingValidationResponse> => {
    const response = await api.post<EqualizingValidationResponse>('/exercise/equalizing/validate', data);
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
    const response = await api.get<IntervalsExercise>('/exercise/intervals', {
      params: { difficulty }
    });
    return response.data;
  },

  validateIntervalsAnswer: async (data: {
    exerciseId: string;
    userSequence: string[];
    correctSequence: string[];
  }): Promise<IntervalsValidationResponse> => {
    const response = await api.post<IntervalsValidationResponse>('/exercise/intervals/validate', data);
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
    const response = await api.get<HarmoniesExercise>('/exercise/harmonies', {
      params: { difficulty }
    });
    return response.data;
  },

  validateHarmoniesAnswer: async (data: {
    exerciseId: string;
    userNotes: string[];
    correctNotes: string[];
  }): Promise<HarmoniesValidationResponse> => {
    const response = await api.post<HarmoniesValidationResponse>('/exercise/harmonies/validate', data);
    return response.data;
  },
};

export default api;