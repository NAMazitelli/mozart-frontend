import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { checkmarkCircle, closeCircle, playOutline } from 'ionicons/icons';
import './ExerciseCompletionModal.css';

interface ExerciseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  isCorrect: boolean;
  message: string;
  score?: number;
  pointsEarned?: number;
  correctAnswer?: string;
  showNextButton?: boolean;
  // Validation response data
  userGuess?: string;
  accuracy?: number;
  validationDetails?: any;
  onPlayCorrectAnswer?: () => void;
  isPlaying?: boolean;
}

const ExerciseCompletionModal: React.FC<ExerciseCompletionModalProps> = ({
  isOpen,
  onClose,
  onNext,
  isCorrect,
  message,
  score,
  pointsEarned,
  correctAnswer,
  showNextButton = true,
  userGuess,
  accuracy,
  validationDetails,
  onPlayCorrectAnswer,
  isPlaying = false,
}) => {
  const handleNext = () => {
    onClose();
    onNext();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="exercise-completion-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isCorrect ? 'Correct!' : 'Try Again'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Modal content */}
      <div style={{padding: '20px', flex: 1, overflow: 'auto'}}>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <IonIcon
                  icon={isCorrect ? checkmarkCircle : closeCircle}
                  size="large"
                  color={isCorrect ? 'success' : 'danger'}
                />
                <span>{isCorrect ? 'Correct!' : 'Not quite right'}</span>
              </div>
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <p>{message || 'No message'}</p>

            <div style={{background: '#e8f4f8', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '2px solid #007bff'}}>
              <p style={{margin: '5px 0'}}><strong>Your guess:</strong> {userGuess || 'No selection made'}</p>
              <p style={{margin: '5px 0'}}><strong>Correct answer:</strong> {correctAnswer || 'Not provided'}</p>
            </div>

            <div style={{background: '#f8f9fa', padding: '10px', borderRadius: '5px'}}>
              <p><strong>Points:</strong> {isCorrect ? `+${pointsEarned || 0}` : '0'}</p>
              <p><strong>Total Score:</strong> {score || 0}</p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Action Buttons */}
      <div className="modal-footer">
        {showNextButton && (
          <IonButton
            expand="block"
            onClick={handleNext}
            color={isCorrect ? 'success' : 'primary'}
            className="next-question-btn"
          >
            {isCorrect ? '🚀 Next Question' : '🔄 Try Another'}
          </IonButton>
        )}
      </div>
    </IonModal>
  );
};

export default ExerciseCompletionModal;