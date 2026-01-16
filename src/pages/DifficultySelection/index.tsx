import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge
} from '@ionic/react';
import {
  musicalNote,
  headset,
  volumeHigh,
  checkmarkCircle,
  star,
  flame
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import './DifficultySelection.css';

interface ExerciseType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const exerciseTypes: { [key: string]: ExerciseType } = {
  'guess-note': {
    id: 'guess-note',
    name: 'Notes',
    icon: '🎵',
    description: 'Identify individual notes and pitches'
  },
  'panning': {
    id: 'panning',
    name: 'Panning',
    icon: '🎧',
    description: 'Understand stereo placement'
  },
  'volumes': {
    id: 'volumes',
    name: 'Volumes',
    icon: '🔊',
    description: 'Master volume and dynamics'
  },
  'equalizing': {
    id: 'equalizing',
    name: 'Equalizing',
    icon: '🎛️',
    description: 'Learn audio frequency shaping'
  },
  'intervals': {
    id: 'intervals',
    name: 'Intervals',
    icon: '🎯',
    description: 'Practice note sequence memory'
  },
  'harmonies': {
    id: 'harmonies',
    name: 'Harmonies',
    icon: '🎶',
    description: 'Identify chord notes'
  }
};

const difficultyLevels = {
  easy: {
    name: 'Easy',
    color: 'success',
    icon: checkmarkCircle,
    points: '10-15 pts',
    descriptions: {
      'guess-note': 'Natural notes only (C, D, E, F, G, A, B)',
      'panning': 'Only left, center, or right positions',
      'volumes': 'Large volume differences (6-20 dB), ±4 dB tolerance',
      'equalizing': 'Large EQ changes (6-12 dB), ±200 Hz tolerance',
      'intervals': 'Replay 2 notes in sequence',
      'harmonies': 'Identify 2 notes played together'
    }
  },
  medium: {
    name: 'Medium',
    color: 'warning',
    icon: star,
    points: '20-25 pts',
    descriptions: {
      'guess-note': 'Natural notes + sharps/flats (chromatic scale)',
      'panning': 'Quarter positions (L, L/2, C, R/2, R)',
      'volumes': 'Medium volume differences (3-12 dB), ±2.5 dB tolerance',
      'equalizing': 'Moderate EQ changes (3-8 dB), ±150 Hz tolerance',
      'intervals': 'Replay 3 notes in sequence',
      'harmonies': 'Identify 3 notes played together'
    }
  },
  hard: {
    name: 'Hard',
    color: 'danger',
    icon: flame,
    points: '35-40 pts',
    descriptions: {
      'guess-note': 'Full chromatic scale across 3 octaves',
      'panning': 'Any position with fine precision',
      'volumes': 'Small volume differences (1-8 dB), ±1.5 dB tolerance',
      'equalizing': 'Subtle EQ changes (1-5 dB), ±100 Hz tolerance',
      'intervals': 'Replay 5 notes in sequence',
      'harmonies': 'Identify 4 notes played together'
    }
  }
};

const DifficultySelection: React.FC = () => {
  const history = useHistory();
  const { exerciseType } = useParams<{ exerciseType: string }>();

  const exercise = exerciseTypes[exerciseType];

  if (!exercise) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/main" />
            </IonButtons>
            <IonTitle>Exercise Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Exercise type not found. Please go back and select a valid exercise.</p>
        </IonContent>
      </IonPage>
    );
  }

  const handleDifficultySelect = (difficulty: string) => {
    history.push(`/exercise/${exerciseType}/${difficulty}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/main" />
          </IonButtons>
          <IonTitle>Select Difficulty</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Exercise info */}
        <IonCard className="exercise-info-card">
          <IonCardHeader>
            <div className="exercise-header">
              <div className="exercise-icon">{exercise.icon}</div>
              <div>
                <IonCardTitle>{exercise.name}</IonCardTitle>
                <p className="exercise-description">{exercise.description}</p>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Difficulty selection */}
        <div className="difficulty-section">
          <h2>Choose Your Challenge Level</h2>

          <IonGrid>
            {Object.entries(difficultyLevels).map(([key, level]) => (
              <IonRow key={key}>
                <IonCol>
                  <IonCard
                    className={`difficulty-card difficulty-${key}`}
                    button
                    onClick={() => handleDifficultySelect(key)}
                  >
                    <IonCardContent>
                      <div className="difficulty-header">
                        <div className="difficulty-info">
                          <IonIcon
                            icon={level.icon}
                            color={level.color}
                            size="large"
                            className="difficulty-icon"
                          />
                          <div>
                            <h3>{level.name}</h3>
                            <IonBadge color={level.color} className="points-badge">
                              {level.points}
                            </IonBadge>
                          </div>
                        </div>
                        <IonButton
                          fill="clear"
                          color={level.color}
                          className="select-button"
                        >
                          Select
                        </IonButton>
                      </div>

                      <p className="difficulty-description">
                        {level.descriptions[exerciseType as keyof typeof level.descriptions]}
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            ))}
          </IonGrid>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default DifficultySelection;