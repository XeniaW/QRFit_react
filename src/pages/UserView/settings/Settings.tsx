import React, { useEffect, useMemo, useState } from 'react';
import {
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonHeader,
  IonPage,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonAlert,
  IonToggle,
} from '@ionic/react';

import './Settings.css';

import { auth, firestore } from '../../../firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

import {
  logOutOutline,
  refreshOutline,
  trashOutline,
  logoInstagram,
  paperPlaneOutline,
  languageOutline,
} from 'ionicons/icons';

const LANG_KEY = 'pl_lang';

const Settings: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'de'>('en');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // TODO: replace with your real links
  const TELEGRAM_URL = 'https://t.me/your_channel_or_bot';
  const INSTAGRAM_URL = 'https://instagram.com/your_handle';

  const appVersion = useMemo(() => {
    const v = (import.meta as any)?.env?.VITE_APP_VERSION;
    return v ? String(v) : 'dev';
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'de') setLang(saved);
  }, []);

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        reg.update();
      }
      setTimeout(() => window.location.reload(), 500);
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/';
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLanguageToggle = (checked: boolean) => {
    // checked = true -> DE, false -> EN
    const next = checked ? 'de' : 'en';
    setLang(next);
    window.localStorage.setItem(LANG_KEY, next);

    // If you later wire i18n, trigger it here.
  };

  const deleteAccountAndData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsDeleting(true);

    try {
      const uid = user.uid;

      // Best-effort Firestore cleanup (adjust to your actual structure)
      const userRef = doc(firestore, 'users', uid);

      const subcollections = ['sessions', 'routines', 'cycle']; // change if needed
      for (const sub of subcollections) {
        try {
          const subRef = collection(firestore, 'users', uid, sub);
          const snap = await getDocs(subRef);
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        } catch {
          // ignore if missing or blocked
        }
      }

      try {
        await deleteDoc(userRef);
      } catch {
        // ignore if missing
      }

      await deleteUser(user);

      window.location.href = '/';
    } catch (e: any) {
      console.error(e);
      alert(
        e?.code === 'auth/requires-recent-login'
          ? 'For security, please log in again and then delete your account.'
          : 'Could not delete account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/assets/pl_icon/icon_nf_matt.png"
                alt="Pawer Lifting"
                style={{ height: 50, width: 'auto', display: 'block' }}
              />
              <strong>User Settings</strong>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="settings-content">
        {/* PWA Update */}
        <IonRow className="ion-padding" style={{ paddingTop: 16 }}>
          <IonCol size="12">
            <IonCard className="advisor-card">
              <IonCardContent className="advisor-card__content">
                <div className="advisor-card__text">
                  <div className="advisor-card__title">It&apos;s a PWA!</div>
                  <div className="advisor-card__desc">
                    Get the latest version of the app anytime.
                  </div>
                  <div className="settings-muted">
                    App version: {appVersion}
                  </div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="light"
                  onClick={updateApp}
                  aria-label="Update app"
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Update
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Language (quick-card style, toggle inside quick-card__content / card-content-md) */}
        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="12">
            <IonCard className="quick-card language-card" button={false}>
              <IonCardContent className="quick-card__content">
                <div className="quick-card__text">
                  <div className="quick-card__title">Language</div>
                  <div className="quick-card__desc">
                    Switch between English and Deutsch.
                  </div>
                </div>

                <div className="language-toggle">
                  <IonIcon icon={languageOutline} />
                  <IonText className="language-label">
                    {lang === 'de' ? 'DE' : 'EN'}
                  </IonText>

                  <IonToggle
                    checked={lang === 'de'}
                    onIonChange={e => handleLanguageToggle(!!e.detail.checked)}
                    aria-label="Language toggle EN/DE"
                  />
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Support */}
        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="12">
            <IonCard className="advisor-card">
              <IonCardContent className="advisor-card__content support-card__content">
                <div className="advisor-card__text">
                  <div className="advisor-card__title">Support</div>
                  <div className="advisor-card__desc">
                    You can report a bug, suggest a machine, and keep updated on
                    latest news.
                  </div>
                </div>

                <IonRow className="support-buttons">
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      color="secondary"
                      className="support-btn"
                      onClick={() => openLink(TELEGRAM_URL)}
                      aria-label="Telegram"
                    >
                      <IonIcon icon={paperPlaneOutline} slot="start" />
                      Telegram
                    </IonButton>
                  </IonCol>

                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      color="secondary"
                      className="support-btn"
                      onClick={() => openLink(INSTAGRAM_URL)}
                      aria-label="Instagram"
                    >
                      <IonIcon icon={logoInstagram} slot="start" />
                      Instagram
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Danger zone */}
        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="12">
            <IonCard className="advisor-card dangerzone-card">
              <IonCardContent className="advisor-card__content">
                <div className="advisor-card__text">
                  <div className="advisor-card__title">Danger zone</div>
                  <div className="advisor-card__desc">
                    These actions are permanent.
                  </div>
                </div>

                <div className="dangerzone-actions">
                  <IonButton
                    color="danger"
                    fill="solid"
                    onClick={() => setShowDeleteAlert(true)}
                    disabled={isDeleting}
                    aria-label="Delete account and data"
                  >
                    <IonIcon icon={trashOutline} slot="start" />
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </IonButton>

                  <IonButton
                    color="medium"
                    fill="solid"
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    <IonIcon icon={logOutOutline} slot="start" />
                    Logout
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete account?"
          message="This will permanently delete your account and your data. This can’t be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Delete',
              role: 'destructive',
              handler: deleteAccountAndData,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
