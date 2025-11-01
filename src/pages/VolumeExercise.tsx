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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonRange,
  IonItem
} from '@ionic/react';
import { playOutline, volumeHighOutline, checkmarkCircle, closeCircle, musicalNote } from 'ionicons/icons';
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
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<'ready' | 'playing-first' | 'pausing' | 'playing-second' | 'finished'>('ready');

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

  // Reload exercise when difficulty changes
  useEffect(() => {
    if (questionCount > 0) {
      loadNewExercise();
    }
  }, [difficulty]);

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      const response = await volumeService.getVolumeExercise(difficulty);
      setExercise(response);
      setUserVolumeDifference(0); // Reset slider to center
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setPlaybackStatus('ready');
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error loading exercise:', error);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const playSequentialNotes = async () => {
    if (!audioContext || !exercise || isPlaying) {
      console.error('Audio context, exercise not available, or already playing');
      return;
    }

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    setIsPlaying(true);
    setPlaybackStatus('playing-first');

    // Play first note (reference volume)
    await playNote(exercise.note.frequency, exercise.referenceGain, 1.0);

    // 2 second pause
    setPlaybackStatus('pausing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Play second note (different volume)
    setPlaybackStatus('playing-second');
    await playNote(exercise.note.frequency, exercise.secondGain, 1.0);

    setPlaybackStatus('finished');
    setIsPlaying(false);
  };

  const playNote = (frequency: number, gain: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContext) {
        resolve();
        return;
      }

      // Create oscillator and gain node
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
      gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration - 0.05);

      // Play note
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      oscillator.onended = () => {
        resolve();
      };

      // Fallback in case onended doesn't fire
      setTimeout(() => resolve(), duration * 1000 + 100);
    });
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise) return;

    setIsAnswered(true);

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

  const getPlaybackStatusText = () => {
    switch (playbackStatus) {
      case 'playing-first': return 'Playing first note...';
      case 'pausing': return 'Pause (listening)...';
      case 'playing-second': return 'Playing second note...';
      case 'finished': return 'Finished - Make your guess!';
      default: return 'Click Play to hear both notes';
    }
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
            <div className="note-info">
              <p><strong>Note:</strong> {exercise.note.displayName} ({Math.round(exercise.note.frequency)} Hz)</p>
            </div>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={playSequentialNotes}
                disabled={isPlaying}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Playing...' : 'Play Both Notes'}
              </IonButton>
              <p className="playback-status">
                <IonIcon icon={musicalNote} /> {getPlaybackStatusText()}
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
            disabled={playbackStatus === 'ready'}
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