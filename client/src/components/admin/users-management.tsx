import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash2, MoreHorizontal, CheckCircle, User, Shield, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; userId: number | null }>({
    open: false,
    userId: null,
  });
  
  const { 
    users, 
    isLoadingUsers,
    changeUserRole,
    deleteUser,
    isChangingRole,
    isDeleting
  } = useAdmin();

  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    const searchFields = [
      user.username,
      user.email,
      user.firstName,
      user.lastName,
      user.role
    ].map(field => field?.toLowerCase());
    
    return searchFields.some(field => field?.includes(searchTerm.toLowerCase()));
  });

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (deleteUserDialog.userId) {
      await deleteUser(deleteUserDialog.userId);
      setDeleteUserDialog({ open: false, userId: null });
    }
  };

  // Get badge color based on user role
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Format date to relative time
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingUsers ? (
          // Loading skeleton
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profileImage || undefined} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback>{getInitials(user.firstName || '', user.lastName || '')}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => window.open(`/users/${user.id}`, '_blank')}
                            >
                              <User className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={user.role === 'user' || isChangingRole}
                              onClick={() => changeUserRole(user.id, 'user')}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Set as User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={user.role === 'moderator' || isChangingRole}
                              onClick={() => changeUserRole(user.id, 'moderator')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Set as Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={user.role === 'admin' || isChangingRole}
                              onClick={() => changeUserRole(user.id, 'admin')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Set as Admin
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteUserDialog({ open: true, userId: user.id })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ ...deleteUserDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteUserDialog({ open: false, userId: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}