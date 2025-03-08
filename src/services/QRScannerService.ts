import { collection, where, getDocs, query } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Machines } from '../datamodels';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import jsQR from 'jsqr-es6';

export const startQRScan = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await BarcodeScanner.checkPermission({ force: true });
      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        return result.content;
      }
    } catch (error) {
      console.error('Native QR Scan failed:', error);
    } finally {
      BarcodeScanner.stopScan();
    }
  } else {
    return await scanWithWebCamera();
  }
  return null;
};

// Helper function to scan with a web camera
const scanWithWebCamera = async (): Promise<string | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });

      // Create a video element and attach the stream.
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.style.width = '100%';
      video.style.height = 'auto';

      // Append the video element into the preview container
      const previewContainer = document.getElementById('camera-preview');
      if (previewContainer) {
        // Clear any previous content
        previewContainer.innerHTML = '';
        previewContainer.appendChild(video);
      } else {
        // If no container exists, append to body (or adjust as needed)
        document.body.appendChild(video);
      }

      await video.play();

      // Create a hidden canvas for processing video frames.
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      let scanning = true;

      // Function to stop the stream and remove the video preview.
      const stopStream = () => {
        scanning = false;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        if (previewContainer) {
          previewContainer.innerHTML = '';
        } else {
          video.remove();
        }
      };

      const scanFrame = () => {
        if (!scanning) return;
        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            stopStream();
            resolve(code.data);
            return;
          }
        }
        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);

      // Stop scanning after 15 seconds.
      setTimeout(() => {
        if (scanning) {
          stopStream();
          resolve(null);
        }
      }, 15000);
    } catch (error) {
      console.error('Web QR Scan failed:', error);
      reject(null);
    }
  });
};

// Fetch a machine by ID from Firestore
export const handleAddMachineById = async (
  scannedQRCode: string
): Promise<Machines | null> => {
  try {
    const machinesRef = collection(firestore, 'machines');
    const q = query(machinesRef, where('qrcode', '==', scannedQRCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const machineDoc = querySnapshot.docs[0]; // Get the first matching document
      return { id: machineDoc.id, ...machineDoc.data() } as Machines;
    } else {
      console.error('No machine found for this QR code!');
      return null;
    }
  } catch (e) {
    console.error('Error fetching machine by QR code:', e);
    return null;
  }
};
