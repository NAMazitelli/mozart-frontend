import React, { useEffect, useState } from 'react';
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
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  IonMenuButton,
} from '@ionic/react';
import { logOut, settings, trophy, flash } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { exerciseApi, Category } from '../services/api';
import { useHistory } from 'react-router-dom';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const history = useHistory();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await exerciseApi.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

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
    } else {
      history.push(`/category/${categoryId}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mozart Music App</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => history.push('/settings')}>
              <IonIcon icon={settings} />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout}>
              <IonIcon icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1>Welcome back, {user?.username}! 🎵</h1>
        </div>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Your Stats</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="4">
                  <div style={{ textAlign: 'center' }}>
                    <IonIcon icon={flash} size="large" color="warning" />
                    <h3>{user?.coins || 0}</h3>
                    <p>Coins</p>
                  </div>
                </IonCol>
                <IonCol size="4">
                  <div style={{ textAlign: 'center' }}>
                    <IonIcon icon={trophy} size="large" color="success" />
                    <h3>{user?.currentStreak || 0}</h3>
                    <p>Current Streak</p>
                  </div>
                </IonCol>
                <IonCol size="4">
                  <div style={{ textAlign: 'center' }}>
                    <IonIcon icon={trophy} size="large" color="primary" />
                    <h3>{user?.longestStreak || 0}</h3>
                    <p>Longest Streak</p>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Categories</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              {categories.map((category, index) => (
                <IonRow key={category.id}>
                  <IonCol>
                    <IonItem
                      button
                      onClick={() => handleCategoryClick(category.id)}
                      className="category-item"
                      data-category={category.id}
                    >
                      <div style={{ fontSize: '28px', marginRight: '16px' }}>
                        {category.icon}
                      </div>
                      <IonLabel>
                        <h2>{category.name}</h2>
                        <p>{category.description}</p>
                      </IonLabel>
                      <IonBadge
                        color={category.id === 'notes' || category.id === 'panning' || category.id === 'volumes' || category.id === 'equalizing' || category.id === 'intervals' || category.id === 'harmonies' ? 'success' : 'primary'}
                        slot="end"
                      >
                        {category.id === 'notes' || category.id === 'panning' || category.id === 'volumes' || category.id === 'equalizing' || category.id === 'intervals' || category.id === 'harmonies' ? 'Play Now' : 'Coming Soon'}
                      </IonBadge>
                    </IonItem>
                  </IonCol>
                </IonRow>
              ))}
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default MainMenu;