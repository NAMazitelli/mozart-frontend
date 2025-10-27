import React, { useState } from 'react';
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
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonButtons,
  IonBackButton,
  IonButton,
  IonToast,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.language || 'en');
  const [volume, setVolume] = useState(100);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
  ];

  const handleSaveSettings = async () => {
    try {
      await userApi.updateProfile({ language });
      setToastMessage('Settings saved successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to save settings');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/main" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Language</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>Select Language</IonLabel>
              <IonSelect
                value={language}
                onSelectionChange={(e) => setLanguage(e.detail.value)}
              >
                {languages.map((lang) => (
                  <IonSelectOption key={lang.value} value={lang.value}>
                    {lang.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Audio</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>Master Volume</IonLabel>
              <IonRange
                value={volume}
                onIonKnobMoveEnd={(e) => setVolume(e.detail.value as number)}
                min={0}
                max={100}
                step={1}
                snaps
                ticks
                color="primary"
              />
            </IonItem>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              Volume: {volume}%
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>
                <h3>Username</h3>
                <p>{user?.username}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h3>Email</h3>
                <p>{user?.email}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          onClick={handleSaveSettings}
          style={{ marginTop: '20px' }}
        >
          Save Settings
        </IonButton>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;