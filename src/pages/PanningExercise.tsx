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
  IonBadge,
  IonRange,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { playOutline, volumeHighOutline, checkmarkCircle, closeCircle, headset } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { panningService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import { getDifficultyFromUrl, logApiCall } from '../utils/exerciseUtils';
import './PanningExercise.css';

interface PanningExercise {
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

const PanningExercise: React.FC = () => {
  const { difficulty: urlDifficulty } = useParams<{ difficulty: string }>();
  const history = useHistory();
  const { isGuest } = useAuth();
  const [exercise, setExercise] = useState<PanningExercise | null>(null);
  const [userPanValue, setUserPanValue] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentOscillator, setCurrentOscillator] = useState<OscillatorNode | null>(null);

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

  // Get difficulty from URL params with fallback extraction for mobile
  const currentDifficulty = getDifficultyFromUrl(urlDifficulty, 'Panning');

  // Load exercise
  useEffect(() => {
    loadNewExercise();
  }, []);

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      logApiCall('Panning', 'panning', currentDifficulty);
      const response = await panningService.getPanningExercise(currentDifficulty);
      setExercise(response);
      setUserPanValue(0); // Reset slider to center
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Panning - Error loading exercise:', error);
      logApiCall('Panning', 'panning', currentDifficulty, true);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const playPannedSound = (panValue: number = exercise?.correctPanValue || 0) => {
    if (!audioContext || !exercise) {
      console.error('Audio context or exercise not available');
      return;
    }

    // Stop any currently playing sound
    if (currentOscillator) {
      currentOscillator.stop();
      setCurrentOscillator(null);
    }

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    setIsPlaying(true);

    // Create oscillator based on sound type
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const pannerNode = audioContext.createStereoPanner();

    // Connect nodes: oscillator -> gain -> panner -> destination
    oscillator.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(audioContext.destination);

    // Configure oscillator
    oscillator.type = exercise.sound.type as OscillatorType;
    oscillator.frequency.setValueAtTime(exercise.sound.frequency, audioContext.currentTime);

    // Configure gain (volume envelope)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8);

    // Set panning (-1 = left, 0 = center, 1 = right)
    pannerNode.pan.setValueAtTime(panValue, audioContext.currentTime);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);

    setCurrentOscillator(oscillator);

    oscillator.onended = () => {
      setIsPlaying(false);
      setCurrentOscillator(null);
    };
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise) return;

    setIsAnswered(true);

    try {
      // For guest users, calculate validation locally without API call
      if (isGuest) {
        const difference = Math.abs(userPanValue - exercise.correctPanValue);
        const isCorrect = difference <= exercise.tolerance;
        const accuracy = Math.max(0, (1 - difference / (exercise.tolerance * 2)) * 100);

        setIsCorrect(isCorrect);
        setAccuracy(accuracy);

        if (isCorrect) {
          setModalMessage(`Correct! The sound was positioned ${exercise.panDescription}.`);
          setScore(prev => prev + exercise.points);
        } else {
          setModalMessage(`Not quite right. The correct position was ${exercise.panDescription}. You guessed ${formatPanValue(userPanValue)}.`);
        }

        setShowModal(true);
      } else {
        // For logged-in users, use API validation
        const response = await panningService.validatePanningAnswer({
          exerciseId: exercise.id,
          userAnswer: userPanValue,
          correctAnswer: exercise.correctPanValue,
          tolerance: exercise.tolerance
        });

        setIsCorrect(response.isCorrect);
        setAccuracy(response.accuracy);
        setModalMessage(response.message);
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

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    // Navigate to new URL with the selected difficulty
    history.push(`/exercise/panning/${newDifficulty}`);
  };

  const formatPanValue = (value: number) => {
    const percentage = Math.round(value * 100);
    if (percentage < -5) return `${Math.abs(percentage)}% L`;
    if (percentage > 5) return `${percentage}% R`;
    return 'Center';
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/main" />
            </IonButtons>
            <IonTitle>Panning Exercise</IonTitle>
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
            <IonTitle>Panning Exercise</IonTitle>
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
            <IonBackButton defaultHref="/main" />
          </IonButtons>
          <IonTitle>Panning Exercise</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Difficulty selector */}
        <IonCard className="difficulty-card">
          <IonCardContent>
            <div className="difficulty-header">
              <h3>Difficulty Level</h3>
              <IonBadge color={currentDifficulty === 'easy' ? 'success' : currentDifficulty === 'medium' ? 'warning' : 'danger'}>
                {currentDifficulty.toUpperCase()}
              </IonBadge>
            </div>
            <IonSegment
              value={currentDifficulty}
              onIonChange={(e: CustomEvent) => handleDifficultyChange(e.detail.value as 'easy' | 'medium' | 'hard')}
            >
              <IonSegmentButton value="easy">
                <IonLabel>
                  <h3>Easy</h3>
                  <p>L / C / R</p>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="medium">
                <IonLabel>
                  <h3>Medium</h3>
                  <p>5 positions</p>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="hard">
                <IonLabel>
                  <h3>Hard</h3>
                  <p>Any position</p>
                </IonLabel>
              </IonSegmentButton>
            </IonSegment>
            {exercise.difficultyInfo && (
              <p className="difficulty-description">{exercise.difficultyInfo}</p>
            )}
          </IonCardContent>
        </IonCard>

        {/* Progress indicator */}
        <div className="progress-info">
          <p>Question {questionCount} • Score: {score} • Points: {exercise.points}</p>
          <IonProgressBar value={0.1} buffer={0.2} />
        </div>

        {/* Question card */}
        <IonCard className="question-card">
          <IonCardHeader>
            <IonCardTitle>{exercise.question}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="sound-info">
              <p><strong>Sound:</strong> {exercise.sound.displayName}</p>
              <p className="sound-description">{exercise.sound.description}</p>
            </div>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={() => playPannedSound()}
                disabled={isPlaying}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Playing...' : 'Play Sound'}
              </IonButton>
              <p className="audio-hint">
                <IonIcon icon={headset} /> Use headphones for best results
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Panning slider */}
        <IonCard className="panning-card">
          <IonCardContent>
            <div className="panning-header">
              <h3>Adjust the slider to match the sound position:</h3>
              <IonBadge color="primary" className="pan-display">
                {formatPanValue(userPanValue)}
              </IonBadge>
            </div>

            <div className="panning-slider">
              <div className="slider-labels">
                <span className="slider-label-left">L</span>
                <span className="slider-label-right">R</span>
              </div>
              <IonRange
                pin={true}
                pinFormatter={(value: number) => formatPanValue(value)}
                min={-1}
                max={1}
                step={0.1}
                value={userPanValue}
                onIonChange={e => setUserPanValue(e.detail.value as number)}
                disabled={isAnswered}
                color="primary"
                className="full-width-slider"
              />
            </div>

            <div className="test-controls">
              <IonButton
                size="small"
                fill="clear"
                onClick={() => playPannedSound(userPanValue)}
                disabled={isAnswered || isPlaying}
              >
                Test Your Setting
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Submit button */}
        {!isAnswered && (
          <IonButton
            expand="block"
            onClick={handleSubmitAnswer}
            className="submit-button"
          >
            Submit Answer
          </IonButton>
        )}


        {/* Exercise Completion Modal */}
        <ExerciseCompletionModal
          isOpen={showModal}
          onClose={handleModalClose}
          onNext={handleNextQuestion}
          isCorrect={isCorrect}
          message={modalMessage}
          score={score}
          pointsEarned={exercise?.points}
          correctAnswer={exercise?.panDescription}
          showNextButton={isAnswered}
          userGuess={formatPanValue(userPanValue)}
          accuracy={accuracy}
          onPlayCorrectAnswer={() => playPannedSound(exercise?.correctPanValue || 0)}
          isPlaying={isPlaying}
        />
      </IonContent>
    </IonPage>
  );
};

export default PanningExercise;