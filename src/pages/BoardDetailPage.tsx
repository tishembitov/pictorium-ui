// src/pages/BoardDetailPage.tsx

import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip } from 'gestalt';
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
      {/* Явная кнопка назад вверху страницы */}
      <Box marginBottom={4}>
        <Tooltip text="Go back">
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleBack}
            size="lg"
            bgColor="transparent"
          />
        </Tooltip>
      </Box>
      
      <BoardDetail boardId={boardId} />
    </Box>
  );
};

export default BoardDetailPage;