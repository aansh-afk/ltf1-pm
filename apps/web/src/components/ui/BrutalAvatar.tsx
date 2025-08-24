import { ImgHTMLAttributes } from 'react'
import clsx from 'clsx'

interface BrutalAvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  name?: string
}

export default function BrutalAvatar({ 
  size = 'md',
  name,
  src,
  alt,
  className,
  ...props
}: BrutalAvatarProps) {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-base'
  }

  // Generate initials from name
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const baseClasses = clsx(
    'relative overflow-hidden border-2 border-[var(--theme-border)]',
    'bg-[var(--theme-background-secondary)] flex items-center justify-center',
    'font-bold uppercase text-[var(--theme-foreground)]',
    sizeClasses[size],
    className
  )

  if (src) {
    return (
      <div className={baseClasses} style={{ borderRadius: '0 !important' }}>
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          style={{ borderRadius: '0 !important' }}
          {...props}
        />
      </div>
    )
  }

  return (
    <div className={baseClasses} style={{ borderRadius: '0 !important' }}>
      {initials || '??'}
    </div>
  )
}