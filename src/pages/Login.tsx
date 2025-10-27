import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await authApi.login(email, password);
        login(response.data.token, response.data.user);
        history.push('/main');
      } else {
        const response = await authApi.register(email, password, username);
        login(response.data.token, response.data.user);
        history.push('/main');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mozart Music App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1>🎵 Mozart</h1>
                <p>Learn music theory like never before!</p>
              </div>

              <form onSubmit={handleSubmit}>
                <IonItem>
                  <IonInput
                    type="email"
                    value={email}
                    placeholder="Email"
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonInput
                    type="password"
                    value={password}
                    placeholder="Password"
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                  />
                </IonItem>

                {!isLogin && (
                  <IonItem>
                    <IonInput
                      type="text"
                      value={username}
                      placeholder="Username"
                      onIonInput={(e) => setUsername(e.detail.value!)}
                      required
                    />
                  </IonItem>
                )}

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: '20px' }}
                >
                  {isLogin ? 'Login' : 'Register'}
                </IonButton>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <IonText>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span
                    style={{ color: 'var(--ion-color-primary)', cursor: 'pointer' }}
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </span>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading isOpen={loading} message="Please wait..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;