import { useState } from 'react';

interface ProfileAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-14 h-14 text-lg',
};

export function ProfileAvatar({ src, name, size = 'sm', className = '' }: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full ring-2 ring-[var(--color-border-subtle)] ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center ring-2 ring-[var(--color-border-subtle)] ${className}`}
    >
      <span className="font-medium text-[var(--color-accent)]">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
