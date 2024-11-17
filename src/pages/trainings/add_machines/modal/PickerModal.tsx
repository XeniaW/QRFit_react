import React from 'react';
import { useIonPicker } from '@ionic/react';
import { PickerColumn } from '@ionic/core';

interface PickerModalProps {
  isOpen: boolean;
  pickerType: 'reps' | 'weight'; // Define the picker type
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

const PickerModal: React.FC<PickerModalProps> = ({ isOpen, pickerType, onConfirm, onCancel }) => {
  const [present, dismiss] = useIonPicker();

  // Define column options dynamically based on pickerType
  const column: PickerColumn = pickerType === 'reps'
    ? {
        name: 'reps',
        options: Array.from({ length: 20 }, (_, i) => ({
          text: `${i + 1} reps`,
          value: i + 1,
        })),
      }
    : {
        name: 'weight',
        options: Array.from({ length: 20 }, (_, i) => ({
          text: `${(i + 1) * 10} kg`,
          value: (i + 1) * 10,
        })),
      };

  React.useEffect(() => {
    if (isOpen) {
      present({
        columns: [column],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              onCancel();
              dismiss();
            },
          },
          {
            text: 'Confirm',
            handler: (selected) => {
              const selectedValue =
                pickerType === 'reps' ? selected.reps.value : selected.weight.value;
              onConfirm(selectedValue);
              dismiss();
            },
          },
        ],
      });
    }
  }, [isOpen, pickerType, present, dismiss, onCancel, onConfirm]);

  return null; // The picker is handled via `useIonPicker`
};

export default PickerModal;
