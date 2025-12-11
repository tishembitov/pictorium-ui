import React from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';

export const AppRouter: React.FC = () => {
  const element = useRoutes(routes);
  return <>{element}</>;
};

export { routes, ROUTES, buildPath } from './routes';
export { ProtectedRoute, withProtectedRoute } from './ProtectedRoute';
export * from './LazyRoutes';

export default AppRouter;