import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  parentCommentId: number | null;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    username: string;
  };
  replies: Comment[];
  _count: {
    replies: number;
    reactions: number;
  };
}

interface CommentsDisplayProps {
  postId: number;
  onReaction?: (commentId: number) => void;
}

function getUserInitials(user: { firstName: string; lastName: string }) {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
}

export function CommentsDisplay({ postId, onReaction }: CommentsDisplayProps) {
  const { t } = useTranslation();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['/api/community/posts', postId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/community/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">{t('community.commentsLoading', 'Loading comments...')}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">{t('community.noComments', 'No comments yet. Be the first to comment!')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment: Comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.profileImage || undefined} />
            <AvatarFallback>
              {comment.author ? getUserInitials(comment.author) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {comment.author?.firstName} {comment.author?.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400">({t('community.edited', 'edited')})</span>
                )}
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReaction?.(comment.id)}
                className="text-xs text-gray-500 hover:text-red-600 h-6 px-2"
              >
                <Heart className="h-3 w-3 mr-1" />
                {comment._count?.reactions || 0}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}