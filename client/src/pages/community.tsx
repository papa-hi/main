import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Search, 
  Plus, 
  Filter,
  Hash,
  Users,
  TrendingUp,
  Clock,
  Star,
  Edit,
  MoreHorizontal,
  Reply,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Types for community features
interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  hashtags: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    username: string;
  };
  _count: {
    comments: number;
    reactions: number;
  };
}

interface CommunityComment {
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
  replies: CommunityComment[];
  _count: {
    replies: number;
    reactions: number;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
}

// Form schemas
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
  category: z.string().min(1, 'Category is required'),
  hashtags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000, 'Comment is too long'),
  parentCommentId: z.number().optional(),
});

export default function CommunityPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [postMenuOpen, setPostMenuOpen] = useState<number | null>(null);

  // Fetch community posts
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['/api/community/posts', activeTab, selectedCategory, searchQuery, selectedHashtag],
    queryFn: async () => {
      const params = new URLSearchParams({
        feed: activeTab,
        ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedHashtag && { hashtag: selectedHashtag }),
      });
      const response = await fetch(`/api/community/posts?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/community/categories'],
    queryFn: () => fetch('/api/community/categories').then(res => res.json()),
  });

  // Fetch comments for a specific post
  const usePostComments = (postId: number, enabled: boolean = false) => {
    return useQuery({
      queryKey: ['/api/community/posts', postId, 'comments'],
      queryFn: async () => {
        const response = await fetch(`/api/community/posts/${postId}/comments`);
        if (!response.ok) {
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }
        return response.json();
      },
      enabled,
    });
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: z.infer<typeof postSchema>) => 
      apiRequest('POST', '/api/community/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setShowCreatePost(false);
      postForm.reset();
      toast({ 
        title: t('community.postCreated', 'Post created successfully!'),
        description: t('community.postCreatedDesc', 'Your post has been published to the community.'),
      });
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('community.postError', 'Failed to create post. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: z.infer<typeof commentSchema> }) =>
      apiRequest('POST', `/api/community/posts/${postId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setCommentingOn(null);
      commentForm.reset();
    },
  });

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: ({ postId, commentId, type }: { postId?: number; commentId?: number; type: string }) =>
      apiRequest('POST', '/api/community/reactions', { postId, commentId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: z.infer<typeof postSchema> }) =>
      apiRequest('PATCH', `/api/community/posts/${postId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setEditingPost(null);
      toast({
        title: t('community.postUpdated'),
        description: t('community.postUpdatedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('community.postUpdateError'),
        variant: 'destructive',
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: number) =>
      apiRequest('DELETE', `/api/community/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({
        title: t('community.postDeleted'),
        description: t('community.postDeletedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('community.postDeleteError'),
        variant: 'destructive',
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      apiRequest('PATCH', `/api/community/comments/${commentId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setEditingComment(null);
      toast({
        title: t('community.commentUpdated'),
        description: t('community.commentUpdatedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('community.commentUpdateError'),
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      apiRequest('DELETE', `/api/community/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      toast({
        title: t('community.commentDeleted'),
        description: t('community.commentDeletedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('community.commentDeleteError'),
        variant: 'destructive',
      });
    },
  });

  // Forms
  const postForm = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      hashtags: [],
    },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Handle hashtag extraction from content
  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  // Handle post submission
  const onSubmitPost = (data: z.infer<typeof postSchema>) => {
    console.log('Form submission data:', data);
    const hashtags = extractHashtags(data.content);
    const postData = { ...data, hashtags };
    console.log('Post data being sent:', postData);
    
    if (editingPost) {
      editPostMutation.mutate({ postId: editingPost, data: postData });
    } else {
      createPostMutation.mutate(postData);
    }
  };

  // Handle comment submission
  const onSubmitComment = (data: z.infer<typeof commentSchema>) => {
    if (commentingOn) {
      createCommentMutation.mutate({ postId: commentingOn, data });
    }
  };

  // Handle reactions
  const handleReaction = (postId?: number, commentId?: number, type: string = 'like') => {
    reactionMutation.mutate({ postId, commentId, type });
  };

  // Toggle comment visibility
  const toggleComments = (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Post Comments Component
  const PostComments = ({ postId }: { postId: number }) => {
    const { data: comments = [], isLoading } = usePostComments(postId, true);

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
        {comments.map((comment: any) => (
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
                  onClick={() => handleReaction(undefined, comment.id)}
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
  };



  // Handle share functionality
  const handleShare = async (post: any) => {
    const shareData = {
      title: post.title || 'Community Post',
      text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: window.location.href + '#post-' + post.id
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
        fallbackShare(shareData);
      }
    } else {
      fallbackShare(shareData);
    }
  };

  // Fallback share function
  const fallbackShare = (shareData: { title: string; text: string; url: string }) => {
    // Copy to clipboard
    navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`).then(() => {
      toast({
        title: t('community.linkCopied'),
        description: t('community.linkCopiedDesc'),
      });
    }).catch(() => {
      // Fallback if clipboard API fails
      toast({
        title: t('community.sharePost'),
        description: shareData.url,
      });
    });
  };

  // Format user display name
  const formatUserName = (user: { firstName: string; lastName: string; username: string }) => {
    return `${user.firstName} ${user.lastName}`;
  };

  // Get user initials for avatar
  const getUserInitials = (user: { firstName: string; lastName: string }) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('community.loginRequired')}</h2>
              <p className="text-gray-600 mb-4">{t('community.loginDescription')}</p>
              <Button onClick={() => window.location.href = '/login'}>
                {t('auth.login')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('nav.community')}</h1>
            <p className="text-gray-600 mt-1">{t('community.subtitle')}</p>
          </div>
          
          <Dialog open={showCreatePost || !!editingPost} onOpenChange={(open) => {
            if (!open) {
              setShowCreatePost(false);
              setEditingPost(null);
              postForm.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreatePost(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('community.createPost')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPost ? t('community.editPost') : t('community.createPost')}</DialogTitle>
              </DialogHeader>
              <Form {...postForm}>
                <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-4">
                  <FormField
                    control={postForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('community.postTitle')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('community.postTitlePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={postForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('community.category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('community.selectCategory')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {t(`community.categories.${category.id}`, category.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={postForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('community.content')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('community.contentPlaceholder')} 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          {t('community.hashtagTip')}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreatePost(false);
                      setEditingPost(null);
                      postForm.reset();
                    }}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createPostMutation.isPending || editPostMutation.isPending}>
                      {editingPost 
                        ? (editPostMutation.isPending ? t('common.saving') : t('community.saveChanges'))
                        : (createPostMutation.isPending ? t('common.publishing') : t('common.publish'))
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {t('community.search')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder={t('community.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t('community.category')}</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={t('community.allCategories')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('community.allCategories')}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {t(`community.categories.${category.id}`, category.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedHashtag && (
                    <div>
                      <label className="text-sm font-medium">{t('community.activeHashtag')}</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedHashtag('')}>
                          #{selectedHashtag} ×
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t('community.categoriesHeading')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-2 rounded-lg transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{t(`community.categories.${category.id}`, category.name)}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Feed tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="latest" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('community.latest')}
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('community.trending')}
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {t('community.popular')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Posts */}
            <div className="space-y-6">
              {postsError ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-triangle text-3xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('common.error', 'Error')}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {t('community.errorLoading', 'Failed to load community posts')}
                      </p>
                      <Button 
                        onClick={() => window.location.reload()}
                        variant="outline"
                      >
                        {t('common.retry', 'Try Again')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t('common.loading')}</p>
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('community.noPosts')}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {t('community.noPostsDescription')}
                      </p>
                      <Button onClick={() => setShowCreatePost(true)}>
                        {t('community.createFirstPost')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: CommunityPost) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      {/* Post header */}
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar>
                          <AvatarImage src={post.author.profileImage || undefined} />
                          <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{formatUserName(post.author)}</h4>
                            <span className="text-sm text-gray-500">@{post.author.username}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </span>
                            {post.isEdited && (
                              <Badge variant="outline" className="text-xs">
                                {t('community.edited')}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            {categories.find(c => c.id === post.category)?.name || post.category}
                          </Badge>
                        </div>
                        
                        {/* Post options for owner */}
                        {user && post.author.id === user.id && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setPostMenuOpen(postMenuOpen === post.id ? null : post.id);
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {postMenuOpen === post.id && (
                              <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setEditingPost(post.id);
                                    postForm.setValue('title', post.title || '');
                                    postForm.setValue('content', post.content);
                                    postForm.setValue('category', post.category);
                                    postForm.setValue('hashtags', post.hashtags || []);
                                    setPostMenuOpen(null);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  {t('common.edit')}
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                  onClick={() => {
                                    if (confirm(t('community.confirmDeletePost'))) {
                                      deletePostMutation.mutate(post.id);
                                    }
                                    setPostMenuOpen(null);
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  {t('common.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post content */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <div className="prose prose-sm max-w-none">
                          {post.content.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                        
                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.hashtags.map((hashtag, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => setSelectedHashtag(hashtag)}
                              >
                                <Hash className="h-3 w-3 mr-1" />
                                {hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post actions */}
                      <div className="flex items-center gap-4 pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(post.id)}
                          className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                        >
                          <Heart className="h-4 w-4" />
                          {post._count.reactions}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-2 text-gray-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {post._count.comments}
                          {showComments[post.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-2 text-gray-600"
                        >
                          <Share2 className="h-4 w-4" />
                          {t('community.share')}
                        </Button>
                      </div>

                      {/* Comments section */}
                      {showComments[post.id] && (
                        <div className="mt-4 pt-4 border-t">
                          {/* Comment form */}
                          <Form {...commentForm}>
                            <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="mb-4">
                              <FormField
                                control={commentForm.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profileImage || undefined} />
                                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <FormControl>
                                          <Input
                                            placeholder={t('community.writeComment')}
                                            {...field}
                                            onFocus={() => setCommentingOn(post.id)}
                                          />
                                        </FormControl>
                                        {commentingOn === post.id && (
                                          <div className="flex justify-end gap-2 mt-2">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setCommentingOn(null);
                                                commentForm.reset();
                                              }}
                                            >
                                              {t('common.cancel')}
                                            </Button>
                                            <Button
                                              type="submit"
                                              size="sm"
                                              disabled={createCommentMutation.isPending}
                                            >
                                              <Send className="h-4 w-4 mr-1" />
                                              {t('community.comment')}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </form>
                          </Form>
                          
                          {/* Comments list - placeholder for now */}
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">{t('community.commentsSection', 'Comments will load here')}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}