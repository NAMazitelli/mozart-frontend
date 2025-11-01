import React, { useEffect } from 'react';
import { IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { userApi } from '../services/api';

const OAuthSuccess: React.FC = () => {
  const { login } = useAuth();
  const history = useHistory();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const provider = urlParams.get('provider');

        if (token) {
          // Get user profile with the token
          localStorage.setItem('token', token);

          // Fetch user profile
          const profileResponse = await userApi.getProfile();
          const userData = profileResponse.data;

          // Login with token and user data
          login(token, userData);

          // Redirect to main menu
          history.replace('/main');
        } else {
          // No token, redirect to login with error
          history.replace('/login?error=oauth_failed');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        history.replace('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [login, history]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '20px'
        }}>
          <IonSpinner name="crescent" />
          <IonText>
            <h2>Completing login...</h2>
            <p>Please wait while we set up your account.</p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OAuthSuccess;