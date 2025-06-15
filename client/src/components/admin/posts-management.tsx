import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Calendar, User, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  userId: number;
  createdAt: string;
  updatedAt: string | null;
  author: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
  _count: {
    comments: number;
    reactions: number;
  };
}

export default function PostsManagement() {
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/admin/posts"],
    queryFn: () => apiRequest("/api/admin/posts")
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: number; reason: string }) => {
      return apiRequest(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        body: { reason }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({
        title: "Post deleted",
        description: "The harmful post has been removed successfully.",
      });
      setDeleteReason("");
      setDeletingPostId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  });

  const handleDeletePost = (postId: number) => {
    if (!deleteReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for deleting this post.",
        variant: "destructive",
      });
      return;
    }
    deletePostMutation.mutate({ postId, reason: deleteReason });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-800",
      playdates: "bg-green-100 text-green-800",
      advice: "bg-purple-100 text-purple-800",
      events: "bg-orange-100 text-orange-800",
      recommendations: "bg-yellow-100 text-yellow-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading posts: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Community Posts Management</h3>
        <Badge variant="secondary">
          {posts?.length || 0} total posts
        </Badge>
      </div>

      <div className="space-y-4">
        {posts?.map((post: CommunityPost) => (
          <Card key={post.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <Badge className={getCategoryColor(post.category)}>
                      {post.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author.firstName} {post.author.lastName}</span>
                      <span className="text-gray-400">(@{post.author.username})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post._count.comments} comments</span>
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingPostId(post.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Harmful Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to permanently delete the post "{post.title}" by {post.author.firstName} {post.author.lastName}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="deleteReason">Reason for deletion (required)</Label>
                      <Textarea
                        id="deleteReason"
                        placeholder="e.g., Inappropriate content, harassment, spam, etc."
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setDeleteReason("");
                        setDeletingPostId(null);
                      }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletePostMutation.isPending || !deleteReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 line-clamp-3">{post.content}</p>
              {post.updatedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {formatDate(post.updatedAt)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {posts?.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No community posts found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}