// src/modules/user/hooks/useFollowLocalState.ts

import { useState, useCallback, useMemo } from 'react';

export interface FollowLocalState {
  isFollowing: boolean;
}

export interface UseFollowLocalStateResult {
  state: FollowLocalState;
  toggleFollow: () => boolean;
  setFollowing: (isFollowing: boolean) => void;
  resetOverride: () => void;
}

/**
 * Локальное состояние подписки для оптимистичных обновлений UI.
 * Использует серверное значение как fallback, локальный override для оптимистичных обновлений.
 */
export const useFollowLocalState = (
  serverIsFollowing: boolean
): UseFollowLocalStateResult => {
  // localOverride - значение установленное пользователем, null = использовать серверное
  const [localOverride, setLocalOverride] = useState<boolean | null>(null);
  
  // Используем localOverride если есть, иначе серверное значение
  const isFollowing = localOverride ?? serverIsFollowing;
  
  const toggleFollow = useCallback((): boolean => {
    const newValue = !isFollowing;
    setLocalOverride(newValue);
    return newValue;
  }, [isFollowing]);

  const setFollowing = useCallback((value: boolean) => {
    setLocalOverride(value);
  }, []);
  
  // Сброс override - используется для revert после ошибки
  const resetOverride = useCallback(() => {
    setLocalOverride(null);
  }, []);

  return useMemo(() => ({
    state: { isFollowing },
    toggleFollow,
    setFollowing,
    resetOverride,
  }), [isFollowing, toggleFollow, setFollowing, resetOverride]);
};

export default useFollowLocalState;