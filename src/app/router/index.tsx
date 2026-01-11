// Router
export { AppRouter } from './AppRouter';
export { ProtectedRoute } from './ProtectedRoute';

// Route config
// eslint-disable-next-line react-refresh/only-export-components
export { routes } from './routeConfig';

// Constants (from separate file to avoid circular deps)
// eslint-disable-next-line react-refresh/only-export-components
export { ROUTES, buildPath, type RoutePath } from './routes';

// Lazy components
// eslint-disable-next-line react-refresh/only-export-components
export * from './LazyRoutes';