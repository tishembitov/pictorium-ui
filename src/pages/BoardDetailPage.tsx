// src/pages/BoardDetailPage.tsx

import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box } from 'gestalt';
import { BoardDetail } from '@/modules/board';
import { ROUTES } from '@/app/router/routeConfig';

const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  if (!boardId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <Box paddingY={4}>
      <BoardDetail 
        boardId={boardId} 
        onBack={handleBack}
      />
    </Box>
  );
};

export default BoardDetailPage;