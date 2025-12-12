// src/shared/components/feedback/ToastContainer.tsx
import React from 'react';
import { 
  Box, 
  Layer, 
  Toast as GestaltToast, 
  FixedZIndex,
} from 'gestalt';
import { useToastStore, type Toast } from '../../hooks/useToast';
import { Z_INDEX } from '../../utils/constants';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <Layer zIndex={new FixedZIndex(Z_INDEX.TOAST)}>
      <Box
        position="fixed"
        bottom
        left
        right
        display="flex"
        direction="column"
        alignItems="center"
        padding={4}
        dangerouslySetInlineStyle={{
          __style: { pointerEvents: 'none' },
        }}
      >
        {toasts.map((toast) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => removeToast(toast.id)} 
          />
        ))}
      </Box>
    </Layer>
  );
};

interface ToastItemProps {
  readonly toast: Toast;
  readonly onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  return (
    <Box 
      marginBottom={2}
      dangerouslySetInlineStyle={{
        __style: { pointerEvents: 'auto' },
      }}
    >
      <GestaltToast
        text={toast.message}
        dismissButton={
          toast.dismissible
            ? {
                accessibilityLabel: 'Dismiss',
                onDismiss,
              }
            : undefined
        }
      />
    </Box>
  );
};

export default ToastContainer;