import React from 'react';
import { IonItem, IonLabel, IonIcon, IonToggle } from '@ionic/react';
import { sunny, moon } from 'ionicons/icons';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  showLabel?: boolean;
  itemLines?: 'full' | 'inset' | 'none';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  itemLines = 'none'
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <IonItem lines={itemLines} className="theme-toggle-item">
      <IonIcon
        icon={sunny}
        slot="start"
        className={`theme-icon ${theme === 'light' ? 'active' : ''}`}
      />
      {showLabel && (
        <IonLabel>
          <h2>Theme</h2>
          <p>Switch between light and dark mode</p>
        </IonLabel>
      )}
      <IonToggle
        slot="end"
        checked={theme === 'dark'}
        onIonChange={toggleTheme}
        className="theme-toggle"
      />
      <IonIcon
        icon={moon}
        slot="end"
        className={`theme-icon ${theme === 'dark' ? 'active' : ''}`}
      />
    </IonItem>
  );
};

export default ThemeToggle;