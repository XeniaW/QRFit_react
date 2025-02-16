import React from 'react';
import { IonButton } from '@ionic/react';

interface QRCameraOverlayProps {
  isScanning: boolean;
  handleCancelQRScan: () => void;
}

const QRCameraOverlay: React.FC<QRCameraOverlayProps> = ({
  isScanning,
  handleCancelQRScan,
}) => {
  if (!isScanning) return null;

  return (
    <div className="camera-overlay">
      <p>Scanning...</p>
      <IonButton
        className="cancel-button"
        color="light"
        onClick={handleCancelQRScan}
      >
        Cancel
      </IonButton>
    </div>
  );
};

export default QRCameraOverlay;
