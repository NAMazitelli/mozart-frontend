import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonProgressBar,
  IonBadge
} from '@ionic/react';
import { playOutline, volumeHighOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { exerciseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import { getDifficultyFromUrl, logApiCall } from '../utils/exerciseUtils';
import './GuessNoteExercise.css';

interface GuessNoteExercise {
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

const GuessNoteExercise: React.FC = () => {
  const { difficulty } = useParams<{ difficulty: string }>();
  const { isGuest } = useAuth();
  const [exercise, setExercise] = useState<GuessNoteExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number>(0);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // Load exercise
  useEffect(() => {
    loadNewExercise();
  }, []);

  // Use difficulty from URL params with fallback extraction for mobile
  const currentDifficulty = getDifficultyFromUrl(difficulty, 'GuessNote');

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      logApiCall('GuessNote', 'guess-note', currentDifficulty);
      const response = await exerciseService.getGuessNoteExercise(currentDifficulty);

      // Debug: Log the frequencies we received
      console.log('GuessNote - Exercise loaded:', response);
      console.log('GuessNote - Correct note frequency:', response.correctNote.frequency);
      console.log('GuessNote - Options:', response.options);

      setExercise(response);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('GuessNote - Error loading exercise:', error);
      logApiCall('GuessNote', 'guess-note', currentDifficulty, true);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const playNote = (frequency: number) => {
    if (!audioContext) {
      console.error('Audio context not available');
      return;
    }

    // Resume audio context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Configure gain (volume envelope)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    // Play note
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (isAnswered || !exercise) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    try {
      // For guest users, calculate validation locally without API call
      if (isGuest) {
        const isCorrect = answerIndex === exercise.correctAnswerIndex;
        const correctNote = exercise.options[exercise.correctAnswerIndex];
        const selectedNote = exercise.options[answerIndex];

        setIsCorrect(isCorrect);
        setAccuracy(isCorrect ? 100 : 0);

        if (isCorrect) {
          setModalMessage(`Correct! The note was ${correctNote.displayName}.`);
          setScore(prev => prev + exercise.points);
        } else {
          setModalMessage(`Not quite right. The correct note was ${correctNote.displayName}. You guessed ${selectedNote.displayName}.`);
        }

        setShowModal(true);
      } else {
        // For logged-in users, use API validation
        const response = await exerciseService.validateGuessNoteAnswer({
          exerciseId: exercise.id,
          selectedAnswerIndex: answerIndex,
          correctAnswerIndex: exercise.correctAnswerIndex
        });

        setIsCorrect(response.isCorrect);
        setModalMessage(response.message);
        setAccuracy(response.isCorrect ? 100 : 0); // Set accuracy based on correctness
        setShowModal(true);

        if (response.isCorrect) {
          setScore(prev => prev + exercise.points);
        }
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      setModalMessage('Error validating answer. Please try again.');
      setShowModal(true);
    }
  };

  const handleNextQuestion = () => {
    loadNewExercise();
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/main" />
            </IonButtons>
            <IonTitle>Guess the Note</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading exercise...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!exercise) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/main" />
            </IonButtons>
            <IonTitle>Guess the Note</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Failed to load exercise. Please try again.</p>
          <IonButton expand="block" onClick={loadNewExercise}>
            Retry
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/difficulty/guess-note`} />
          </IonButtons>
          <IonTitle>
            Guess the Note - {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Progress indicator */}
        <div className="progress-info">
          <p>Question {questionCount} • Score: {score} • Points: {exercise?.points || 0}</p>
          <IonBadge color={currentDifficulty === 'easy' ? 'success' : currentDifficulty === 'medium' ? 'warning' : 'danger'}>
            {currentDifficulty.toUpperCase()}
          </IonBadge>
          <IonProgressBar value={0.1} buffer={0.2} />
        </div>

        {/* Question card */}
        <IonCard className="question-card">
          <IonCardHeader>
            <IonCardTitle>{exercise.question}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={() => playNote(exercise.correctNote.frequency)}
              >
                <IonIcon icon={playOutline} slot="start" />
                Play Note
              </IonButton>
              <p className="audio-hint">
                <IonIcon icon={volumeHighOutline} /> Listen carefully and select the correct note
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Answer options */}
        <IonCard className="options-card">
          <IonCardContent>
            <IonGrid>
              <IonRow>
                {exercise.options.map((option, index) => (
                  <IonCol size="12" key={index}>
                    <IonButton
                      expand="block"
                      fill={selectedAnswer === index ? "solid" : "outline"}
                      color={
                        isAnswered
                          ? index === exercise.correctAnswerIndex
                            ? "success"
                            : selectedAnswer === index
                            ? "danger"
                            : "medium"
                          : "primary"
                      }
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                      className="answer-button"
                    >
                      {isAnswered && index === exercise.correctAnswerIndex && (
                        <IonIcon icon={checkmarkCircle} slot="start" />
                      )}
                      {isAnswered && selectedAnswer === index && index !== exercise.correctAnswerIndex && (
                        <IonIcon icon={closeCircle} slot="start" />
                      )}
                      {option.displayName}
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Exercise Completion Modal */}
        <ExerciseCompletionModal
          isOpen={showModal}
          onClose={handleModalClose}
          onNext={handleNextQuestion}
          isCorrect={isCorrect}
          message={modalMessage}
          score={score}
          pointsEarned={exercise?.points}
          correctAnswer={exercise?.correctNote.displayName || exercise?.options[exercise?.correctAnswerIndex]?.displayName}
          showNextButton={isAnswered}
          userGuess={selectedAnswer !== null ? exercise?.options[selectedAnswer]?.displayName : 'No selection'}
          accuracy={accuracy}
        />
      </IonContent>
    </IonPage>
  );
};

export default GuessNoteExercise;