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
  IonBadge
} from '@ionic/react';
import { playOutline, checkmarkCircle, closeCircle, refresh, musicalNote } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { intervalsService } from '../services/api';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import { getDifficultyFromUrl, logApiCall } from '../utils/exerciseUtils';
import './IntervalsExercise.css';

interface PianoNote {
  note: string;
  frequency: number;
  displayName: string;
  isBlack: boolean;
}

interface IntervalsExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  sequence: PianoNote[];
  noteCount: number;
  points: number;
  difficultyInfo: string;
  pianoNotes: PianoNote[];
}

const IntervalsExercise: React.FC = () => {
  const { difficulty } = useParams<{ difficulty: string }>();
  const [exercise, setExercise] = useState<IntervalsExercise | null>(null);
  const [userSequence, setUserSequence] = useState<string[]>([]);
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
  const [validationResponse, setValidationResponse] = useState<any>(null);
  // Use difficulty from URL params with fallback extraction for mobile
  const currentDifficulty = getDifficultyFromUrl(difficulty, 'Intervals');

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
      logApiCall('Intervals', 'intervals', currentDifficulty);
      const response = await intervalsService.getIntervalsExercise(currentDifficulty);

      // Debug: Log the exercise data and frequencies
      console.log('Intervals - Exercise loaded:', response);
      console.log('Intervals - Sequence notes:', response.sequence.map(note => ({
        note: note.displayName,
        frequency: note.frequency
      })));
      console.log('Intervals - Piano notes:', response.pianoNotes.map(note => ({
        note: note.displayName,
        frequency: note.frequency,
        isBlack: note.isBlack
      })));

      // Debug: Check piano note filtering
      const whiteKeys = response.pianoNotes.filter(note => !note.isBlack);
      const blackKeys = response.pianoNotes.filter(note => note.isBlack);
      console.log('Intervals - White keys:', whiteKeys.map(n => n.displayName));
      console.log('Intervals - Black keys:', blackKeys.map(n => n.displayName));

      setExercise(response);
      setUserSequence([]);
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
      setValidationResponse(null);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Intervals - Error loading exercise:', error);
      logApiCall('Intervals', 'intervals', currentDifficulty, true);
      setModalMessage('Failed to load exercise. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const playNote = (frequency: number, duration: number = 0.5): Promise<void> => {
    console.log('Intervals - Playing note with frequency:', frequency);

    return new Promise((resolve) => {
      if (!audioContext) {
        resolve();
        return;
      }

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
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
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
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

  const playSequence = async () => {
    if (!exercise || isPlaying) return;

    console.log('Intervals - Playing sequence:', exercise.sequence);
    setIsPlaying(true);

    for (let i = 0; i < exercise.sequence.length; i++) {
      console.log(`Intervals - Playing sequence note ${i + 1}:`, exercise.sequence[i]);
      await playNote(exercise.sequence[i].frequency);
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second pause between notes
    }

    setIsPlaying(false);
  };

  const handlePianoKeyPress = async (note: PianoNote) => {
    if (isAnswered || userSequence.length >= (exercise?.noteCount || 0)) return;

    console.log('Intervals - Piano key pressed:', note);

    // Play the note
    await playNote(note.frequency, 0.3);

    // Add to user sequence
    setUserSequence(prev => [...prev, note.displayName]);
  };

  const clearSequence = () => {
    if (!isAnswered) {
      setUserSequence([]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise || userSequence.length !== exercise.noteCount) return;

    setIsAnswered(true);

    try {
      const correctSequence = exercise.sequence.map(note => note.displayName);
      const response = await intervalsService.validateIntervalsAnswer({
        exerciseId: exercise.id,
        userSequence,
        correctSequence
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

  const renderPianoKey = (note: PianoNote, index: number) => {
    const isUserPlayed = userSequence.includes(note.displayName);

    return (
      <div
        key={note.note}
        className={`piano-key ${note.isBlack ? 'black-key' : 'white-key'} ${isUserPlayed ? 'user-played' : ''}`}
        onClick={() => handlePianoKeyPress(note)}
        style={{
          left: note.isBlack ? `${(index - 0.5) * (100 / 12)}%` : undefined,
        }}
      >
        <span className="key-label">{note.displayName}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/difficulty/intervals`} />
            </IonButtons>
            <IonTitle>Intervals Exercise</IonTitle>
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
              <IonBackButton defaultHref={`/difficulty/intervals`} />
            </IonButtons>
            <IonTitle>Intervals Exercise</IonTitle>
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
            <IonBackButton defaultHref={`/difficulty/intervals`} />
          </IonButtons>
          <IonTitle>
            Intervals - {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
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
            <div className="sequence-info">
              <p><strong>Notes to remember:</strong> {exercise.noteCount}</p>
              <p className="difficulty-description">{exercise.difficultyInfo}</p>
            </div>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={playSequence}
                disabled={isPlaying}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Playing...' : 'Play Sequence'}
              </IonButton>
              <p className="audio-hint">
                <IonIcon icon={musicalNote} /> Listen carefully and replay the sequence on the piano
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* User sequence display */}
        <IonCard className="sequence-card">
          <IonCardContent>
            <div className="sequence-header">
              <h3>Your sequence ({userSequence.length}/{exercise.noteCount}):</h3>
              {!isAnswered && (
                <IonButton
                  size="small"
                  fill="clear"
                  onClick={clearSequence}
                  disabled={userSequence.length === 0}
                >
                  <IonIcon icon={refresh} slot="start" />
                  Clear
                </IonButton>
              )}
            </div>
            <div className="sequence-display">
              {userSequence.length === 0 ? (
                <p className="empty-sequence">Play notes on the piano below...</p>
              ) : (
                <div className="note-sequence">
                  {userSequence.map((note, index) => (
                    <span key={index} className="sequence-note">
                      {note}
                      {index < userSequence.length - 1 && ' → '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Piano keyboard */}
        <IonCard className="piano-card">
          <IonCardContent>
            <h3>Piano</h3>
            <div className="piano-container">
              <div className="piano-keyboard">
                {/* White keys */}
                {exercise.pianoNotes.filter(note => !note.isBlack).map((note, index) =>
                  renderPianoKey(note, exercise.pianoNotes.indexOf(note))
                )}
                {/* Black keys */}
                {exercise.pianoNotes.filter(note => note.isBlack).map((note, index) =>
                  renderPianoKey(note, exercise.pianoNotes.indexOf(note))
                )}
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Submit button */}
        {!isAnswered && (
          <IonButton
            expand="block"
            onClick={handleSubmitAnswer}
            className="submit-button"
            disabled={userSequence.length !== exercise.noteCount}
          >
            Submit Sequence ({userSequence.length}/{exercise.noteCount})
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
          correctAnswer={exercise?.sequence?.map(note => note.displayName).join(', ') || 'Not available'}
          showNextButton={isAnswered}
          userGuess={userSequence.join(', ')}
          accuracy={accuracy}
          validationDetails={validationResponse}
        />
      </IonContent>
    </IonPage>
  );
};

export default IntervalsExercise;