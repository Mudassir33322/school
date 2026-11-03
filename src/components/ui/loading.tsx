import clsx from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  message?: string
}

export default function Loading({ size = 'md', className, text, message }: LoadingProps) {
  const displayText = text ?? message ?? 'Loading...'
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      <p className="text-sm text-muted-foreground">{displayText}</p>
    </div>
  )
}

export { Loading }
