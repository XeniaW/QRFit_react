import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import jsQR from 'jsqr';

export const startQRScan = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    // Native platform: Use Capacitor's BarcodeScanner
    try {
      await BarcodeScanner.checkPermission({ force: true });
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        return result.content;
      }
    } catch (error) {
      console.error("Native QR Scan failed:", error);
    } finally {
      BarcodeScanner.stopScan();
    }
  } else {
    // Web platform: Use HTML5 getUserMedia with jsQR
    return await scanWithWebCamera();
  }

  return null;
};

// Helper function to scan with web camera
const scanWithWebCamera = async (): Promise<string | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const scanFrame = () => {
        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            stopStream(stream);
            resolve(code.data);
            return;
          }
        }
        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);

      // Stop the video stream and resolve with null if scanning fails
      const stopStream = (stream: MediaStream) => {
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      };

      // Timeout for the camera
      setTimeout(() => {
        stopStream(stream);
        resolve(null); // Resolve with null if no QR code is detected
      }, 15000); // 15 seconds timeout
    } catch (error) {
      console.error("Web QR Scan failed:", error);
      reject(null);
    }
  });
};
