import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'rounded-lg': true,
            'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:scale-[0.98]': variant === 'primary',
            'bg-secondary text-white hover:bg-gray-800 dark:hover:bg-gray-700 shadow-sm': variant === 'secondary',
            'bg-accent text-white hover:bg-emerald-600 shadow-sm': variant === 'success',
            'bg-danger text-white hover:bg-red-600 shadow-sm': variant === 'danger',
            'hover:bg-muted text-foreground': variant === 'ghost',
            'border border-border bg-transparent hover:bg-muted text-foreground': variant === 'outline',
          },
          {
            'text-xs px-2.5 py-1.5 h-8 gap-1.5': size === 'sm',
            'text-sm px-4 py-2 h-10 gap-2': size === 'md',
            'text-base px-6 py-3 h-12 gap-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
