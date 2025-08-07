import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    type,
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400 text-sm">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
              'focus:border-blue-500 focus:ring-blue-500 focus:ring-1',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'placeholder:text-gray-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-gray-400 text-sm">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
