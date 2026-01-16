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
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';

interface CategoryParams {
  categoryId: string;
}

const CategorySelect: React.FC = () => {
  const { categoryId } = useParams<CategoryParams>();
  const history = useHistory();

  const difficulties = [
    { id: 'easy', name: 'Easy', color: 'success', coins: 10 },
    { id: 'medium', name: 'Medium', color: 'warning', coins: 20 },
    { id: 'hard', name: 'Hard', color: 'danger', coins: 40 },
  ];

  const getCategoryName = (id: string) => {
    const categoryNames: { [key: string]: string } = {
      scales: 'Scales',
      notes: 'Notes, Harmonies, Intervals',
      equalizing: 'Equalizing',
      volumes: 'Volumes',
      panning: 'Panning',
      rhythms: 'Reading Rhythms',
      reading_notes: 'Reading Notes',
      partitures: 'Reading Partitures',
    };
    return categoryNames[id] || id;
  };

  const handleDifficultySelect = (difficulty: string) => {
    history.push(`/exercise/${categoryId}/${difficulty}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/main" />
          </IonButtons>
          <IonTitle>{getCategoryName(categoryId)}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1>Choose Your Difficulty</h1>
          <p>Select the difficulty level you want to practice</p>
        </div>

        <IonGrid>
          {difficulties.map((difficulty) => (
            <IonRow key={difficulty.id}>
              <IonCol>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {difficulty.name}
                        <IonBadge color={difficulty.color}>
                          {difficulty.coins} coins
                        </IonBadge>
                      </div>
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonButton
                      expand="block"
                      color={difficulty.color}
                      onClick={() => handleDifficultySelect(difficulty.id)}
                    >
                      Start {difficulty.name}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          ))}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default CategorySelect;