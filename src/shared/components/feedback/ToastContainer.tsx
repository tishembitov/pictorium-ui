import React from 'react';
import { 
  Box, 
  Layer, 
  Toast as GestaltToast, 
  FixedZIndex,
  Icon,
  Flex,
} from 'gestalt';
import { useToastStore, type Toast, type ToastType } from '../../hooks/useToast';
import { Z_INDEX } from '../../utils/constants';

// Иконки для разных типов уведомлений
const getToastIcon = (type: ToastType): React.ReactElement | undefined => {
  const iconProps = { size: 16 as const };
  
  switch (type) {
    case 'success':
      return <Icon accessibilityLabel="Success" icon="check-circle" color="success" {...iconProps} />;
    case 'error':
      return <Icon accessibilityLabel="Error" icon="workflow-status-problem" color="error" {...iconProps} />;
    case 'warning':
      return <Icon accessibilityLabel="Warning" icon="workflow-status-warning" color="warning" {...iconProps} />;
    case 'info':
      return <Icon accessibilityLabel="Info" icon="info-circle" color="info" {...iconProps} />;
    default:
      return undefined;
  }
};

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
  const icon = getToastIcon(toast.type);

  return (
    <Box 
      marginBottom={2}
      dangerouslySetInlineStyle={{
        __style: { pointerEvents: 'auto' },
      }}
    >
      <GestaltToast
        text={
          icon ? (
            <Flex alignItems="center" gap={2}>
              {icon}
              <span>{toast.message}</span>
            </Flex>
          ) : (
            toast.message
          )
        }
        dismissButton={
          toast.dismissible
            ? {
                accessibilityLabel: 'Dismiss notification',
                onDismiss,
              }
            : undefined
        }
      />
    </Box>
  );
};

export default ToastContainer;