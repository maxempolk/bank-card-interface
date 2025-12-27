interface DNBLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { width: 48, height: 24, fontSize: 16, x: 2, y: 18 },
  md: { width: 64, height: 40, fontSize: 24, x: 8, y: 30 },
  lg: { width: 80, height: 48, fontSize: 32, x: 8, y: 36 },
}

export function DNBLogo({ size = 'sm' }: DNBLogoProps) {
  const config = sizes[size]

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x={config.x}
        y={config.y}
        fontFamily="Arial, sans-serif"
        fontSize={config.fontSize}
        fontWeight="bold"
        fill="currentColor"
        className="text-accent"
      >
        DNB
      </text>
    </svg>
  )
}
