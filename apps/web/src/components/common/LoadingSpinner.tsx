export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className="flex items-center justify-center p-[20px]">
      <div className={`brutal-loading ${sizeClasses[size]}`}>
        <div className="text-brutal-sm text-center animate-brutal-pulse">
          LOADING...
        </div>
      </div>
    </div>
  )
}