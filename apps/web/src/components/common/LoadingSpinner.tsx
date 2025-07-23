export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-32px h-32px',
    md: 'w-48px h-48px',
    lg: 'w-64px h-64px',
  }

  return (
    <div className="flex items-center justify-center p-32px">
      <div className={`brutal-loading ${sizeClasses[size]}`}>
        <div className="text-brutal-sm text-center animate-brutal-pulse">
          LOADING...
        </div>
      </div>
    </div>
  )
}