import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonModal,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { personCircle, logoInstagram, downloadOutline } from 'ionicons/icons';
import './Home.css';
import LoginModal from '../login/LoginModal';
import RegisterModal from '../registration/RegisterModal';

const Home: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  return (
    <IonPage>
      {/* Top Menu */}
      <IonToolbar>
        <IonTitle slot="start">QRFit</IonTitle>

        <div className="promo-menu-toolbar">
          <a href="#what">What</a>
          <a href="#who">Who</a>
          <a href="#why">Why</a>
        </div>

        <IonButtons slot="end">
          <IonButton onClick={() => setShowAuthModal(true)}>
            <IonIcon icon={personCircle} />
          </IonButton>
        </IonButtons>
      </IonToolbar>

      {/* Content */}
      <IonContent fullscreen scrollY>
        {/* Hero Section */}
        <section className="hero">
          <img src="/assets/sil.png" alt="Hero" className="hero-img" />
          <h1>Stay Healthy with QRFit</h1>
          <IonButton
            fill="solid"
            color="primary"
            onClick={() => setShowAuthModal(true)}
          >
            Get Started
          </IonButton>
        </section>

        {/* What */}
        <section id="what" className="section">
          <h2>What</h2>
          <p>
            QRFit is the ONE PWA that will keep you healthy and fit — anytime,
            anywhere.
          </p>
        </section>

        {/* Who */}
        <section id="who" className="section alt">
          <h2>Who</h2>
          <p>
            I'm a female developer and hobby gym-goer. QRFit is my passion
            project combining code and health ❤️
          </p>
        </section>

        {/* Why */}
        <section id="why" className="section">
          <h2>Why</h2>
          <p>
            I'm testing PWA technology to help myself and others stay motivated
            and consistent with fitness goals.
          </p>
        </section>

        {/* Download */}
        <section className="section download">
          <h2>Download the App</h2>
          <IonButton
            fill="outline"
            color="medium"
            onClick={() => {
              if (
                'getInstalledRelatedApps' in navigator ||
                'BeforeInstallPromptEvent' in window
              ) {
                window.location.reload(); // triggers PWA install prompt if available
              } else {
                alert('You can install this app from your browser menu.');
              }
            }}
          >
            <IonIcon icon={downloadOutline} slot="start" />
            Install PWA
          </IonButton>
        </section>
      </IonContent>

      {/* Footer */}
      <IonFooter className="footer">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonButton
              fill="clear"
              size="small"
              href="https://instagram.com"
              target="_blank"
            >
              <IonIcon icon={logoInstagram} />
            </IonButton>
            <IonButton
              fill="clear"
              size="small"
              href="https://t.me"
              target="_blank"
            ></IonButton>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <p style={{ fontSize: '12px', color: '#888' }}>
              © 2025 QRFit. Built with 💪
            </p>
          </IonRow>
        </IonGrid>
      </IonFooter>

      {/* Auth Modal */}
      <IonModal
        isOpen={showAuthModal}
        onDidDismiss={() => setShowAuthModal(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{authTab === 'login' ? 'Login' : 'Register'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAuthModal(false)}>
                Close
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                fill={authTab === 'login' ? 'solid' : 'outline'}
                onClick={() => setAuthTab('login')}
              >
                Login
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton
                expand="block"
                fill={authTab === 'register' ? 'solid' : 'outline'}
                onClick={() => setAuthTab('register')}
              >
                Register
              </IonButton>
            </IonCol>
          </IonRow>

          {authTab === 'login' ? <LoginModal /> : <RegisterModal />}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Home;
