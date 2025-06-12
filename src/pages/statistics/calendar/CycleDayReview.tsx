import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonProgressBar,
  IonButton,
  IonText,
} from '@ionic/react';

/** Props you’ll pass down from CalendarWidget */
interface CycleDayReviewProps {
  /** Day index in current cycle (1-based) */
  currentDay: number;
  /** Total days in cycle */
  cycleLength: number;
  /** Days of menstruation */
  periodLength: number;
  /** e.g. “May 25 – 30” */
  lastPeriod: string;
  /** Days until next period */
  nextPeriodInDays: number;
  /** One of your four phases */
  currentPhase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
  /** Handler to log today’s entry */
  onLogToday: () => void;
}

const phaseLabels = {
  menstruation: 'Menstruation',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
} as const;

const phaseAdvice = {
  menstruation: 'It’s period time—focus on light or restorative activity.',
  follicular: 'Energized phase—great time to ramp up intensity.',
  ovulation: 'Peak power—feel free to push harder today.',
  luteal: 'Wind-down phase—listen to your body and adjust.',
} as const;

const CycleDayReview: React.FC<CycleDayReviewProps> = ({
  currentDay,
  cycleLength,
  lastPeriod,
  nextPeriodInDays,
  currentPhase,
  onLogToday,
}) => {
  const progress = currentDay / cycleLength;

  return (
    <IonCard>
      <IonCardHeader>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <IonCardTitle>Cycle Day {currentDay}</IonCardTitle>
          <IonBadge color="primary" style={{ padding: '0.25rem 0.5rem' }}>
            {phaseLabels[currentPhase]}
          </IonBadge>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Progress bar: % through cycle */}
        <IonProgressBar value={progress} />

        {/* Last / next period info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
          }}
        >
          <span>Next period in {nextPeriodInDays} days</span>
          <span>Last period: {lastPeriod}</span>
        </div>

        {/* Phase advice */}
        <IonText style={{ display: 'block', marginTop: '0.75rem' }}>
          {phaseAdvice[currentPhase]}
        </IonText>

        {/* Log button */}
        <IonButton
          expand="block"
          style={{ marginTop: '1rem' }}
          onClick={onLogToday}
        >
          Log Today
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default CycleDayReview;
