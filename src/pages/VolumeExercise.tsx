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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonRange,
  IonItem,
  IonToggle
} from '@ionic/react';
import { playOutline, volumeHighOutline, checkmarkCircle, closeCircle, musicalNote, swapHorizontal } from 'ionicons/icons';
import { volumeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import './VolumeExercise.css';

interface VolumeExercise {
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

const VolumeExercise: React.FC = () => {
  const { isGuest } = useAuth();
  const [exercise, setExercise] = useState<VolumeExercise | null>(null);
  const [userVolumeDifference, setUserVolumeDifference] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolumeToggle, setShowVolumeToggle] = useState(false);
  const [useVolumeDifference, setUseVolumeDifference] = useState(false);

  // Audio references for continuous playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

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
        console.error('Error initializing audio:', error);
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

  // Load exercise
  useEffect(() => {
    loadNewExercise();
  }, []);

  // Reload exercise when difficulty changes
  useEffect(() => {
    if (questionCount > 0) {
      loadNewExercise();
    }
  }, [difficulty]);

  // Handle volume toggle - enable/disable volume difference
  useEffect(() => {
    if (gainRef.current && isPlaying && exercise) {
      const baseVolume = 0.3;
      if (useVolumeDifference) {
        // Apply the exercise's volume difference
        const linearGain = baseVolume * Math.pow(10, exercise.volumeDifference / 20);
        gainRef.current.gain.setValueAtTime(linearGain, audioContextRef.current!.currentTime);
      } else {
        // Reset to reference volume (no difference)
        const linearGain = baseVolume * Math.pow(10, exercise.referenceGain / 20);
        gainRef.current.gain.setValueAtTime(linearGain, audioContextRef.current!.currentTime);
      }
    }
  }, [useVolumeDifference, exercise?.volumeDifference, exercise?.referenceGain, isPlaying]);

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      const response = await volumeService.getVolumeExercise(difficulty);
      setExercise(response);
      setUserVolumeDifference(0); // Reset slider to center
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setShowVolumeToggle(false);
      setUseVolumeDifference(false);
      setQuestionCount(prev => prev + 1);

      // Setup piano loop audio source
      if (audioRef.current) {
        const audioSrc = '/sounds/piano-loop.mp3';
        audioRef.current.src = audioSrc;
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
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

        // Create gain node
        gainRef.current = audioContextRef.current.createGain();

        // Start with reference volume (no difference)
        const baseVolume = 1.0;
        const linearGain = baseVolume * Math.pow(10, exercise.referenceGain / 20);
        gainRef.current.gain.value = linearGain;

        // Connect: source -> gain -> destination
        sourceNodeRef.current.connect(gainRef.current);
        gainRef.current.connect(audioContextRef.current.destination);
      }

      setIsPlaying(true);
      setShowVolumeToggle(true);
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
        const difference = Math.abs(userVolumeDifference - exercise.volumeDifference);
        const isCorrect = difference <= exercise.tolerance;
        const accuracy = Math.max(0, (1 - difference / (exercise.tolerance * 2)) * 100);

        setIsCorrect(isCorrect);
        setAccuracy(accuracy);

        if (isCorrect) {
          setModalMessage(`Correct! The second note was ${exercise.volumeDifference > 0 ? '+' : ''}${exercise.volumeDifference}dB ${exercise.volumeDifference > 0 ? 'louder' : exercise.volumeDifference < 0 ? 'quieter' : 'the same volume'}.`);
          setScore(prev => prev + exercise.points);
        } else {
          setModalMessage(`Not quite right. The second note was ${exercise.volumeDifference > 0 ? '+' : ''}${exercise.volumeDifference}dB ${exercise.volumeDifference > 0 ? 'louder' : exercise.volumeDifference < 0 ? 'quieter' : 'the same volume'}. You guessed ${userVolumeDifference > 0 ? '+' : ''}${userVolumeDifference}dB.`);
        }

        setShowModal(true);
      } else {
        // For logged-in users, use API validation
        const response = await volumeService.validateVolumeAnswer({
          exerciseId: exercise.id,
          userAnswer: userVolumeDifference,
          correctAnswer: exercise.volumeDifference,
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
    setDifficulty(newDifficulty);
    setScore(0);
    setQuestionCount(0);
  };

  const formatVolumeValue = (value: number) => {
    return `${value > 0 ? '+' : ''}${value} dB`;
  };


  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/main" />
            </IonButtons>
            <IonTitle>Volume Exercise</IonTitle>
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
            <IonTitle>Volume Exercise</IonTitle>
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
          <IonTitle>Volume Exercise</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Difficulty selector */}
        <IonCard className="difficulty-card">
          <IonCardContent>
            <div className="difficulty-header">
              <h3>Difficulty Level</h3>
              <IonBadge color={difficulty === 'easy' ? 'success' : difficulty === 'medium' ? 'warning' : 'danger'}>
                {difficulty.toUpperCase()}
              </IonBadge>
            </div>
            <IonSegment
              value={difficulty}
              onIonChange={(e) => handleDifficultyChange(e.detail.value as 'easy' | 'medium' | 'hard')}
            >
              <IonSegmentButton value="easy">
                <IonLabel>
                  <h3>Easy</h3>
                  <p>±4 dB</p>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="medium">
                <IonLabel>
                  <h3>Medium</h3>
                  <p>±2.5 dB</p>
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="hard">
                <IonLabel>
                  <h3>Hard</h3>
                  <p>±1.5 dB</p>
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

              {/* Volume Toggle */}
              <IonItem>
                <IonIcon icon={swapHorizontal} slot="start" />
                <IonLabel>Volume Toggle - {useVolumeDifference ? 'ON' : 'OFF'}</IonLabel>
                <IonToggle
                  checked={useVolumeDifference}
                  onIonChange={(e) => setUseVolumeDifference(e.detail.checked)}
                  disabled={!isPlaying}
                  color="primary"
                />
              </IonItem>

              <p className="playback-status">
                <IonIcon icon={volumeHighOutline} />
                {isPlaying ? (useVolumeDifference ? 'Playing with volume difference applied' : 'Playing reference volume') : 'Click play to hear the audio'}
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Volume difference slider */}
        <IonCard className="volume-card">
          <IonCardContent>
            <div className="volume-header">
              <h3>Volume difference of second note:</h3>
              <IonBadge color="primary" className="volume-display">
                {formatVolumeValue(userVolumeDifference)}
              </IonBadge>
            </div>

            <div className="volume-slider">
              <div className="slider-labels">
                <span className="slider-label-left">Quieter</span>
                <span className="slider-label-center">Same</span>
                <span className="slider-label-right">Louder</span>
              </div>
              <IonRange
                pin={true}
                pinFormatter={(value: number) => formatVolumeValue(value)}
                min={-20}
                max={20}
                step={1}
                value={userVolumeDifference}
                onIonChange={e => setUserVolumeDifference(e.detail.value as number)}
                disabled={isAnswered}
                color="primary"
                className="full-width-slider"
              />
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

        {/* Results */}

        {/* Exercise Completion Modal */}
        <ExerciseCompletionModal
          isOpen={showModal}
          onClose={handleModalClose}
          onNext={handleNextQuestion}
          isCorrect={isCorrect}
          message={modalMessage}
          score={score}
          pointsEarned={exercise?.points}
          correctAnswer={`${exercise?.note?.displayName} (${exercise?.volumeDifference > 0 ? '+' : ''}${exercise?.volumeDifference}dB difference)`}
          showNextButton={isAnswered}
          userGuess={formatVolumeValue(userVolumeDifference)}
          accuracy={accuracy}
        />
      </IonContent>
    </IonPage>
  );
};

export default VolumeExercise;