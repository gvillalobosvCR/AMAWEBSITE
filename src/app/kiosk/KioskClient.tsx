'use client'

import { useState, useEffect } from 'react'
import InactivityTracker from '@/components/InactivityTracker'
import SignaturePad from '@/components/SignaturePad'
import { submitWaiver } from '@/app/actions/waiver'
import { ArrowLeft, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react'

interface KioskClientProps {
  activeVersion: {
    id: string
    version: string
    title_es: string
    title_en: string
    content_es: string
    content_en: string
  }
  minAge: number
  inactivityTimeout: number
  confirmationTimeout: number
  kioskPin: string
  agencies: { id: string; name: string }[]
}

export default function KioskClient({
  activeVersion,
  minAge,
  inactivityTimeout,
  confirmationTimeout,
  kioskPin,
  agencies,
}: KioskClientProps) {
  // Page states: 'details' | 'sign' | 'success'
  const [step, setStep] = useState<'details' | 'sign' | 'success'>('details')
  const lang = 'es' // Default language for DB consistency, interface is bilingual

  // Customer info states
  const [fullName, setFullName] = useState('')
  const [idPassport, setIdPassport] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')

  // Agency States
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('')
  const [isAgencyUnlocked, setIsAgencyUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState(false)

  // Guardian info states (conditional)
  const [guardianName, setGuardianName] = useState('')
  const [guardianId, setGuardianId] = useState('')
  const [relationship, setRelationship] = useState('')
  const [guardianSignature, setGuardianSignature] = useState('')

  // Agreement and Signature
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')

  // Submit states
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiverNumber, setWaiverNumber] = useState<string | null>(null)

  // Derived states
  const isMinor = age !== '' && parseInt(age, 10) < minAge

  const resetAllState = () => {
    setFullName('')
    setIdPassport('')
    setAge('')
    setEmail('')
    setGuardianName('')
    setGuardianId('')
    setRelationship('')
    setGuardianSignature('')
    setAgreed(false)
    setSignature('')
    setStep('details')
    setSubmitting(false)
    setError(null)
    setWaiverNumber(null)
    // Preserve selectedAgencyId and isAgencyUnlocked status for group submissions
  }

  // Handle auto redirection on success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        resetAllState()
      }, confirmationTimeout * 1000)
      return () => clearTimeout(timer)
    }
  }, [step, confirmationTimeout])

  const handleNextStep = () => {
    if (step === 'details') {
      // Validate inputs
      if (!fullName.trim() || !idPassport.trim() || !age) {
        setError('Por favor complete todos los campos. / Please fill in all fields.')
        return
      }
      const parsedAge = parseInt(age, 10)
      if (isNaN(parsedAge) || parsedAge <= 0) {
        setError('Ingrese una edad válida. / Please enter a valid age.')
        return
      }

      if (isMinor) {
        if (!guardianName.trim() || !guardianId.trim() || !relationship.trim()) {
          setError(
            'Por favor complete los datos del tutor responsable. / Please fill in the legal guardian details.'
          )
          return
        }
      }
      setError(null)
      setStep('sign')
    }
  }

  const handleVerifyPin = () => {
    if (enteredPin === kioskPin) {
      setIsAgencyUnlocked(true)
      setShowPinModal(false)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  const handleSubmit = async () => {
    if (!agreed) {
      setError(
        'Debe aceptar los términos para continuar. / You must agree to the terms to proceed.'
      )
      return
    }

    if (!signature) {
      setError(
        'Debe firmar el descargo de responsabilidad. / You must sign the waiver form.'
      )
      return
    }

    if (isMinor && !guardianSignature) {
      setError(
        'El tutor legal debe firmar el descargo. / The legal guardian must sign the waiver.'
      )
      return
    }

    setError(null)
    setSubmitting(true)

    const result = await submitWaiver({
      fullName,
      idPassport,
      age: parseInt(age, 10),
      language: lang!,
      signatureBase64: signature,
      versionId: activeVersion.id,
      exactContent: `${activeVersion.title_es} / ${activeVersion.title_en}\n\n${activeVersion.content_es}\n\n${activeVersion.content_en}`,
      isMinor,
      agencyId: selectedAgencyId || undefined,
      email: email.trim() || undefined,
      guardianName: isMinor ? guardianName : undefined,
      guardianIdPassport: isMinor ? guardianId : undefined,
      relationship: isMinor ? relationship : undefined,
      guardianSignatureBase64: isMinor ? guardianSignature : undefined,
    })

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else if (result.success && result.waiverNumber) {
      setWaiverNumber(result.waiverNumber)
      setStep('success')
    }
  }

  return (
    <InactivityTracker timeoutSeconds={inactivityTimeout} onTimeout={resetAllState}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        
        {/* Header matching Arenal branding */}
        <header className="bg-white border-b border-slate-100 shadow-sm shrink-0">
          <div className="bg-teal-900 h-4 w-full" />
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold text-teal-800 font-serif leading-none tracking-tight">
                Arenal
              </h1>
              <span className="text-[10px] tracking-widest text-emerald-600 font-bold uppercase">
                Mundo Aventura
              </span>
            </div>
            {step !== 'success' && (
              <button
                onClick={resetAllState}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Reiniciar / Restart
              </button>
            )}
          </div>
        </header>

        {/* Form Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">

          {/* STEP 2: PERSONAL DETAILS */}
          {step === 'details' && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Información del Participante / Participant Details
                </h3>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                
                {/* Agency Selection Dropdown (AMA protected) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-100 mb-6">
                  <div className="md:col-span-12 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block flex items-center justify-between">
                      <span>Agencia / Agency</span>
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Solo personal de AMA / AMA Staff Only
                      </span>
                    </label>
                    
                    <div className="relative flex items-center">
                      <select
                        disabled={!isAgencyUnlocked}
                        value={selectedAgencyId}
                        onChange={(e) => setSelectedAgencyId(e.target.value)}
                        className={`w-full p-4 bg-slate-50 border rounded-2xl text-slate-800 placeholder-slate-400 outline-none transition-all text-base md:text-lg appearance-none ${
                          isAgencyUnlocked 
                            ? 'border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 cursor-pointer' 
                            : 'border-slate-200 opacity-75 cursor-not-allowed bg-slate-100'
                        }`}
                      >
                        <option value="">-- Seleccionar Agencia / Select Agency --</option>
                        {agencies.map((agency) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Lock/Unlock Toggle Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isAgencyUnlocked) {
                            setIsAgencyUnlocked(false)
                          } else {
                            setEnteredPin('')
                            setPinError(false)
                            setShowPinModal(true)
                          }
                        }}
                        className={`absolute right-4 p-2 rounded-xl transition-all cursor-pointer ${
                          isAgencyUnlocked 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-teal-800 text-white hover:bg-teal-900'
                        }`}
                      >
                        {isAgencyUnlocked ? (
                          <span className="text-xs font-bold px-1.5 py-0.5 flex items-center gap-1">🔓 Desbloqueado / Unlocked</span>
                        ) : (
                          <span className="text-xs font-bold px-1.5 py-0.5 flex items-center gap-1">🔒 Bloqueado / Locked</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      Nombre completo / Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Escriba su nombre completo / Enter your full name"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      Identificación / ID / Passport *
                    </label>
                    <input
                      type="text"
                      value={idPassport}
                      onChange={(e) => setIdPassport(e.target.value)}
                      placeholder="Cédula o pasaporte / Passport or ID number"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      Edad / Age *
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>

                  {/* Email Field (Optional) */}
                  <div className="md:col-span-12 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      Correo Electrónico / Email <span className="text-xs font-semibold text-slate-400 italic">(Opcional / Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. cliente@email.com / client@email.com"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>
                </div>

                {/* Conditional Minor Guardian Section */}
                {isMinor && (
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm">
                      <span className="font-bold block mb-1">
                        Aviso para menores de edad / Guardian Required for Minors
                      </span>
                      <span>
                        Al ser menor de 18 años, un padre, madre o tutor legal debe llenar y firmar el descargo de responsabilidad. / As the participant is under 18 years old, a parent or legal guardian must complete and sign this waiver.
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-800">
                      Tutor Responsable / Parent or Legal Guardian
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          Nombre completo del tutor / Guardian Full Name *
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="Nombre completo del adulto / Enter guardian name"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          Identificación del tutor / Guardian ID / Passport *
                        </label>
                        <input
                          type="text"
                          value={guardianId}
                          onChange={(e) => setGuardianId(e.target.value)}
                          placeholder="Cédula o pasaporte del adulto / Passport or ID number"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          Relación con el menor / Relationship to minor *
                        </label>
                        <input
                          type="text"
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          placeholder="e.g. Padre / Madre o Mother / Father"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleNextStep}
                    className="px-8 py-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-lg rounded-2xl shadow-md cursor-pointer flex items-center gap-2 active:scale-98 transition-all"
                  >
                    <span>Siguiente / Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: READ WAIVER & SIGN */}
          {step === 'sign' && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('details')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-slate-800">
                  Descargo de Responsabilidad / Liability Waiver
                </h3>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Scrollable Waiver Text Box showing both Spanish and English versions */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 overflow-y-auto max-h-64 leading-relaxed text-sm md:text-base text-slate-600 space-y-6">
                <div>
                  <p className="font-extrabold text-teal-800 text-base md:text-lg mb-2">
                    {activeVersion.title_es}
                  </p>
                  <p className="whitespace-pre-line">
                    {activeVersion.content_es}
                  </p>
                </div>
                
                <div className="border-t border-slate-200 pt-6">
                  <p className="font-extrabold text-teal-800 text-base md:text-lg mb-2">
                    {activeVersion.title_en}
                  </p>
                  <p className="whitespace-pre-line">
                    {activeVersion.content_en}
                  </p>
                </div>
                
                <span className="block text-right text-xs text-slate-400 font-mono pt-4">
                  Version: {activeVersion.version}
                </span>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-teal-50/50 hover:border-teal-300 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-6 h-6 accent-teal-700 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-slate-700 text-sm md:text-base leading-snug">
                  He leído, entiendo y acepto los términos y condiciones del presente formulario de descargo. / I have read, understand and agree to the terms and conditions of this waiver.
                </span>
              </label>

              {/* Signature Capture */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-600 block">
                  Firma del Participante / Participant Signature *
                </span>
                <SignaturePad
                  onSave={(data) => setSignature(data)}
                  onClear={() => setSignature('')}
                  placeholder="Firme aquí con el dedo / Sign here with your finger"
                />
              </div>

              {/* Guardian Signature (conditional) */}
              {isMinor && (
                <div className="space-y-2 pt-6 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-600 block">
                    Firma del Tutor Responsable / Legal Guardian Signature *
                  </span>
                  <SignaturePad
                    onSave={(data) => setGuardianSignature(data)}
                    onClear={() => setGuardianSignature('')}
                    placeholder="Firme aquí con el dedo (Tutor) / Sign here with your finger (Guardian)"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Tablet: {fullName || 'Waiver'}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-4 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal-900/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center min-w-[200px]"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'FIRMAR Y ENVIAR / SIGN & SUBMIT'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 py-14 md:p-16 max-w-xl w-full mx-auto text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 uppercase tracking-wide">
                Formulario registrado correctamente / Waiver successfully submitted
              </h2>
              
              <p className="text-slate-500 text-base md:text-lg mb-6">
                ¡Gracias! / Thank you!
              </p>

              {waiverNumber && (
                <div className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-mono tracking-wider font-semibold mb-8 select-all">
                  Waiver ID: {waiverNumber}
                </div>
              )}

              <p className="text-xs text-slate-400 italic">
                Redireccionando al inicio... / Redirecting back...
              </p>
            </div>
          )}
        </main>
      </div>

      {/* PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Desbloquear Agencia
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Ingrese el PIN de seguridad de AMA para habilitar la selección.
              </p>
            </div>
            
            <input
              type="password"
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value)
                setPinError(false)
              }}
              placeholder="PIN"
              className={`w-full p-3 text-center border rounded-xl font-bold text-lg focus:outline-none focus:ring-4 ${
                pinError 
                  ? 'border-rose-300 focus:ring-rose-100 bg-rose-50 text-rose-800' 
                  : 'border-slate-200 focus:border-teal-700 focus:ring-teal-100'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyPin()
                }
              }}
            />

            {pinError && (
              <p className="text-rose-600 text-xs font-semibold">
                PIN incorrecto / Incorrect PIN
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar / Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPin}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl cursor-pointer"
              >
                Confirmar / Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </InactivityTracker>
  )
}
