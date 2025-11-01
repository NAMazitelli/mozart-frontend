import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonLoading,
  IonToast,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonLabel,
} from '@ionic/react';
import { eye, eyeOff, logoGoogle, logoFacebook, logoApple } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const { login, loginAsGuest } = useAuth();
  const history = useHistory();

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      // For web browsers, redirect to OAuth provider
      if (provider === 'google') {
        window.location.href = authApi.getGoogleAuthUrl();
      } else if (provider === 'facebook') {
        window.location.href = authApi.getFacebookAuthUrl();
      }
    } catch (err: any) {
      setError(`${provider} login failed`);
      setShowToast(true);
    }
  };

  // Handle OAuth callback tokens (if redirected back with token)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');

    if (token && provider) {
      // OAuth callback success
      try {
        // Extract user data from token (you might want to fetch user profile separately)
        login(token, { id: 0, email: '', username: '', totalScore: 0, currentStreak: 0, longestStreak: 0, totalExercisesCompleted: 0, language: 'en' });
        history.push('/main');

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        setError('Authentication failed');
        setShowToast(true);
      }
    }

    const errorMessage = urlParams.get('message');
    if (errorMessage === 'oauth_error') {
      setError('Social login failed. Please try again.');
      setShowToast(true);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login, history]);

  const handleGuestLogin = () => {
    loginAsGuest();
    history.push('/main');
  };

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
        const response = await authApi.register(email, password, fullName);
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
      <IonContent className="login-content">
        {/* Header with Illustration */}
        <div className="login-header">
          <img
            src="/images/login-illustration.png"
            alt="Music Learning Character"
            className="login-illustration"
          />
        </div>

        {/* Main Content */}
        <div className="login-main">
          {/* Title Section */}
          <div className="title-section">
            <h1 className="main-title">
              {isLogin ? 'Login to your account.' : 'Create your new account'}
            </h1>
            <p className="subtitle">
              {isLogin ? 'Please sign in to your account' : 'Create an account to start'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="input-group">
                <IonInput
                  type="text"
                  value={fullName}
                  placeholder="Full Name"
                  onIonInput={(e) => setFullName(e.detail.value!)}
                  className="custom-input"
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div className="input-group">
                <IonInput
                  type="number"
                  value={age}
                  placeholder="Age"
                  onIonInput={(e) => setAge(e.detail.value!)}
                  className="custom-input"
                  required
                />
              </div>
            )}

            <div className="input-group">
              {isLogin && <label className="input-label">Email Address</label>}
              <IonInput
                type="email"
                value={email}
                placeholder={isLogin ? "Email" : "Email Address"}
                onIonInput={(e) => setEmail(e.detail.value!)}
                className="custom-input"
                required
              />
            </div>

            <div className="input-group">
              {!isLogin && <label className="input-label">Password</label>}
              {isLogin && <label className="input-label">Password</label>}
              <div className="password-input">
                <IonInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Password"
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  className="custom-input"
                  required
                />
                <IonIcon
                  icon={showPassword ? eyeOff : eye}
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            {isLogin && (
              <div className="forgot-password">
                <IonText color="primary">Forgot password?</IonText>
              </div>
            )}

            {!isLogin && (
              <div className="gender-selection">
                <div className="gender-buttons">
                  <button
                    type="button"
                    className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
                    onClick={() => setGender('male')}
                  >
                    Male ♂
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
                    onClick={() => setGender('female')}
                  >
                    Female ♀
                  </button>
                </div>
              </div>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {isLogin ? 'Login' : 'Register'}
            </IonButton>
          </form>

          {/* Social Login */}
          <div className="social-section">
            <p className="social-text">
              {isLogin ? 'Or sign in with' : 'Or sign up with'}
            </p>
            <div className="social-buttons">
              <IonButton fill="clear" className="social-btn" onClick={() => handleSocialLogin('google')}>
                <IonIcon icon={logoGoogle} />
              </IonButton>
              <IonButton fill="clear" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
                <IonIcon icon={logoFacebook} />
              </IonButton>
              <IonButton fill="clear" className="social-btn" disabled>
                <IonIcon icon={logoApple} />
              </IonButton>
            </div>
          </div>

          {/* Play as Guest */}
          <div className="guest-section">
            <IonButton
              expand="block"
              fill="clear"
              color="medium"
              onClick={handleGuestLogin}
              className="guest-button"
            >
              🎵 Play as Guest
            </IonButton>
            <IonText color="medium" className="guest-description">
              <p>Try exercises without creating an account (progress won't be saved)</p>
            </IonText>
          </div>

          {/* Toggle Login/Register */}
          <div className="toggle-section">
            <IonText>
              {isLogin ? "Don't have an account? " : "Do you have account? "}
              <span
                className="toggle-link"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Register' : 'Login'}
              </span>
            </IonText>
          </div>

          {/* Privacy Policy */}
          {!isLogin && (
            <div className="privacy-section">
              <IonText className="privacy-text">
                By Creating an account you agree to the{' '}
                <span className="privacy-link">Privacy Policy</span>
                {' '}and to the{' '}
                <span className="privacy-link">terms of use</span>
              </IonText>
            </div>
          )}
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