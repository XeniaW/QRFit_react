import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import './StatsOverview.css';

export interface StatItem {
  title: string;
  value: React.ReactNode;
}

/**
 * Renders a horizontal, scroll-snap list of cards,
 * all wrapped in an outer IonCard container.
 */
const StatsOverview: React.FC<{ items: StatItem[] }> = ({ items }) => (
  <IonCard className="stats-overview-container">
    <IonCardHeader>
      <IonCardTitle>Your Stats</IonCardTitle>
    </IonCardHeader>
    <IonCardContent className="stats-overview-content">
      <div className="stats-snap-container">
        {items.map((item, idx) => (
          <IonCard className="stats-card" key={idx}>
            <IonCardHeader>
              <IonCardTitle>{item.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>{item.value}</IonCardContent>
          </IonCard>
        ))}
      </div>
    </IonCardContent>
  </IonCard>
);

export default StatsOverview;
