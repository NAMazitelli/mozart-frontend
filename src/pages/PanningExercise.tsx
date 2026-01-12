import React, { useState, useEffect, useRef } from 'react';
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
  IonLabel,
  IonToggle
} from '@ionic/react';
import { playOutline, volumeHighOutline, checkmarkCircle, closeCircle, headset, swapHorizontal } from 'ionicons/icons';
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
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPanToggle, setShowPanToggle] = useState(false);
  const [usePanning, setUsePanning] = useState(false);

  // Audio references for continuous playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);

  // Initialize Audio Context and HTML Audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create Audio Context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create single audio element
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.crossOrigin = 'anonymous';

      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Get difficulty from URL params with fallback extraction for mobile
  const currentDifficulty = getDifficultyFromUrl(urlDifficulty, 'Panning');

  // Load exercise
  useEffect(() => {
    loadNewExercise();
  }, []);

  // Handle panning toggle - enable/disable panning effect
  useEffect(() => {
    if (pannerRef.current && isPlaying) {
      if (usePanning) {
        // Apply the exercise's correct panning
        pannerRef.current.pan.value = exercise?.correctPanValue || 0;
      } else {
        // Reset to center (no panning)
        pannerRef.current.pan.value = 0;
      }
    }
  }, [usePanning, exercise?.correctPanValue, isPlaying]);

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
      setShowPanToggle(false);
      setUsePanning(false);
      setQuestionCount(prev => prev + 1);

      // Setup piano loop audio source
      if (audioRef.current) {
        const audioSrc = '/sounds/piano-loop.mp3';
        audioRef.current.src = audioSrc;
      }
    } catch (error) {
      console.error('Panning - Error loading exercise:', error);
      logApiCall('Panning', 'panning', currentDifficulty, true);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (!audioRef.current || !audioContextRef.current || isPlaying || !exercise) return;

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Setup Web Audio routing if not already connected
      if (!sourceNodeRef.current) {
        // Create source from audio element
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

        // Create gain and panner nodes
        gainRef.current = audioContextRef.current.createGain();
        pannerRef.current = audioContextRef.current.createStereoPanner();

        // Configure gain
        gainRef.current.gain.value = 1.0;

        // Start with no panning (center)
        pannerRef.current.pan.value = 0;

        // Connect: source -> gain -> panner -> destination
        sourceNodeRef.current.connect(gainRef.current);
        gainRef.current.connect(pannerRef.current);
        pannerRef.current.connect(audioContextRef.current.destination);
      }

      setIsPlaying(true);
      setShowPanToggle(true);
      await audioRef.current.play();

      // Auto-stop after 10 seconds for demo
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          stopAudio();
        }
      }, 10000);

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise) return;

    setIsAnswered(true);
    stopAudio();

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
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={isPlaying ? stopAudio : playAudio}
                disabled={!exercise}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Stop Audio' : 'Play Audio'}
              </IonButton>

              {/* Panning Toggle */}
              <IonItem>
                <IonIcon icon={swapHorizontal} slot="start" />
                <IonLabel>Panning Toggle - {usePanning ? 'ON' : 'OFF'}</IonLabel>
                <IonToggle
                  checked={usePanning}
                  onIonChange={(e) => setUsePanning(e.detail.checked)}
                  disabled={!isPlaying}
                  color="primary"
                />
              </IonItem>

              <p className="audio-hint">
                <IonIcon icon={headset} /> Use headphones for best results
              </p>
              <p className="playback-status">
                <IonIcon icon={volumeHighOutline} />
                {isPlaying ? (usePanning ? 'Playing with panning applied' : 'Playing original (centered)') : 'Click play to hear the audio'}
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
              <p className="test-hint">
                Use the toggle above to compare original vs. panned audio while adjusting the slider
              </p>
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
          onPlayCorrectAnswer={undefined}
          isPlaying={false}
        />
      </IonContent>
    </IonPage>
  );
};

export default PanningExercise;