"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  const [isDragging, setIsDragging] = React.useState<number | null>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return value[0]
    const rect = trackRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const rawValue = min + percentage * (max - min)
    return Math.round(rawValue / step) * step
  }

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(index)
  }

  React.useEffect(() => {
    if (isDragging === null) return

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX)
      const newValues = [...value]
      newValues[isDragging] = newValue

      // Ensure min <= max for range sliders
      if (value.length === 2) {
        if (isDragging === 0 && newValue > value[1]) {
          newValues[0] = value[1]
        } else if (isDragging === 1 && newValue < value[0]) {
          newValues[1] = value[0]
        }
      }

      onValueChange(newValues)
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, value, onValueChange, min, max, step])

  const leftPercent = value.length === 2 ? getPercentage(value[0]) : 0
  const rightPercent = getPercentage(value.length === 2 ? value[1] : value[0])

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <div
        ref={trackRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className="absolute h-full bg-primary-500"
          style={{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
          }}
        />
      </div>
      {value.map((val, index) => (
        <div
          key={index}
          className={cn(
            "absolute h-5 w-5 rounded-full border-2 border-primary-500 bg-white cursor-grab",
            isDragging === index && "cursor-grabbing"
          )}
          style={{
            left: `calc(${getPercentage(val)}% - 10px)`,
          }}
          onMouseDown={handleMouseDown(index)}
        />
      ))}
    </div>
  )
}
