import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  text?: string
}

export function LoadingSpinner({ className, text = 'Загрузка...' }: LoadingSpinnerProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      {text && <p className="mt-4 text-muted-foreground">{text}</p>}
    </div>
  )
}
