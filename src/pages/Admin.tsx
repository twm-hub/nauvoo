import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonListHeader,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logOutOutline, saveOutline } from 'ionicons/icons';
import { db } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';
import './Admin.css';

interface AdminSettings {
  calendarUrl: string;
  googleMapsApiKey: string;
  siteName: string;
}

const Admin: React.FC = () => {
  const history = useHistory();
  const { user, isAdmin, loading: authLoading, signOut } = useAuthContext();
  const [present] = useIonToast();

  const [settings, setSettings] = useState<AdminSettings>({
    calendarUrl: '',
    googleMapsApiKey: '',
    siteName: 'Historic Nauvoo',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'config', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            calendarUrl: data.calendarUrl || '',
            googleMapsApiKey: data.googleMapsApiKey || '',
            siteName: data.siteName || 'Historic Nauvoo',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && isAdmin) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Save settings to Firestore
  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'config', 'settings');
      await setDoc(docRef, settings, { merge: true });
      present({
        message: 'Settings saved successfully!',
        duration: 2000,
        color: 'success',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      present({
        message: 'Failed to save settings. Check console for details.',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    history.push('/home');
  };

  // Not authenticated - show login prompt
  if (!authLoading && (!user || !isAdmin)) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Admin</IonTitle>
            </IonToolbar>
          </IonHeader>
          <div className="admin-login-prompt">
            <IonText>
              <h2>Admin Access Required</h2>
              <p>Sign in with your admin account to manage app settings.</p>
            </IonText>
            <IonButton
              expand="block"
              onClick={() => history.push('/login')}
              className="ion-margin-top"
            >
              Sign In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="admin-loading">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Admin</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* User info */}
        <IonCard className="admin-user-card">
          <IonCardContent>
            <div className="admin-user-info">
              <div>
                <IonText>
                  <p className="user-label">Signed in as</p>
                  <p className="user-email">{user?.email}</p>
                </IonText>
              </div>
              <IonButton fill="outline" size="small" onClick={handleSignOut}>
                <IonIcon slot="start" icon={logOutOutline} />
                Sign Out
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Settings Form */}
        <IonList>
          <IonListHeader>
            <IonLabel>App Settings</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonLabel position="stacked">Site Name</IonLabel>
            <IonInput
              value={settings.siteName}
              onIonChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  siteName: e.detail.value || '',
                }))
              }
              placeholder="Historic Nauvoo"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Google Maps API Key</IonLabel>
            <IonInput
              value={settings.googleMapsApiKey}
              onIonChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  googleMapsApiKey: e.detail.value || '',
                }))
              }
              placeholder="Enter your Google Maps API key"
              type="password"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Calendar ICS URL</IonLabel>
            <IonInput
              value={settings.calendarUrl}
              onIonChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  calendarUrl: e.detail.value || '',
                }))
              }
              placeholder="https://calendar.google.com/..."
            />
          </IonItem>
        </IonList>

        <div className="admin-actions">
          <IonButton expand="block" onClick={handleSave} disabled={saving}>
            <IonIcon slot="start" icon={saveOutline} />
            {saving ? 'Saving...' : 'Save Settings'}
          </IonButton>
        </div>

        {/* Help text */}
        <div className="admin-help">
          <IonText color="medium">
            <h4>Setup Notes</h4>
            <ul>
              <li>
                <strong>Google Maps API Key:</strong> Get from{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>
                <strong>Calendar URL:</strong> Use a public ICS feed URL from
                Google Calendar or similar
              </li>
            </ul>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Admin;
