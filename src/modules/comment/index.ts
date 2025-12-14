// src/modules/comment/index.ts

// Types
export type {
    CommentResponse,
    CommentCreateRequest,
    CommentUpdateRequest,
    LikeResponse,
    PageCommentResponse,
    PageLikeResponse,
    CommentWithState,
    CommentFormValues,
  } from './types/comment.types';
  
  // API
  export { commentApi } from './api/commentApi';
  export { commentLikeApi } from './api/commentLikeApi';
  
  // Hooks
  export { useComment } from './hooks/useComment';
  export { useCommentReplies, useInfiniteCommentReplies } from './hooks/useCommentReplies';
  export { useCreateReply } from './hooks/useCreateReply';
  export { useUpdateComment } from './hooks/useUpdateComment';
  export { useDeleteComment } from './hooks/useDeleteComment';
  export { useLikeComment } from './hooks/useLikeComment';
  export { useUnlikeComment } from './hooks/useUnlikeComment';
  export { useCommentLikes, useInfiniteCommentLikes } from './hooks/useCommentLikes';
  
  // Components
  export { CommentList } from './components/CommentList';
  export { CommentItem } from './components/CommentItem';
  export { CommentItemActions } from './components/CommentItemActions';
  export { CommentForm } from './components/CommentForm';
  export { commentSchema, type CommentFormData } from './components/commentSchema';
  export { ReplyForm } from './components/ReplyForm';
  export { CommentReplies } from './components/CommentReplies';