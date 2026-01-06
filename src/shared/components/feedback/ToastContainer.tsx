// src/shared/components/feedback/ToastContainer.tsx
import React, { useCallback } from 'react';
import { 
  Box, 
  Layer, 
  FixedZIndex,
  Icon,
  Flex,
  TapArea,
  Text,
  Spinner,
  IconButton,
} from 'gestalt';
import { 
  useToastStore, 
  type Toast, 
  type ToastType,
  type ToastVariant,
} from '../../stores/toastStore';
import { Z_INDEX } from '../../utils/constants';

// ============ Types ============
type IconName = React.ComponentProps<typeof Icon>['icon'];
type IconColor = React.ComponentProps<typeof Icon>['color'];

interface ToastConfig {
  icon: IconName;
  color: IconColor;
  bgColor: string;
  borderColor: string;
}

// ============ Config Maps ============
const DEFAULT_CONFIG: ToastConfig = {
  icon: 'info-circle',
  color: 'default',
  bgColor: 'rgba(0, 0, 0, 0.9)',
  borderColor: 'transparent',
};

const VARIANT_CONFIG: Record<ToastVariant, Partial<ToastConfig>> = {
  default: {},
  pin: { icon: 'pin' },
  board: { icon: 'board' },
  comment: { icon: 'speech' },
  follow: { icon: 'person-add' },
  save: { icon: 'check-circle', color: 'success' },
  delete: { icon: 'trash-can', color: 'subtle' },
  update: { icon: 'refresh' },
  upload: { icon: 'arrow-up' },
  download: { icon: 'arrow-down' },
  copy: { icon: 'link' },
  auth: { icon: 'person' },
};

const TYPE_CONFIG: Record<ToastType, ToastConfig> = {
  success: {
    icon: 'check-circle',
    color: 'success',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'transparent',
  },
  error: {
    icon: 'workflow-status-problem',
    color: 'error',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  warning: {
    icon: 'workflow-status-warning',
    color: 'warning',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  info: {
    icon: 'info-circle',
    color: 'info',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'transparent',
  },
  loading: {
    icon: 'clock',
    color: 'subtle',
    bgColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'transparent',
  },
};

// ============ Helper Functions ============
const getToastConfig = (type: ToastType, variant?: ToastVariant): ToastConfig => {
  const typeConfig = TYPE_CONFIG[type] || DEFAULT_CONFIG;
  
  if (!variant || variant === 'default') {
    return typeConfig;
  }
  
  const variantConfig = VARIANT_CONFIG[variant];
  const baseColor = type === 'error' ? 'error' : (variantConfig.color ?? typeConfig.color);
  
  return {
    ...typeConfig,
    icon: variantConfig.icon ?? typeConfig.icon,
    color: baseColor,
  };
};

// ============ Toast Item ============
interface ToastItemProps {
  readonly toast: Toast;
  readonly onDismiss: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly index: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ 
  toast, 
  onDismiss, 
  onPause, 
  onResume,
  index,
}) => {
  const config = getToastConfig(toast.type, toast.variant);
  const isLoading = toast.type === 'loading';

  const handleMouseEnter = useCallback(() => {
    if (!isLoading && toast.dismissible) {
      onPause();
    }
  }, [isLoading, toast.dismissible, onPause]);

  const handleMouseLeave = useCallback(() => {
    if (!isLoading && toast.dismissible) {
      onResume();
    }
  }, [isLoading, toast.dismissible, onResume]);

  const handleActionClick = useCallback(() => {
    toast.action?.onClick();
    onDismiss();
  }, [toast.action, onDismiss]);

  return (
    <Box
      marginBottom={2}
      dangerouslySetInlineStyle={{
        __style: {
          pointerEvents: 'auto',
          animation: 'toastSlideIn 0.3s ease-out',
          animationDelay: `${index * 50}ms`,
          animationFillMode: 'both',
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        padding={4}
        rounding={3}
        minWidth={300}
        maxWidth={400}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <Flex alignItems="start" gap={3}>
          {/* Icon or Spinner */}
          <Box marginTop={1}>
            {isLoading ? (
              <Spinner accessibilityLabel="Loading" show size="sm" />
            ) : (
              <Icon 
                accessibilityLabel={toast.type} 
                icon={config.icon} 
                color={config.color}
                size={20} 
              />
            )}
          </Box>

          {/* Content */}
          <Box flex="grow">
            <Flex direction="column" gap={1}>
              {/* Message */}
              <Text weight="bold" size="200" color="inverse">
                {toast.message}
              </Text>

              {/* Description */}
              {toast.description && (
                <Text size="100" color="inverse" overflow="breakWord">
                  <span style={{ opacity: 0.8 }}>{toast.description}</span>
                </Text>
              )}

              {/* Progress bar for loading toasts */}
              {isLoading && toast.progress !== undefined && (
                <ToastProgressBar progress={toast.progress} />
              )}

              {/* Action button */}
              {toast.action && (
                <Box marginTop={2}>
                  <TapArea onTap={handleActionClick} rounding={2}>
                    <Box 
                      paddingX={3} 
                      paddingY={2} 
                      rounding={2}
                      dangerouslySetInlineStyle={{
                        __style: {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          display: 'inline-block',
                        },
                      }}
                    >
                      <Text weight="bold" size="100" color="inverse">
                        {toast.action.label}
                      </Text>
                    </Box>
                  </TapArea>
                </Box>
              )}
            </Flex>
          </Box>

          {/* Dismiss button */}
          {toast.dismissible && (
            <IconButton
              accessibilityLabel="Dismiss"
              icon="cancel"
              size="xs"
              iconColor="white"
              bgColor="transparent"
              onClick={onDismiss}
            />
          )}
        </Flex>
      </Box>
    </Box>
  );
};

// ============ Progress Bar ============
interface ToastProgressBarProps {
  progress: number;
}

const ToastProgressBar: React.FC<ToastProgressBarProps> = ({ progress }) => (
  <Box marginTop={2}>
    <Box
      height={4}
      rounding="pill"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        height={4}
        rounding="pill"
        dangerouslySetInlineStyle={{
          __style: {
            width: `${progress}%`,
            backgroundColor: '#e60023',
            transition: 'width 0.3s ease',
          },
        }}
      />
    </Box>
    <Box marginTop={1}>
      <Text size="100" color="inverse">
        <span style={{ opacity: 0.6 }}>{progress}%</span>
      </Text>
    </Box>
  </Box>
);

// ============ Toast Container ============
export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const pauseToast = useToastStore((state) => state.pauseToast);
  const resumeToast = useToastStore((state) => state.resumeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* CSS for animations */}
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
      
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
            __style: { 
              pointerEvents: 'none',
              paddingBottom: '24px',
            },
          }}
        >
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              index={index}
              onDismiss={() => removeToast(toast.id)}
              onPause={() => pauseToast(toast.id)}
              onResume={() => resumeToast(toast.id)}
            />
          ))}
        </Box>
      </Layer>
    </>
  );
};

export default ToastContainer;