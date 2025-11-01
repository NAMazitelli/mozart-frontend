import React, { useState, useEffect } from 'react';
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
  IonIcon,
  IonToggle,
  IonList,
  IonLoading,
} from '@ionic/react';
import { logOut } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { userApi } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const Settings: React.FC = () => {
  const { user, logout, isGuest } = useAuth();
  const history = useHistory();
  const [language, setLanguage] = useState(user?.language || 'en');
  const [volume, setVolume] = useState(user?.preferences?.masterVolume || 100);
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.preferences?.pushNotifications ?? true);
  const [soundEffects, setSoundEffects] = useState(user?.preferences?.soundEffects ?? true);
  const [vibration, setVibration] = useState(user?.preferences?.vibration ?? true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
  ];

  useEffect(() => {
    const loadSocialAccounts = async () => {
      if (isGuest) return; // Skip loading for guests

      try {
        const response = await userApi.getSocialAccounts();
        setSocialAccounts(response.data.socialAccounts);
      } catch (error) {
        console.error('Failed to load social accounts:', error);
      }
    };

    loadSocialAccounts();
  }, [isGuest]);

  const handleSaveSettings = async () => {
    if (isGuest) {
      setToastMessage('Settings are temporarily saved for this session only');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      // Update profile
      await userApi.updateProfile({ language });

      // Update preferences
      await userApi.updatePreferences({
        masterVolume: volume,
        emailNotifications,
        pushNotifications,
        soundEffects,
        vibration,
      });

      setToastMessage('Settings saved successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to save settings');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSocial = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      await userApi.disconnectSocialAccount(provider);
      setSocialAccounts(prev => prev.filter(account => account.provider !== provider));
      setToastMessage(`${provider} account disconnected successfully`);
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || `Failed to disconnect ${provider} account`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
      setToastMessage('Logged out successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to logout');
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
                onIonChange={(e: CustomEvent) => setLanguage(e.detail.value)}
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
            <IonCardTitle>Appearance</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ThemeToggle />
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

            <IonItem>
              <IonLabel>Sound Effects</IonLabel>
              <IonToggle
                checked={soundEffects}
                onIonChange={(e) => setSoundEffects(e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Vibration</IonLabel>
              <IonToggle
                checked={vibration}
                onIonChange={(e) => setVibration(e.detail.checked)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Notifications</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>
                <h3>Email Notifications</h3>
                <p>Receive updates and achievements via email</p>
              </IonLabel>
              <IonToggle
                checked={emailNotifications}
                onIonChange={(e) => setEmailNotifications(e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Push Notifications</h3>
                <p>Receive app notifications on your device</p>
              </IonLabel>
              <IonToggle
                checked={pushNotifications}
                onIonChange={(e) => setPushNotifications(e.detail.checked)}
              />
            </IonItem>
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

            {socialAccounts.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <IonLabel>
                  <h3>Connected Accounts</h3>
                </IonLabel>
                {socialAccounts.map((account) => (
                  <IonItem key={account.provider}>
                    <IonLabel>
                      <h4 style={{ textTransform: 'capitalize' }}>{account.provider}</h4>
                      <p>{account.provider_email || 'Connected'}</p>
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      onClick={() => handleDisconnectSocial(account.provider)}
                    >
                      Disconnect
                    </IonButton>
                  </IonItem>
                ))}
              </div>
            )}

            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              onClick={handleLogout}
              style={{ marginTop: '16px' }}
            >
              <IonIcon icon={logOut} slot="start" />
              Logout
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          onClick={handleSaveSettings}
          style={{ marginTop: '20px' }}
        >
          Save Settings
        </IonButton>

        <IonLoading isOpen={loading} message="Saving settings..." />

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