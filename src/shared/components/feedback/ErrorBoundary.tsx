// src/shared/components/feedback/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Text, Button, Heading, Flex } from 'gestalt';
import { env } from '@/app/config/env';
import { useToastStore } from '../../stores/toastStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showToast?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// Функция для отправки toast (вызывается вне React компонента)
const showErrorToast = (message: string) => {
  useToastStore.getState().error(message, {
    duration: 10000,
    dismissible: true,
  });
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error-${Date.now()}`;
    return { hasError: true, error, errorId };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Логируем только в development
    if (env.isDevelopment) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // В production отправляем в сервис мониторинга
    if (env.isProduction) {
      // TODO: Интегрировать с сервисом мониторинга (Sentry, etc.)
      // sendToErrorTracking(error, errorInfo);
    }
    
    // Показываем toast если включено
    if (this.props.showToast !== false) {
      showErrorToast(
        env.isDevelopment 
          ? `Error: ${error.message}` 
          : 'Something went wrong. Please try again.'
      );
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleReload = (): void => {
    globalThis.location.reload();
  };

  handleReportError = (): void => {
    // TODO: Открыть форму отправки отчёта об ошибке
    const { error, errorId } = this.state;
    console.log('Report error:', { errorId, error: error?.message });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="center"
          padding={8}
          minHeight="50vh"
        >
          <Box marginBottom={4}>
            <Heading size="400" color="error">
              Something went wrong
            </Heading>
          </Box>
          
          <Box marginBottom={2}>
            <Text align="center" color="subtle" size="100">
              Error ID: {this.state.errorId}
            </Text>
          </Box>
          
          <Box marginBottom={6} maxWidth={400}>
            <Text align="center" color="subtle">
              {env.isDevelopment && this.state.error?.message 
                ? this.state.error.message 
                : 'An unexpected error occurred. Please try again.'}
            </Text>
          </Box>
          
          <Flex gap={3}>
            <Button
              text="Try again"
              onClick={this.handleReset}
              size="lg"
            />
            <Button
              text="Reload page"
              onClick={this.handleReload}
              size="lg"
              color="gray"
            />
          </Flex>
          
          {env.isDevelopment && this.state.error && (
            <Box marginTop={6} padding={4} color="secondary" rounding={2} maxWidth={600}>
              <Text size="100" overflow="breakWord">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {this.state.error.stack}
                </pre>
              </Text>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;