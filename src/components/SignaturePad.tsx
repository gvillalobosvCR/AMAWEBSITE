'use client'

import { useRef, useState, useEffect } from 'react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear: () => void
  placeholder?: string
}

export default function SignaturePad({ onSave, onClear, placeholder }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      // Keep drawing buffer sized to physical layout dimensions
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      clearCanvas()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    // For touch devices
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 }
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }

    // For mouse
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent default behaviors like scrolling when drawing on tablets
    if (e.cancelable) e.preventDefault()
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a' // Slate-900 line color

    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    if (e.cancelable) e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setIsEmpty(false)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas && isEmpty) return

    // Callback with base64 data url
    if (canvas) {
      onSave(canvas.toDataURL('image/png'))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onClear()
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden shadow-inner h-52">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm md:text-base font-medium">
            {placeholder || 'Firme aquí con el dedo / Sign here with your finger'}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors bg-white shadow-sm cursor-pointer"
        >
          Limpiar / Clear
        </button>
      </div>
    </div>
  )
}
