'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { DNBLogo } from '@/components/ui/dnb-logo'

interface CardNumberDisplayProps {
  cardNumber: string
}

export function CardNumberDisplay({ cardNumber }: CardNumberDisplayProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (isCopied) return

    try {
      await navigator.clipboard.writeText(cardNumber)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [cardNumber, isCopied])

  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        onClick={handleCopy}
        className="group flex items-center gap-2 rounded-md transition-all hover:bg-muted/50 px-2 py-1 -mx-2"
      >
        <span className="font-mono text-sm tracking-wider text-foreground">{cardNumber}</span>
        <div className="relative">
          <Copy
            className={`h-3.5 w-3.5 text-muted-foreground transition-all ${
              isCopied ? 'scale-0 opacity-0' : 'scale-100 opacity-100 group-hover:text-foreground'
            }`}
          />
          <Check
            className={`absolute inset-0 h-3.5 w-3.5 text-accent transition-all ${
              isCopied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          />
        </div>
      </button>
      <div className="flex items-center gap-1">
        <DNBLogo size="sm" />
      </div>
    </div>
  )
}
