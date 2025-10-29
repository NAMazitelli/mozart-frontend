import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="loading-screen-content">
        <div className="loading-screen">
          <div className="loading-illustration">
            <img
              src="/images/mozart-icon.png"
              alt="Mozart musical instruments illustration"
              className="mozart-illustration"
            />
          </div>
          <div className="loading-text">
            <h1 className="mozart-title">
              <span className="moz">MOZ</span>
              <span className="art">ART</span>
            </h1>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoadingScreen;