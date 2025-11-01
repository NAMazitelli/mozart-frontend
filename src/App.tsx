import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import MainMenu from './pages/MainMenu';
import CategorySelect from './pages/CategorySelect';
import Settings from './pages/Settings';
import DifficultySelection from './pages/DifficultySelection';
import GuessNoteExercise from './pages/GuessNoteExercise';
import PanningExercise from './pages/PanningExercise';
import VolumeExercise from './pages/VolumeExercise';
import EqualizingExercise from './pages/EqualizingExercise';
import IntervalsExercise from './pages/IntervalsExercise';
import HarmoniesExercise from './pages/HarmoniesExercise';
import Leaderboard from './pages/Leaderboard';
import OAuthSuccess from './pages/OAuthSuccess';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/auth/success">
            <OAuthSuccess />
          </Route>
          <Route exact path="/main">
            {isAuthenticated ? <MainMenu /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/category/:categoryId">
            {isAuthenticated ? <CategorySelect /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/settings">
            {isAuthenticated ? <Settings /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/leaderboard">
            {isAuthenticated ? <Leaderboard /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/difficulty/:exerciseType">
            {isAuthenticated ? <DifficultySelection /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/guess-note/:difficulty">
            {isAuthenticated ? <GuessNoteExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/panning/:difficulty">
            {isAuthenticated ? <PanningExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/volumes/:difficulty">
            {isAuthenticated ? <VolumeExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/equalizing/:difficulty">
            {isAuthenticated ? <EqualizingExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/intervals/:difficulty">
            {isAuthenticated ? <IntervalsExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/exercise/harmonies/:difficulty">
            {isAuthenticated ? <HarmoniesExercise /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/">
            <Redirect to={isAuthenticated ? "/main" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
