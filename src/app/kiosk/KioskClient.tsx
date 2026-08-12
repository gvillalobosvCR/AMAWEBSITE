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
}

export default function KioskClient({
  activeVersion,
  minAge,
  inactivityTimeout,
  confirmationTimeout,
}: KioskClientProps) {
  // Page states: 'language' | 'details' | 'sign' | 'success'
  const [step, setStep] = useState<'language' | 'details' | 'sign' | 'success'>('language')
  const [lang, setLang] = useState<'es' | 'en' | null>(null)

  // Customer info states
  const [fullName, setFullName] = useState('')
  const [idPassport, setIdPassport] = useState('')
  const [age, setAge] = useState('')

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
    setGuardianName('')
    setGuardianId('')
    setRelationship('')
    setGuardianSignature('')
    setAgreed(false)
    setSignature('')
    setLang(null)
    setStep('language')
    setSubmitting(false)
    setError(null)
    setWaiverNumber(null)
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
        setError(lang === 'es' ? 'Por favor complete todos los campos.' : 'Please fill in all fields.')
        return
      }
      const parsedAge = parseInt(age, 10)
      if (isNaN(parsedAge) || parsedAge <= 0) {
        setError(lang === 'es' ? 'Ingrese una edad válida.' : 'Please enter a valid age.')
        return
      }

      if (isMinor) {
        if (!guardianName.trim() || !guardianId.trim() || !relationship.trim()) {
          setError(
            lang === 'es'
              ? 'Por favor complete los datos del tutor responsable.'
              : 'Please fill in the legal guardian details.'
          )
          return
        }
      }
      setError(null)
      setStep('sign')
    }
  }

  const handleSubmit = async () => {
    if (!agreed) {
      setError(
        lang === 'es'
          ? 'Debe aceptar los términos para continuar.'
          : 'You must agree to the terms to proceed.'
      )
      return
    }

    if (!signature) {
      setError(
        lang === 'es'
          ? 'Debe firmar el descargo de responsabilidad.'
          : 'You must sign the waiver form.'
      )
      return
    }

    if (isMinor && !guardianSignature) {
      setError(
        lang === 'es'
          ? 'El tutor legal debe firmar el descargo.'
          : 'The legal guardian must sign the waiver.'
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
      exactContent: lang === 'es' ? activeVersion.content_es : activeVersion.content_en,
      isMinor,
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
            {lang && step !== 'success' && (
              <button
                onClick={resetAllState}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {lang === 'es' ? 'Reiniciar' : 'Restart'}
              </button>
            )}
          </div>
        </header>

        {/* Form Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
          
          {/* STEP 1: LANGUAGE SELECTION */}
          {step === 'language' && (
            <div className="text-center py-10 max-w-2xl mx-auto flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                Bienvenido a Arenal Mundo Aventura
              </h2>
              <p className="text-slate-400 text-sm md:text-base mb-10 uppercase tracking-wider font-semibold">
                Formulario de Descargo / Liability Waiver
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                <button
                  onClick={() => {
                    setLang('es')
                    setStep('details')
                  }}
                  className="py-8 bg-white border border-slate-200 hover:border-emerald-600 rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group active:scale-[0.98]"
                >
                  <span className="text-5xl group-hover:scale-110 transition-transform">🇨🇷</span>
                  <span className="text-xl md:text-2xl font-black text-teal-800 uppercase tracking-wide">
                    Español
                  </span>
                </button>

                <button
                  onClick={() => {
                    setLang('en')
                    setStep('details')
                  }}
                  className="py-8 bg-white border border-slate-200 hover:border-emerald-600 rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group active:scale-[0.98]"
                >
                  <span className="text-5xl group-hover:scale-110 transition-transform">🇺🇸</span>
                  <span className="text-xl md:text-2xl font-black text-teal-800 uppercase tracking-wide">
                    English
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL DETAILS */}
          {step === 'details' && lang && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setStep('language')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-slate-800">
                  {lang === 'es' ? 'Información del Participante' : 'Participant Details'}
                </h3>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      {lang === 'es' ? 'Nombre completo' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={lang === 'es' ? 'Escriba su nombre completo' : 'Enter your full name'}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      {lang === 'es' ? 'Identificación / Pasaporte' : 'ID / Passport'} *
                    </label>
                    <input
                      type="text"
                      value={idPassport}
                      onChange={(e) => setIdPassport(e.target.value)}
                      placeholder={lang === 'es' ? 'Cédula o pasaporte' : 'Passport or ID number'}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">
                      {lang === 'es' ? 'Edad' : 'Age'} *
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-base md:text-lg"
                    />
                  </div>
                </div>

                {/* Conditional Minor Guardian Section */}
                {isMinor && (
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm">
                      <span className="font-bold block mb-1">
                        {lang === 'es' ? 'Aviso para menores de edad' : 'Guardian Required for Minors'}
                      </span>
                      <span>
                        {lang === 'es'
                          ? 'Al ser menor de 18 años, un padre, madre o tutor legal debe llenar y firmar el descargo de responsabilidad.'
                          : 'As the participant is under 18 years old, a parent or legal guardian must complete and sign this waiver.'}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-800">
                      {lang === 'es' ? 'Tutor Responsable / Parent or Legal Guardian' : 'Legal Guardian Details'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          {lang === 'es' ? 'Nombre completo del tutor' : 'Guardian Full Name'} *
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder={lang === 'es' ? 'Nombre completo del adulto' : 'Enter guardian name'}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          {lang === 'es' ? 'Identificación / Pasaporte del tutor' : 'Guardian ID / Passport'} *
                        </label>
                        <input
                          type="text"
                          value={guardianId}
                          onChange={(e) => setGuardianId(e.target.value)}
                          placeholder={lang === 'es' ? 'Cédula o pasaporte del adulto' : 'Passport or ID number'}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">
                          {lang === 'es' ? 'Relación con el menor' : 'Relationship to minor'} *
                        </label>
                        <input
                          type="text"
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          placeholder={lang === 'es' ? 'e.g. Padre / Madre' : 'e.g. Mother / Father'}
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
                    <span>{lang === 'es' ? 'Siguiente' : 'Next'}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: READ WAIVER & SIGN */}
          {step === 'sign' && lang && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('details')}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-slate-800">
                  {lang === 'es' ? 'Descargo de Responsabilidad' : 'Liability Waiver'}
                </h3>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Scrollable Waiver Text Box */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 overflow-y-auto max-h-64 leading-relaxed text-sm md:text-base text-slate-600 space-y-4">
                <p className="font-extrabold text-teal-800 text-base md:text-lg">
                  {lang === 'es' ? activeVersion.title_es : activeVersion.title_en}
                </p>
                <p className="whitespace-pre-line">
                  {lang === 'es' ? activeVersion.content_es : activeVersion.content_en}
                </p>
                <span className="block text-right text-xs text-slate-400 font-mono">
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
                  {lang === 'es'
                    ? 'He leído, entiendo y acepto los términos y condiciones del presente formulario de descargo.'
                    : 'I have read, understand and agree to the terms and conditions of this waiver.'}
                </span>
              </label>

              {/* Signature Capture */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-600 block">
                  {lang === 'es' ? 'Firma del Participante' : 'Participant Signature'} *
                </span>
                <SignaturePad
                  onSave={(data) => setSignature(data)}
                  onClear={() => setSignature('')}
                  placeholder={lang === 'es' ? 'Firme aquí con el dedo / Sign here with your finger' : 'Sign here with your finger'}
                />
              </div>

              {/* Guardian Signature (conditional) */}
              {isMinor && (
                <div className="space-y-2 pt-6 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-600 block">
                    {lang === 'es' ? 'Firma del Tutor Responsable' : 'Legal Guardian Signature'} *
                  </span>
                  <SignaturePad
                    onSave={(data) => setGuardianSignature(data)}
                    onClear={() => setGuardianSignature('')}
                    placeholder={lang === 'es' ? 'Firme aquí con el dedo (Tutor) / Sign here with your finger (Guardian)' : 'Sign here with your finger (Guardian)'}
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
                  ) : lang === 'es' ? (
                    'FIRMAR Y ENVIAR'
                  ) : (
                    'SIGN & SUBMIT'
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
                {lang === 'es' ? 'Formulario registrado correctamente' : 'Waiver successfully submitted'}
              </h2>
              
              <p className="text-slate-500 text-base md:text-lg mb-6">
                {lang === 'es' ? '¡Gracias!' : 'Thank you!'}
              </p>

              {waiverNumber && (
                <div className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-mono tracking-wider font-semibold mb-8 select-all">
                  Waiver ID: {waiverNumber}
                </div>
              )}

              <p className="text-xs text-slate-400 italic">
                {lang === 'es' ? 'Redireccionando al inicio...' : 'Redirecting back to language selection...'}
              </p>
            </div>
          )}
        </main>
      </div>
    </InactivityTracker>
  )
}
