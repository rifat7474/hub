import * as React from 'react'
import { cn } from './utils'

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center animate-in fade-in-50',
      className,
    )}
    {...props}
  />
))
Empty.displayName = 'Empty'

const EmptyHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex max-w-sm flex-col items-center text-center', className)}
    {...props}
  />
))
EmptyHeader.displayName = 'EmptyHeader'

interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'icon' | 'default'
}

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mb-4 flex items-center justify-center',
        variant === 'icon' &&
          'h-12 w-12 rounded-full bg-muted text-muted-foreground [&_svg]:h-6 [&_svg]:w-6',
        className,
      )}
      {...props}
    />
  ),
)
EmptyMedia.displayName = 'EmptyMedia'

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-base font-semibold text-foreground', className)}
    {...props}
  />
))
EmptyTitle.displayName = 'EmptyTitle'

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-1.5 text-sm text-muted-foreground', className)}
    {...props}
  />
))
EmptyDescription.displayName = 'EmptyDescription'

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription }
