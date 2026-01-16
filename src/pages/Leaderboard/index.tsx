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
  IonButton,
  RefresherEventDetail
} from '@ionic/react';
import { trophy, medal, star, people, person, logInOutline } from 'ionicons/icons';
import { userApi, LeaderboardEntry, ExerciseLeaderboardEntry } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from 'react-router-dom';
import './Leaderboard.css';

const Leaderboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const history = useHistory();
  const [segmentValue, setSegmentValue] = useState<'world' | 'personal'>('world');
  const [worldLeaderboard, setWorldLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalLeaderboard, setPersonalLeaderboard] = useState<ExerciseLeaderboardEntry[]>([]);
  const [selectedExerciseType, setSelectedExerciseType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const exerciseTypes = [
    { value: 'all', label: 'All Exercises' },
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

  const loadWorldLeaderboard = async () => {
    try {
      // For world leaderboard, we can show either global or filtered by exercise
      let response;
      if (selectedExerciseType === 'all') {
        response = await userApi.getGlobalLeaderboard(50, 0);
        setWorldLeaderboard(response.data);

        // Get user's position
        const positionResponse = await userApi.getLeaderboardPosition('global');
        setUserPosition(positionResponse.data.rank);
      } else {
        response = await userApi.getExerciseLeaderboard(
          selectedExerciseType,
          selectedDifficulty || undefined,
          50,
          0
        );
        setWorldLeaderboard(response.data);

        // Get user's position
        const positionResponse = await userApi.getLeaderboardPosition(
          'exercise',
          selectedExerciseType,
          selectedDifficulty || undefined
        );
        setUserPosition(positionResponse.data.rank);
      }
    } catch (err) {
      console.error('Error loading world leaderboard:', err);
      setError('Failed to load world leaderboard');
    }
  };

  const loadPersonalLeaderboard = async () => {
    try {
      const response = await userApi.getPersonalLeaderboard(50, 0);
      let filteredData = response.data;

      // Filter by exercise type if not 'all'
      if (selectedExerciseType !== 'all') {
        filteredData = response.data.filter(entry => entry.exercise_type === selectedExerciseType);
      }

      // Filter by difficulty if specified
      if (selectedDifficulty) {
        filteredData = filteredData.filter(entry => entry.difficulty === selectedDifficulty);
      }

      setPersonalLeaderboard(filteredData);
      setUserPosition(null); // No position needed for personal view
    } catch (err) {
      console.error('Error loading personal leaderboard:', err);
      setError('Failed to load personal leaderboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (segmentValue === 'world') {
        await loadWorldLeaderboard();
      } else {
        await loadPersonalLeaderboard();
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
                <>
                  <div className="stat">
                    <IonText color="tertiary">
                      <strong>
                        {exerciseTypes.find(et => et.value === entry.exercise_type)?.label || entry.exercise_type}
                      </strong>
                    </IonText>
                    <IonText color="medium">
                      <p>Exercise</p>
                    </IonText>
                  </div>
                  <div className="stat">
                    <IonText color="tertiary">
                      <strong>{entry.difficulty}</strong>
                    </IonText>
                    <IonText color="medium">
                      <p>Difficulty</p>
                    </IonText>
                  </div>
                </>
              )}
            </div>
          </div>
        </IonLabel>
      </IonItem>
    );
  };

  // Show login prompt for guest users
  if (!isAuthenticated) {
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
          <div className="guest-login-prompt">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={logInOutline} color="primary" />
                  <span style={{ marginLeft: '10px' }}>Login Required</span>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p>Log in to see the leaderboard and track your progress!</p>
                </IonText>
                <IonButton
                  fill="solid"
                  color="primary"
                  onClick={() => history.push('/login')}
                  style={{ marginTop: '16px' }}
                >
                  <IonIcon icon={logInOutline} slot="start" />
                  Log In
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
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
          <IonTitle>Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {userPosition && segmentValue === 'world' && (
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

        <IonSegment value={segmentValue} onIonChange={(e) => setSegmentValue(e.detail.value as 'world' | 'personal')}>
          <IonSegmentButton value="world">
            <IonLabel>World Leaderboard</IonLabel>
            <IonIcon icon={people} />
          </IonSegmentButton>
          <IonSegmentButton value="personal">
            <IonLabel>Personal Progress</IonLabel>
            <IonIcon icon={person} />
          </IonSegmentButton>
        </IonSegment>

        {/* Exercise filters - show for both world and personal leaderboards */}
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
              {difficulties.map(difficulty => (
                <IonSelectOption key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </div>

        <IonList>
          {segmentValue === 'world'
            ? worldLeaderboard.map((entry, index) => renderLeaderboardItem(entry, index))
            : personalLeaderboard.map((entry, index) => renderLeaderboardItem(entry, index))
          }
        </IonList>

        {/* Empty state handling */}
        {((segmentValue === 'world' && worldLeaderboard.length === 0) ||
          (segmentValue === 'personal' && personalLeaderboard.length === 0)) &&
          !loading && (
            <div className="empty-state">
              <IonIcon icon={trophy} size="large" color="medium" />
              <IonText color="medium">
                <h3>No entries found</h3>
                <p>
                  {segmentValue === 'world'
                    ? 'No leaderboard entries found for the selected filters. Try different exercise types or difficulties.'
                    : 'Complete some exercises to see your personal progress here!'
                  }
                </p>
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