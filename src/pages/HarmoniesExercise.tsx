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
import { harmoniesService } from '../services/api';
import ExerciseCompletionModal from '../components/ExerciseCompletionModal';
import './HarmoniesExercise.css';

interface PianoNote {
  note: string;
  frequency: number;
  displayName: string;
  isBlack: boolean;
}

interface HarmoniesExercise {
  id: string;
  type: string;
  category: string;
  difficulty: string;
  question: string;
  chord: PianoNote[];
  noteCount: number;
  points: number;
  difficultyInfo: string;
  pianoNotes: PianoNote[];
}

const HarmoniesExercise: React.FC = () => {
  const { difficulty } = useParams<{ difficulty: string }>();
  const [exercise, setExercise] = useState<HarmoniesExercise | null>(null);
  const [userNotes, setUserNotes] = useState<string[]>([]);
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
      const response = await harmoniesService.getHarmoniesExercise(currentDifficulty);
      setExercise(response);
      setUserNotes([]);
      setIsAnswered(false);
      setIsCorrect(false);
      setAccuracy(0);
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

  const playNote = (frequency: number, duration: number = 2): Promise<void> => {
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
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
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

  const playChord = async () => {
    if (!exercise || isPlaying) return;

    setIsPlaying(true);

    // Play all notes simultaneously
    const notePromises = exercise.chord.map(note => playNote(note.frequency));
    await Promise.all(notePromises);

    setIsPlaying(false);
  };

  const playSelectedNotes = async () => {
    if (!exercise || isPlaying || userNotes.length === 0) return;

    setIsPlaying(true);

    // Find the piano notes corresponding to selected notes
    const selectedPianoNotes = exercise.pianoNotes.filter(note =>
      userNotes.includes(note.displayName)
    );

    // Play all selected notes simultaneously
    const notePromises = selectedPianoNotes.map(note => playNote(note.frequency));
    await Promise.all(notePromises);

    setIsPlaying(false);
  };

  const handlePianoKeyPress = async (note: PianoNote) => {
    if (isAnswered) return;

    // Play the note
    await playNote(note.frequency, 0.3);

    // Toggle note selection
    setUserNotes(prev => {
      if (prev.includes(note.displayName)) {
        // Remove note if already selected
        return prev.filter(n => n !== note.displayName);
      } else {
        // Add note if not selected
        return [...prev, note.displayName];
      }
    });
  };

  const clearSelection = () => {
    if (!isAnswered) {
      setUserNotes([]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isAnswered || !exercise || userNotes.length === 0) return;

    setIsAnswered(true);

    try {
      const correctNotes = exercise.chord.map(note => note.displayName);
      const response = await harmoniesService.validateHarmoniesAnswer({
        exerciseId: exercise.id,
        userNotes,
        correctNotes
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
    const isSelected = userNotes.includes(note.displayName);
    const isCorrect = validationResponse?.matchedNotes?.includes(note.displayName);
    const isWrong = isAnswered && isSelected && !isCorrect;
    const isMissed = isAnswered && !isSelected && validationResponse?.correctNotes?.includes(note.displayName);

    return (
      <div
        key={note.note}
        className={`piano-key ${note.isBlack ? 'black-key' : 'white-key'}
          ${isSelected ? 'selected' : ''}
          ${isCorrect ? 'correct' : ''}
          ${isWrong ? 'wrong' : ''}
          ${isMissed ? 'missed' : ''}`}
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
              <IonBackButton defaultHref={`/difficulty/harmonies`} />
            </IonButtons>
            <IonTitle>Harmonies Exercise</IonTitle>
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
              <IonBackButton defaultHref={`/difficulty/harmonies`} />
            </IonButtons>
            <IonTitle>Harmonies Exercise</IonTitle>
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
            <IonBackButton defaultHref={`/difficulty/harmonies`} />
          </IonButtons>
          <IonTitle>
            Harmonies - {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
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
            <div className="chord-info">
              <p><strong>Notes to identify:</strong> {exercise.noteCount}</p>
              <p className="difficulty-description">{exercise.difficultyInfo}</p>
            </div>
            <div className="audio-controls">
              <IonButton
                size="large"
                fill="outline"
                className="play-button"
                onClick={playChord}
                disabled={isPlaying}
              >
                <IonIcon icon={playOutline} slot="start" />
                {isPlaying ? 'Playing...' : 'Play Chord'}
              </IonButton>
              <p className="audio-hint">
                <IonIcon icon={musicalNote} /> Listen carefully and identify all notes in the harmony
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* User selection display */}
        <IonCard className="selection-card">
          <IonCardContent>
            <div className="selection-header">
              <h3>Your selection ({userNotes.length}/{exercise.noteCount}):</h3>
              <div className="selection-buttons">
                {!isAnswered && userNotes.length > 0 && (
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={playSelectedNotes}
                    disabled={isPlaying}
                  >
                    <IonIcon icon={playOutline} slot="start" />
                    {isPlaying ? 'Playing...' : 'Preview'}
                  </IonButton>
                )}
                {!isAnswered && (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={clearSelection}
                    disabled={userNotes.length === 0}
                  >
                    <IonIcon icon={refresh} slot="start" />
                    Clear
                  </IonButton>
                )}
              </div>
            </div>
            <div className="selection-display">
              {userNotes.length === 0 ? (
                <p className="empty-selection">Click piano keys to select notes...</p>
              ) : (
                <div className="note-selection">
                  {userNotes.sort().map((note, index) => (
                    <span key={index} className="selected-note">
                      {note}
                      {index < userNotes.length - 1 && ' + '}
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
            <p className="piano-instruction">
              {isAnswered ? 'Results shown on piano:' : 'Click keys to select/deselect notes'}
            </p>
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
            {isAnswered && (
              <div className="piano-legend">
                <div className="legend-item">
                  <div className="legend-color correct"></div>
                  <span>Correct</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color wrong"></div>
                  <span>Wrong selection</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color missed"></div>
                  <span>Missed note</span>
                </div>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Submit button */}
        {!isAnswered && (
          <IonButton
            expand="block"
            onClick={handleSubmitAnswer}
            className="submit-button"
            disabled={userNotes.length === 0}
          >
            Submit Selection ({userNotes.length} notes)
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
          correctAnswer={exercise?.chord?.map(note => note.displayName).join(', ') || 'Not available'}
          showNextButton={isAnswered}
          userGuess={userNotes.join(', ')}
          accuracy={accuracy}
          validationDetails={validationResponse}
        />
      </IonContent>
    </IonPage>
  );
};

export default HarmoniesExercise;