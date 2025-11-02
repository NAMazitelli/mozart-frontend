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
  IonIcon,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonProgressBar,
  IonBadge,
  IonRange,
  IonGrid,
  IonRow,
  IonCol,
  IonToggle,
  IonItem,
  IonLabel
} from '@ionic/react';
import { playOutline, checkmarkCircle, closeCircle, radio, musicalNote, swapHorizontal } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { equalizingService, EqualizingExercise } from '../services/api';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import './EqualizingExercise.css';

const EqualizingExercisePage: React.FC = () => {
  const { difficulty } = useParams<{ difficulty: string }>();
  const [exercise, setExercise] = useState<EqualizingExercise | null>(null);
  const [userFrequency, setUserFrequency] = useState<number>(1000);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEQToggle, setShowEQToggle] = useState(false);
  const [useEQ, setUseEQ] = useState(false);
  const [validationResponse, setValidationResponse] = useState<any>(null);

  // Single Audio with VERY Dramatic Web Audio Filter
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Use difficulty from URL params, default to 'easy'
  const currentDifficulty = difficulty || 'easy';

  // Initialize Single Audio with Filter Toggle
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

  // Handle EQ toggle - enable/disable Web Audio filter
  useEffect(() => {
    if (filterRef.current && isPlaying) {
      if (useEQ) {
        // Apply filter effect
        filterRef.current.frequency.value = exercise?.targetFrequency || 1000;
        filterRef.current.type = (exercise?.filterType as BiquadFilterType) || 'lowpass';
        filterRef.current.Q.value = 8.0; // Noticeable but not extreme filter
      } else {
        // Bypass filter by using allpass type (passes all frequencies unchanged)
        filterRef.current.type = 'allpass';
        filterRef.current.frequency.value = 1000;
        filterRef.current.Q.value = 0.1;
      }
    }
  }, [useEQ, exercise?.filterType, exercise?.targetFrequency, isPlaying]);

  const loadNewExercise = async () => {
    setLoading(true);
    try {
      const response = await equalizingService.getEqualizingExercise(currentDifficulty);
      setExercise(response);

      // Reset states
      setUserFrequency(1000);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setShowEQToggle(false);
      setUseEQ(false); // This will trigger the filter reset in the useEffect
      setValidationResponse(null);
      setQuestionCount(prev => prev + 1);

      // Reset filter to bypass state if it exists
      if (filterRef.current) {
        filterRef.current.type = 'allpass';
        filterRef.current.frequency.value = 1000;
        filterRef.current.Q.value = 0.1;
      }

      // Setup single audio source
      if (audioRef.current && response.sound.filename) {
        const audioSrc = `/sounds/${response.sound.filename}`;
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
    if (!audioRef.current || !audioContextRef.current || isPlaying) return;

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Setup Web Audio routing if not already connected
      if (!sourceNodeRef.current) {
        // Create source from audio element
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

        // Create filter node
        filterRef.current = audioContextRef.current.createBiquadFilter();
        filterRef.current.type = 'allpass'; // Start in bypass mode
        filterRef.current.frequency.value = 1000;
        filterRef.current.Q.value = 0.1;

        // Create gain node
        gainRef.current = audioContextRef.current.createGain();
        gainRef.current.gain.value = 1.0;

        // Connect: source -> filter -> gain -> destination
        sourceNodeRef.current.connect(filterRef.current);
        filterRef.current.connect(gainRef.current);
        gainRef.current.connect(audioContextRef.current.destination);
      }

      setIsPlaying(true);
      await audioRef.current.play();
      setShowEQToggle(true);

      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, 5000);

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

  const handleAnswerSelection = (answerIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswerIndex(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise) return;

    setIsAnswered(true);
    stopAudio();

    try {
      let response;

      if (exercise.answerType === 'multiple-choice') {
        // Multiple choice validation
        response = await equalizingService.validateEqualizingAnswer({
          exerciseId: exercise.id,
          correctFrequency: exercise.targetFrequency,
          tolerance: exercise.tolerance,
          selectedAnswerIndex: selectedAnswerIndex!,
          correctAnswerIndex: exercise.correctAnswerIndex!
        });
      } else {
        // Slider validation
        response = await equalizingService.validateEqualizingAnswer({
          exerciseId: exercise.id,
          userFrequency,
          correctFrequency: exercise.targetFrequency,
          tolerance: exercise.tolerance
        });
      }

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
            <IonTitle>EQ Exercise</IonTitle>
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
            <IonTitle>EQ Exercise</IonTitle>
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
            EQ - {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
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
              <p><strong>Audio:</strong> {exercise.sound.displayName}</p>
              <p className="sound-description">{exercise.sound.description}</p>
              <p className="eq-info">
                <strong>EQ Applied:</strong> {exercise.eqGainDb > 0 ? '+' : ''}{exercise.eqGainDb}dB
                {exercise.eqGainDb > 0 ? ' boost' : ' cut'} (Q={exercise.qFactor})
              </p>
            </div>

            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={isPlaying ? stopAudio : playAudio}
                disabled={!audioRef.current}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Stop Audio' : 'Play Audio'}
              </IonButton>

              {/* EQ Toggle */}
              {showEQToggle && (
                <IonItem>
                  <IonIcon icon={swapHorizontal} slot="start" />
                  <IonLabel>EQ Toggle - {useEQ ? 'ON' : 'OFF'}</IonLabel>
                  <IonToggle
                    checked={useEQ}
                    onIonChange={(e) => setUseEQ(e.detail.checked)}
                    disabled={!isPlaying}
                    color="primary"
                  />
                </IonItem>
              )}

              <p className="playback-status">
                <IonIcon icon={radio} />
                {isPlaying ? (useEQ ? 'Playing with EQ applied' : 'Playing original (no EQ)') : 'Click play to hear the audio'}
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Answer interface */}
        {exercise.answerType === 'multiple-choice' ? (
          /* Multiple Choice Interface */
          <IonCard className="answer-card">
            <IonCardContent>
              <h3>Select the affected frequency:</h3>
              <IonGrid>
                {exercise.options?.map((option, index) => (
                  <IonRow key={index}>
                    <IonCol>
                      <IonButton
                        expand="block"
                        fill={selectedAnswerIndex === index ? "solid" : "outline"}
                        color={selectedAnswerIndex === index ? "primary" : "medium"}
                        onClick={() => handleAnswerSelection(index)}
                        disabled={isAnswered}
                        className="frequency-option"
                      >
                        {formatFrequency(option)}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        ) : (
          /* Slider Interface */
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

                {/* Show result visualization after answering */}
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
            </IonCardContent>
          </IonCard>
        )}

        {/* Submit button */}
        {!isAnswered && (
          <IonButton
            expand="block"
            onClick={handleSubmitAnswer}
            className="submit-button"
            disabled={
              exercise.answerType === 'multiple-choice'
                ? selectedAnswerIndex === null
                : !showEQToggle
            }
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
          correctAnswer={`${formatFrequency(exercise?.targetFrequency)} (${exercise?.eqGainDb > 0 ? '+' : ''}${exercise?.eqGainDb}dB)`}
          showNextButton={isAnswered}
          userGuess={
            exercise.answerType === 'multiple-choice'
              ? (selectedAnswerIndex !== null ? formatFrequency(exercise.options![selectedAnswerIndex]) : 'No selection')
              : formatFrequency(userFrequency)
          }
          accuracy={accuracy}
          validationDetails={validationResponse}
        />
      </IonContent>
    </IonPage>
  );
};

export default EqualizingExercisePage;