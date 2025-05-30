import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileAvatarProps {
  profileImage?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfileAvatar({ 
  profileImage, 
  firstName = "", 
  lastName = "", 
  size = 'md',
  className = "" 
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Determine avatar size class
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  // Get fallback text (initials)
  const getFallbackText = () => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  // Generate unique key for each environment
  const getImageUrl = (url: string) => {
    // If URL is already absolute, use it
    if (url?.startsWith('http')) return url;
    
    // Otherwise, use relative URL with timestamp to avoid caching
    return `${url}?t=${Date.now()}`;
  };
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {profileImage && !imageError ? (
        <AvatarImage 
          src={getImageUrl(profileImage)} 
          alt={`${firstName} ${lastName}`}
          onError={() => setImageError(true)} 
        />
      ) : (
        <AvatarImage 
          src="/avatar.png" 
          alt="Default avatar"
        />
      )}
      <AvatarFallback>
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
}