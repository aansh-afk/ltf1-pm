export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  }

  return (
    <div className="flex items-center justify-center p-8">
      <span className={`loading loading-spinner text-primary ${sizeClasses[size]}`}></span>
    </div>
  )
}