import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const { signIn, loading, error } = useAuthContext();
  const [present] = useIonToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      present({
        message: 'Please enter email and password',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (result.success) {
      if (result.isAdmin) {
        present({
          message: 'Signed in successfully!',
          duration: 2000,
          color: 'success',
        });
        history.push('/admin');
      } else {
        present({
          message: 'You do not have admin access',
          duration: 3000,
          color: 'warning',
        });
      }
    } else {
      present({
        message: 'Sign in failed. Check your credentials.',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="login-content">
          <div className="login-header">
            <IonText>
              <h2>Admin Login</h2>
              <p>Sign in to manage Historic Nauvoo</p>
            </IonText>
          </div>

          <form onSubmit={handleLogin}>
            <IonItem className="login-input">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value || '')}
                placeholder="admin@example.com"
                disabled={submitting}
              />
            </IonItem>

            <IonItem className="login-input">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value || '')}
                placeholder="Enter password"
                disabled={submitting}
              />
            </IonItem>

            {error && (
              <div className="login-error">
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              </div>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={submitting || loading}
              className="login-button"
            >
              {submitting ? <IonSpinner name="crescent" /> : 'Sign In'}
            </IonButton>
          </form>

          <div className="login-help">
            <IonText color="medium">
              <p>
                Don't have an account? Contact the app administrator to request
                access.
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
