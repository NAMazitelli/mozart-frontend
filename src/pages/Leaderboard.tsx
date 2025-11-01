import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonBadge,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonBackButton,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  RefresherEventDetail
} from '@ionic/react';
import { trophy, medal, star, people, person } from 'ionicons/icons';
import { userApi, LeaderboardEntry, ExerciseLeaderboardEntry } from '../services/api';
import './Leaderboard.css';

const Leaderboard: React.FC = () => {
  const [segmentValue, setSegmentValue] = useState<'global' | 'exercise'>('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [exerciseLeaderboard, setExerciseLeaderboard] = useState<ExerciseLeaderboardEntry[]>([]);
  const [selectedExerciseType, setSelectedExerciseType] = useState('guess-note');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const exerciseTypes = [
    { value: 'guess-note', label: 'Guess Note' },
    { value: 'intervals', label: 'Intervals' },
    { value: 'harmonies', label: 'Harmonies' },
    { value: 'panning', label: 'Panning' },
    { value: 'volumes', label: 'Volumes' },
    { value: 'equalizing', label: 'Equalizing' }
  ];

  const difficulties = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const loadGlobalLeaderboard = async () => {
    try {
      const response = await userApi.getGlobalLeaderboard(50, 0);
      setGlobalLeaderboard(response.data);

      // Get user's position
      const positionResponse = await userApi.getLeaderboardPosition('global');
      setUserPosition(positionResponse.data.rank);
    } catch (err) {
      console.error('Error loading global leaderboard:', err);
      setError('Failed to load global leaderboard');
    }
  };

  const loadExerciseLeaderboard = async () => {
    try {
      const response = await userApi.getExerciseLeaderboard(
        selectedExerciseType,
        selectedDifficulty || undefined,
        50,
        0
      );
      setExerciseLeaderboard(response.data);

      // Get user's position
      const positionResponse = await userApi.getLeaderboardPosition(
        'exercise',
        selectedExerciseType,
        selectedDifficulty || undefined
      );
      setUserPosition(positionResponse.data.rank);
    } catch (err) {
      console.error('Error loading exercise leaderboard:', err);
      setError('Failed to load exercise leaderboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (segmentValue === 'global') {
        await loadGlobalLeaderboard();
      } else {
        await loadExerciseLeaderboard();
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [segmentValue, selectedExerciseType, selectedDifficulty]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadData();
    event.detail.complete();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return { icon: trophy, color: 'warning' };
    if (rank === 2) return { icon: medal, color: 'medium' };
    if (rank === 3) return { icon: medal, color: 'tertiary' };
    return { icon: star, color: 'primary' };
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const renderLeaderboardItem = (entry: LeaderboardEntry | ExerciseLeaderboardEntry, index: number) => {
    const rankInfo = getRankIcon(entry.rank);

    return (
      <IonItem key={`${entry.username}-${entry.rank}`}>
        <IonAvatar slot="start">
          <div className="avatar-placeholder">
            {entry.full_name?.charAt(0) || entry.username.charAt(0).toUpperCase()}
          </div>
        </IonAvatar>

        <IonLabel>
          <div className="leaderboard-entry">
            <div className="entry-header">
              <h3>{entry.full_name || entry.username}</h3>
              <div className="rank-badge">
                <IonIcon icon={rankInfo.icon} color={rankInfo.color} />
                <span>#{entry.rank}</span>
              </div>
            </div>

            <div className="entry-stats">
              <div className="stat">
                <IonText color="primary">
                  <strong>{entry.total_score}</strong>
                </IonText>
                <IonText color="medium">
                  <p>Total Score</p>
                </IonText>
              </div>

              <div className="stat">
                <IonText color="success">
                  <strong>{formatPercentage(entry.success_rate)}</strong>
                </IonText>
                <IonText color="medium">
                  <p>Success Rate</p>
                </IonText>
              </div>

              <div className="stat">
                <IonText color="warning">
                  <strong>{entry.longest_streak}</strong>
                </IonText>
                <IonText color="medium">
                  <p>Best Streak</p>
                </IonText>
              </div>

              {'exercise_type' in entry && (
                <div className="stat">
                  <IonText color="tertiary">
                    <strong>{entry.difficulty}</strong>
                  </IonText>
                  <IonText color="medium">
                    <p>Difficulty</p>
                  </IonText>
                </div>
              )}
            </div>
          </div>
        </IonLabel>
      </IonItem>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/main" />
          </IonButtons>
          <IonTitle>Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {userPosition && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Your Position</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="user-position">
                <IonIcon icon={person} color="primary" />
                <IonText color="primary">
                  <h2>#{userPosition}</h2>
                </IonText>
                <IonText color="medium">
                  <p>in {segmentValue} leaderboard</p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        <IonSegment value={segmentValue} onIonChange={(e) => setSegmentValue(e.detail.value as 'global' | 'exercise')}>
          <IonSegmentButton value="global">
            <IonLabel>Global</IonLabel>
            <IonIcon icon={people} />
          </IonSegmentButton>
          <IonSegmentButton value="exercise">
            <IonLabel>Exercise</IonLabel>
            <IonIcon icon={trophy} />
          </IonSegmentButton>
        </IonSegment>

        {segmentValue === 'exercise' && (
          <div className="exercise-filters">
            <IonItem>
              <IonLabel>Exercise Type</IonLabel>
              <IonSelect
                value={selectedExerciseType}
                onIonChange={(e) => setSelectedExerciseType(e.detail.value)}
              >
                {exerciseTypes.map(type => (
                  <IonSelectOption key={type.value} value={type.value}>
                    {type.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Difficulty</IonLabel>
              <IonSelect
                value={selectedDifficulty}
                onIonChange={(e) => setSelectedDifficulty(e.detail.value)}
              >
                {difficulties.map(diff => (
                  <IonSelectOption key={diff.value} value={diff.value}>
                    {diff.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </div>
        )}

        <IonList>
          {segmentValue === 'global'
            ? globalLeaderboard.map((entry, index) => renderLeaderboardItem(entry, index))
            : exerciseLeaderboard.map((entry, index) => renderLeaderboardItem(entry, index))
          }
        </IonList>

        {((segmentValue === 'global' && globalLeaderboard.length === 0) ||
          (segmentValue === 'exercise' && exerciseLeaderboard.length === 0)) &&
          !loading && (
            <div className="empty-state">
              <IonIcon icon={trophy} size="large" color="medium" />
              <IonText color="medium">
                <h3>No rankings yet</h3>
                <p>Complete some exercises to see leaderboard rankings!</p>
              </IonText>
            </div>
          )}

        <IonLoading isOpen={loading} message="Loading leaderboard..." />

        <IonToast
          isOpen={!!error}
          onDidDismiss={() => setError('')}
          message={error}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;