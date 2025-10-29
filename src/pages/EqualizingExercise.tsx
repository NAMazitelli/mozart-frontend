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
  IonIcon,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonProgressBar,
  IonBadge,
  IonRange
} from '@ionic/react';
import { playOutline, checkmarkCircle, closeCircle, radio, musicalNote } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { equalizingService } from '../services/api';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import './EqualizingExercise.css';

interface EqualizingExercise {
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

const EqualizingExercise: React.FC = () => {
  const { difficulty } = useParams<{ difficulty: string }>();
  const [exercise, setExercise] = useState<EqualizingExercise | null>(null);
  const [userFrequency, setUserFrequency] = useState<number>(1000);
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
  const [playbackStatus, setPlaybackStatus] = useState<'ready' | 'playing-original' | 'pausing' | 'playing-eq' | 'finished'>('ready');
  const [validationResponse, setValidationResponse] = useState<any>(null);

  // Use difficulty from URL params, default to 'easy'
  const currentDifficulty = difficulty || 'easy';

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

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      const response = await equalizingService.getEqualizingExercise(currentDifficulty);
      setExercise(response);
      setUserFrequency(1000); // Reset slider to middle
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setPlaybackStatus('ready');
      setValidationResponse(null);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error loading exercise:', error);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const createBiquadFilter = (audioContext: AudioContext, frequency: number, qFactor: number, gainDb: number): BiquadFilterNode => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
    filter.Q.setValueAtTime(qFactor, audioContext.currentTime);
    filter.gain.setValueAtTime(gainDb, audioContext.currentTime);
    return filter;
  };

  const playSequentialEQComparison = async () => {
    if (!audioContext || !exercise || isPlaying) {
      console.error('Audio context, exercise not available, or already playing');
      return;
    }

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    setIsPlaying(true);
    setPlaybackStatus('playing-original');

    // Play original sound (no EQ)
    await playSound(exercise.sound.frequency, exercise.sound.type as OscillatorType, 1.5, false);

    // 2 second pause
    setPlaybackStatus('pausing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Play EQ'd sound
    setPlaybackStatus('playing-eq');
    await playSound(exercise.sound.frequency, exercise.sound.type as OscillatorType, 1.5, true);

    setPlaybackStatus('finished');
    setIsPlaying(false);
  };

  const playSound = (frequency: number, waveType: OscillatorType, duration: number, applyEQ: boolean): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContext || !exercise) {
        resolve();
        return;
      }

      // Create oscillator and gain node
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Set up audio chain
      let audioChain: AudioNode = oscillator;
      audioChain.connect(gainNode);

      // Apply EQ filter if requested
      if (applyEQ) {
        const eqFilter = createBiquadFilter(
          audioContext,
          exercise.targetFrequency,
          exercise.qFactor,
          exercise.eqGainDb
        );

        // Insert filter into chain: oscillator -> filter -> gain
        oscillator.connect(eqFilter);
        eqFilter.connect(gainNode);
      } else {
        oscillator.connect(gainNode);
      }

      // Connect to destination
      gainNode.connect(audioContext.destination);

      // Configure oscillator
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      // Configure gain (volume envelope)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration - 0.05);

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      oscillator.onended = () => {
        resolve();
      };

      // Fallback in case onended doesn't fire
      setTimeout(() => resolve(), duration * 1000 + 100);
    });
  };

  const playTestFrequency = async (frequency: number) => {
    if (!audioContext || !exercise || isPlaying) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    setIsPlaying(true);
    await playTestSound(exercise.sound.frequency, exercise.sound.type as OscillatorType, 1.5, true, frequency);
    setIsPlaying(false);
  };

  const playTestSound = (frequency: number, waveType: OscillatorType, duration: number, applyEQ: boolean, testFreq?: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContext || !exercise) {
        resolve();
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      let audioChain: AudioNode = oscillator;
      audioChain.connect(gainNode);

      if (applyEQ) {
        const eqFilter = createBiquadFilter(
          audioContext,
          testFreq || exercise.targetFrequency,
          exercise.qFactor,
          exercise.eqGainDb
        );

        oscillator.connect(eqFilter);
        eqFilter.connect(gainNode);
      } else {
        oscillator.connect(gainNode);
      }

      gainNode.connect(audioContext.destination);

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration - 0.05);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      oscillator.onended = () => {
        resolve();
      };

      setTimeout(() => resolve(), duration * 1000 + 100);
    });
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise) return;

    setIsAnswered(true);

    try {
      const response = await equalizingService.validateEqualizingAnswer({
        exerciseId: exercise.id,
        userFrequency,
        correctFrequency: exercise.targetFrequency,
        tolerance: exercise.tolerance
      });

      setValidationResponse(response);
      setIsCorrect(response.isCorrect);
      setAccuracy(response.accuracy);
      setModalMessage(response.message);
      setShowModal(true);

      if (response.isCorrect) {
        setScore(prev => prev + exercise.points);
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

  const getPlaybackStatusText = () => {
    switch (playbackStatus) {
      case 'playing-original': return 'Playing original sound...';
      case 'pausing': return 'Pause (comparing)...';
      case 'playing-eq': return 'Playing EQ\'d sound...';
      case 'finished': return 'Finished - Adjust the slider to match the affected frequency!';
      default: return 'Click Play to compare original vs EQ\'d sound';
    }
  };

  const formatFrequency = (freq: number) => {
    return `${Math.round(freq)} Hz`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/difficulty/equalizing`} />
            </IonButtons>
            <IonTitle>Equalizing Exercise</IonTitle>
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
              <IonBackButton defaultHref={`/difficulty/equalizing`} />
            </IonButtons>
            <IonTitle>Equalizing Exercise</IonTitle>
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
            <IonBackButton defaultHref={`/difficulty/equalizing`} />
          </IonButtons>
          <IonTitle>
            Equalizing - {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Progress indicator */}
        <div className="progress-info">
          <p>Question {questionCount} • Score: {score} • Points: {exercise.points}</p>
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
            <div className="sound-info">
              <p><strong>Sound:</strong> {exercise.sound.displayName}</p>
              <p className="sound-description">{exercise.sound.description}</p>
            </div>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={playSequentialEQComparison}
                disabled={isPlaying}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Playing...' : 'Compare Sounds'}
              </IonButton>
              <p className="playback-status">
                <IonIcon icon={radio} /> {getPlaybackStatusText()}
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Frequency slider */}
        <IonCard className="frequency-card">
          <IonCardContent>
            <div className="frequency-header">
              <h3>Adjust the slider to the affected frequency:</h3>
              <IonBadge color="primary" className="frequency-display">
                {formatFrequency(userFrequency)}
              </IonBadge>
            </div>

            <div className="frequency-slider">
              <div className="slider-labels">
                <span className="slider-label-left">0 Hz</span>
                <span className="slider-label-right">2000 Hz</span>
              </div>
              <IonRange
                pin={true}
                pinFormatter={(value: number) => formatFrequency(value)}
                min={0}
                max={2000}
                step={50}
                value={userFrequency}
                onIonChange={e => setUserFrequency(e.detail.value as number)}
                disabled={isAnswered}
                color="primary"
                className="full-width-slider"
              />

              {/* Acceptance range visualization after answering */}
              {isAnswered && validationResponse && (
                <div className="acceptance-range">
                  <div
                    className="range-bar"
                    style={{
                      left: `${(validationResponse.acceptanceRangeMin / 2000) * 100}%`,
                      width: `${((validationResponse.acceptanceRangeMax - validationResponse.acceptanceRangeMin) / 2000) * 100}%`,
                    }}
                  />
                  <div
                    className="correct-frequency-marker"
                    style={{
                      left: `${(exercise.targetFrequency / 2000) * 100}%`,
                    }}
                  />
                  <div
                    className="user-frequency-marker"
                    style={{
                      left: `${(userFrequency / 2000) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="test-controls">
              <IonButton
                size="small"
                fill="clear"
                onClick={() => playTestFrequency(userFrequency)}
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
            disabled={playbackStatus === 'ready'}
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
          correctAnswer={`${exercise?.sound?.displayName} (${exercise?.targetFrequency}Hz, ${exercise?.isBoost ? '+' : ''}${exercise?.eqGainDb}dB)`}
          showNextButton={isAnswered}
          userGuess={formatFrequency(userFrequency)}
          accuracy={accuracy}
          validationDetails={validationResponse}
        />
      </IonContent>
    </IonPage>
  );
};

export default EqualizingExercise;