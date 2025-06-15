import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Heart, Reply, Send, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

interface CommentsDisplayProps {
  postId: number;
  onReaction?: (commentId: number) => void;
}

const replySchema = z.object({
  content: z.string().min(1, 'Reply is required').max(1000, 'Reply is too long'),
  parentCommentId: z.number(),
});

function getUserInitials(user: { firstName: string; lastName: string }) {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
}

// Mention suggestion component
function MentionSuggestions({ 
  suggestions, 
  onSelect, 
  visible 
}: {
  suggestions: User[];
  onSelect: (username: string) => void;
  visible: boolean;
}) {
  console.log('MentionSuggestions render:', { visible, suggestionsCount: suggestions.length });
  
  if (!visible || suggestions.length === 0) return null;

  return (
    <div 
      className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px] mt-1"
    >
      {suggestions.map((user) => (
        <button
          key={user.id}
          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
          onClick={() => onSelect(user.username)}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback className="text-xs">
              {getUserInitials({ firstName: user.firstName, lastName: user.lastName })}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">@{user.username}</div>
            <div className="text-xs text-gray-500">{user.firstName} {user.lastName}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Helper function to highlight @mentions in text
function highlightMentions(text: string) {
  const mentionRegex = /@(\w+)/g;
  return text.replace(mentionRegex, '<span class="text-blue-600 font-medium">@$1</span>');
}

function CommentItem({ comment, postId, onReaction, depth = 0 }: { 
  comment: Comment; 
  postId: number; 
  onReaction?: (commentId: number) => void;
  depth?: number;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>();

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: '',
      parentCommentId: comment.id,
    },
  });

  const editForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: comment.content,
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: (data: z.infer<typeof replySchema>) =>
      apiRequest('POST', `/api/community/posts/${postId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', postId, 'comments'] });
      setShowReplyForm(false);
      replyForm.reset();
      toast({
        title: t('community.replyCreated', 'Reply posted!'),
        description: t('community.replyCreatedDesc', 'Your reply has been added to the conversation.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('community.replyError', 'Failed to post reply. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: (data: { content: string }) =>
      apiRequest('PATCH', `/api/community/comments/${comment.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', postId, 'comments'] });
      setShowEditForm(false);
      toast({
        title: t('community.commentUpdated', 'Comment updated!'),
        description: t('community.commentUpdatedDesc', 'Your comment has been updated.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('community.editError', 'Failed to update comment. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: () =>
      apiRequest('DELETE', `/api/community/comments/${comment.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts', postId, 'comments'] });
      toast({
        title: t('community.commentDeleted', 'Comment deleted!'),
        description: t('community.commentDeletedDesc', 'Your comment has been removed.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('community.deleteError', 'Failed to delete comment. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  // Search users for mentions
  const searchUsers = async (query: string): Promise<User[]> => {
    if (query.length < 1) return [];
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const users = await response.json();
        return users.slice(0, 5); // Limit to 5 suggestions
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
    return [];
  };

  // Handle textarea input for mention detection
  const handleTextareaChange = async (value: string, textareaElement: HTMLTextAreaElement) => {
    const cursorPosition = textareaElement.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      console.log('Searching for users with query:', query);
      const suggestions = await searchUsers(query);
      console.log('Found suggestions:', suggestions);
      
      if (suggestions.length > 0) {
        setMentionSuggestions(suggestions);
        setShowSuggestions(true);
        console.log('Showing suggestions dropdown');
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (username: string) => {
    const currentValue = replyForm.getValues('content');
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.substring(0, cursorPosition);
    const textAfterCursor = currentValue.substring(cursorPosition);
    
    // Replace the partial mention with the selected username
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newValue = `${beforeMention}@${username} ${textAfterCursor}`;
      replyForm.setValue('content', newValue);
    }
    
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const onSubmitReply = (data: z.infer<typeof replySchema>) => {
    createReplyMutation.mutate(data);
  };

  const onSubmitEdit = (data: z.infer<typeof replySchema>) => {
    editCommentMutation.mutate({ content: data.content });
  };

  const handleDeleteComment = () => {
    if (window.confirm(t('community.confirmDelete', 'Are you sure you want to delete this comment?'))) {
      deleteCommentMutation.mutate();
    }
  };

  const maxDepth = 3; // Limit nesting depth to avoid layout issues

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-8 mt-3 pl-3 sm:pl-0 border-l-2 border-gray-200' : ''}`}>
      <div className="flex gap-2 sm:gap-3">
        <Avatar className={`${depth > 0 ? 'h-6 w-6' : 'h-8 w-8'} flex-shrink-0`}>
          <AvatarImage src={comment.author?.profileImage || undefined} />
          <AvatarFallback>
            {comment.author ? getUserInitials(comment.author) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {!showEditForm ? (
            <div className={`${depth > 0 ? 'bg-blue-50 border-l-2 border-blue-200' : 'bg-gray-50'} rounded-lg px-3 py-2`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${depth > 0 ? 'text-xs' : 'text-sm'}`}>
                  {comment.author?.firstName} {comment.author?.lastName}
                </span>
                <span className="text-xs text-blue-600">@{comment.author?.username}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400">({t('community.edited', 'edited')})</span>
                )}
              </div>
              <div 
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  {comment.author?.firstName} {comment.author?.lastName}
                </span>
                <span className="text-xs text-blue-600">@{comment.author?.username}</span>
                <span className="text-xs text-gray-500">{t('community.editing', 'Editing...')}</span>
              </div>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-2">
                  <FormField
                    control={editForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t('community.editPlaceholder', 'Edit your comment...')}
                            className="min-h-[60px] resize-none"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEditForm(false);
                        editForm.reset({ content: comment.content });
                      }}
                    >
                      {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={editCommentMutation.isPending}
                    >
                      {editCommentMutation.isPending ? (
                        <>{t('community.updating', 'Updating...')}</>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          {t('community.update', 'Update')}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReaction?.(comment.id)}
              className="text-xs text-gray-500 hover:text-red-600 h-6 px-1 sm:px-2"
            >
              <Heart className="h-3 w-3 mr-0.5 sm:mr-1" />
              {comment._count?.reactions || 0}
            </Button>
            {user && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-blue-600 h-6 px-1 sm:px-2"
              >
                <Reply className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">{t('community.reply', 'Reply')}</span>
                <span className="sm:hidden">Reply</span>
              </Button>
            )}
            {user && user.id === comment.author?.id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="text-xs text-gray-500 hover:text-blue-600 h-6 px-1 sm:px-2"
                >
                  <Edit className="h-3 w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('community.edit', 'Edit')}</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment()}
                  className="text-xs text-gray-500 hover:text-red-600 h-6 px-1 sm:px-2"
                >
                  <Trash2 className="h-3 w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('community.delete', 'Delete')}</span>
                  <span className="sm:hidden">Del</span>
                </Button>
              </>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && user && (
            <div className="mt-3 ml-2">
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="space-y-2">
                  <FormField
                    control={replyForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder={t('community.replyPlaceholder', 'Write a reply... Use @username to mention someone')}
                              className="min-h-[60px] resize-none"
                              value={field.value}
                              name={field.name}
                              ref={(el) => {
                                textareaRef.current = el;
                                if (field.ref) field.ref(el);
                              }}
                              onChange={(e) => {
                                field.onChange(e);
                                handleTextareaChange(e.target.value, e.target);
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                            />
                            {showSuggestions && mentionSuggestions.length > 0 && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px] mt-1">
                                {mentionSuggestions.map((user) => (
                                  <button
                                    key={user.id}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleMentionSelect(user.username)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.profileImage || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {getUserInitials({ firstName: user.firstName, lastName: user.lastName })}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">@{user.username}</div>
                                      <div className="text-xs text-gray-500">{user.firstName} {user.lastName}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(false)}
                    >
                      {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createReplyMutation.isPending}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {createReplyMutation.isPending ? t('common.posting', 'Posting...') : t('community.postReply', 'Post Reply')}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReaction={onReaction}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          onReaction={onReaction}
        />
      ))}
    </div>
  );
}