import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full font-medium',
          {
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-sm': size === 'md',
          },
          {
            'bg-muted text-muted-foreground': variant === 'default',
            'bg-primary-light text-primary-dark': variant === 'primary',
            'bg-accent-light text-accent': variant === 'success',
            'bg-amber-50 text-warning dark:bg-amber-900/20': variant === 'warning',
            'bg-red-50 text-danger dark:bg-red-900/20': variant === 'danger',
            'bg-sky-50 text-info dark:bg-sky-900/20': variant === 'info',
            'border border-border bg-transparent text-muted-foreground': variant === 'outline',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
