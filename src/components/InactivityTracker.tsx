'use client'

import { useEffect, useState, useRef } from 'react'

interface InactivityTrackerProps {
  timeoutSeconds: number // Total timeout e.g. 120s
  onTimeout: () => void
  children: React.ReactNode
}

export default function InactivityTracker({ timeoutSeconds, onTimeout, children }: InactivityTrackerProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(20) // 20-second warning countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const warningThreshold = Math.max(10, timeoutSeconds - 20) // Show warning 20s before timeout

  const resetTimer = () => {
    // Hide warning if visible
    setShowWarning(false)
    setCountdown(20)

    // Clear existing intervals/timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    // Set new main inactivity timer
    timerRef.current = setTimeout(() => {
      // Trigger warning state
      setShowWarning(true)
      
      // Start warning countdown
      let currentCount = 20
      countdownIntervalRef.current = setInterval(() => {
        currentCount -= 1
        setCountdown(currentCount)

        if (currentCount <= 0) {
          // Timeout reached, clear timers and trigger callback
          cleanup()
          onTimeout()
        }
      }, 1000)

    }, warningThreshold * 1000)
  }

  const cleanup = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll']
    
    // Initialize timer
    resetTimer()

    const handleActivity = () => {
      // If warning modal is open, let the user click the button to dismiss,
      // otherwise, reset the timer in background.
      if (!showWarning) {
        resetTimer()
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      cleanup()
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [showWarning, timeoutSeconds])

  const handleKeepAlive = () => {
    resetTimer()
  }

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              ¿Sigues ahí? / Are you still there?
            </h3>
            
            <p className="text-slate-600 mb-6 text-sm md:text-base leading-relaxed">
              El formulario se borrará por inactividad en <span className="font-extrabold text-amber-600 text-lg">{countdown}</span> segundos.
              <br />
              <span className="text-xs md:text-sm text-slate-400 block mt-1">
                The form will reset due to inactivity in {countdown} seconds.
              </span>
            </p>

            <button
              onClick={handleKeepAlive}
              className="w-full py-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg rounded-xl shadow-lg shadow-teal-700/20 active:scale-98 transition-all cursor-pointer"
            >
              Continuar / Keep filling
            </button>
          </div>
        </div>
      )}
    </>
  )
}
