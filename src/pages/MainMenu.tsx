import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  home,
  trophy,
  person,
  chevronForward,
  analytics
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { exerciseApi, Category } from '../services/api';
import { useHistory } from 'react-router-dom';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const { user, isGuest } = useAuth();
  const [searchText, setSearchText] = useState('');
  const history = useHistory();

  const handleCategoryClick = (categoryId: string) => {
    // Direct links to available exercises via difficulty selection
    if (categoryId === 'notes') {
      history.push('/difficulty/guess-note');
    } else if (categoryId === 'panning') {
      history.push('/difficulty/panning');
    } else if (categoryId === 'volumes') {
      history.push('/difficulty/volumes');
    } else if (categoryId === 'equalizing') {
      history.push('/difficulty/equalizing');
    } else if (categoryId === 'intervals') {
      history.push('/difficulty/intervals');
    } else if (categoryId === 'harmonies') {
      history.push('/difficulty/harmonies');
    }
  };

  const allExercises = [
    { id: 'notes', title: 'Notes', emoji: '🎵', color: '#E1BEE7' },
    { id: 'equalizing', title: 'EQ', emoji: '▶️', color: '#B3D9FF' },
    { id: 'volumes', title: 'Volume', emoji: '📖', color: '#FFE4C4' },
    { id: 'panning', title: 'Panning', emoji: '🎧', color: '#FFB6C1' },
    { id: 'intervals', title: 'Intervals', emoji: '🎼', color: '#98FB98' },
    { id: 'harmonies', title: 'Harmonies', emoji: '🎹', color: '#DDA0DD' }
  ];

  const latestExercises = [
    {
      id: 'notes',
      title: 'Guess the notes',
      description: 'practice recognizing notes!',
      emoji: '🎵'
    },
    {
      id: 'equalizing',
      title: 'Equalization',
      description: 'practice your EQ skills!',
      emoji: '▶️'
    },
    {
      id: 'panning',
      title: 'Panning',
      description: 'Guess the panned sounds!',
      emoji: '🎧'
    }
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="main-menu-content">
        {/* Header Section */}
        <div className="header-section">
          <div className="user-info">
            <h1 className="username">
              {user?.username || 'Mohamed'}
              {isGuest && <span className="guest-badge">👤 Guest</span>}
            </h1>
            <p className="welcome-message">
              {isGuest ? 'Playing as Guest - Progress won\'t be saved' : 'Welcome to Mozart!'}
            </p>
          </div>
          <div className="streak-info">
            <span className="fire-icon">🔥</span>
            <span className="streak-number">{user?.currentStreak || 3}</span>
          </div>
        </div>

        {/* Search Bar */}
{/*         <div className="search-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search"
            className="custom-searchbar"
            searchIcon="search-outline"
          />
        </div> */}

        {/* Leaderboard Card */}
        <div className="leaderboard-section">
          <IonCard className="leaderboard-card">
            <IonCardContent>
              <div className="leaderboard-content">
                <div className="leaderboard-text">
                  <h2>Check the leaderboard</h2>
                  <IonButton
                    fill="solid"
                    className="check-now-btn"
                    onClick={() => history.push('/leaderboard')}
                  >
                    Check now
                  </IonButton>
                </div>
                <div className="leaderboard-illustration">
                  <img
                    src="/images/character-blue-bg.png"
                    alt="Musical character"
                    className="blue-character"
                  />
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Category Cards */}
        <div className="categories-section">
          <IonGrid>
            <IonRow>
              {allExercises.map((exercise, index) => (
                <IonCol size="4" key={exercise.id}>
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick(exercise.id)}
                    style={{ background: `linear-gradient(135deg, ${exercise.color} 0%, ${exercise.color}CC 100%)` }}
                  >
                    <div className="category-icon">{exercise.emoji}</div>
                    <div className="category-name">{exercise.title}</div>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Latest Exercises */}
        <div className="latest-exercises-section">
          <h3 className="section-title">Latest Exercises</h3>
          <div className="exercises-list">
            {latestExercises.map((exercise) => (
              <IonItem
                key={exercise.id}
                button
                onClick={() => handleCategoryClick(exercise.id)}
                className="exercise-item"
                lines="none"
              >
                <div className="exercise-icon">
                  <span className="exercise-emoji">{exercise.emoji}</span>
                </div>
                <IonLabel>
                  <h2>{exercise.title}</h2>
                  <p>{exercise.description}</p>
                </IonLabel>
                <IonIcon icon={chevronForward} className="chevron-icon" />
              </IonItem>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-navigation">
          <IonTabBar className="custom-tab-bar">
            <IonTabButton tab="home" className="tab-button active">
              <IonIcon icon={home} />
            </IonTabButton>
            <IonTabButton tab="trophy" className="tab-button" onClick={() => history.push('/leaderboard')}>
              <IonIcon icon={trophy} />
            </IonTabButton>
            <IonTabButton tab="wave" className="tab-button">
              <IonIcon icon={analytics} />
            </IonTabButton>
            <IonTabButton tab="profile" className="tab-button" onClick={() => history.push('/settings')}>
              <IonIcon icon={person} />
            </IonTabButton>
          </IonTabBar>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MainMenu;