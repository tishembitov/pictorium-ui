import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Text, Button, Heading, Flex } from 'gestalt';
import { env } from '@/app/config/env';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
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
    
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    globalThis.location.reload();
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
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;