import { useEffect, useState, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import type { AuthBottomSheetProps } from './types.js'
import { useBottomSheetDrag } from './use-bottom-sheet-drag.js'

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" className="loodi-auth-sheet__google-icon" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3.2-4.3 3.2-7.3Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" /><path fill="#EA4335" d="M12 6.1c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z" /></svg>
}

export function AuthBottomSheet({ open, state, onClose, onSignInWithGoogle, onSignInWithMagicLink, onCompleteHandle, onAbandonIncompleteAccount, onOverlayChange }: AuthBottomSheetProps) {
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [pending, setPending] = useState<'google' | 'magic-link' | 'handle' | 'abandon' | null>(null)
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null)
  const close = () => {
    if (state === 'handle-required' && !confirmAbandon) { setConfirmAbandon(true); return }
    onClose()
  }
  const drag = useBottomSheetDrag(close)

  useEffect(() => {
    if (!open) { setConfirmAbandon(false); setPending(null); setNotice(null) }
  }, [open])
  useEffect(() => {
    onOverlayChange?.(open)
    return () => onOverlayChange?.(false)
  }, [open, onOverlayChange])

  const run = async (action: NonNullable<typeof pending>, work: () => Promise<void>, success?: string) => {
    if (pending) return false
    setPending(action)
    try { await work(); if (success) setNotice({ tone: 'info', text: success }); return true }
    catch (error) { setNotice({ tone: 'danger', text: error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie dans un instant.' }); return false }
    finally { setPending(null) }
  }

  if (!open) return null
  const disabled = pending !== null
  const title = confirmAbandon ? 'Annuler l’inscription' : state === 'handle-required' ? 'Quel nom choisiras-tu ?' : 'Connexion Loodi'

  return <div className="loodi-auth-sheet" role="dialog" aria-modal="true" aria-labelledby="loodi-auth-sheet-title">
    <button type="button" className="loodi-auth-sheet__backdrop" aria-label="Fermer" onClick={close} />
    <form className={`loodi-auth-sheet__panel${drag.isDragging ? ' loodi-auth-sheet__panel--dragging' : ''}`} style={{ '--sheet-drag-offset': `${drag.dragOffset}px`, transform: `translateY(${drag.dragOffset}px)` } as CSSProperties} onSubmit={(event) => { event.preventDefault(); if (state === 'handle-required') void run('handle', () => onCompleteHandle(handle)); else void run('magic-link', () => onSignInWithMagicLink(email), 'Le lien est en route : regarde ta boîte e-mail.') }}>
      <div data-testid="auth-sheet-handle" className="loodi-auth-sheet__handle" {...drag.handleProps} />
      <header><h2 id="loodi-auth-sheet-title">{title}</h2><button type="button" disabled={disabled} onClick={close} aria-label="Fermer"><X size={20} aria-hidden="true" /></button></header>
      {confirmAbandon ? <>
        <p>Ton inscription n’est pas terminée. Si tu l’annules, ce compte provisoire sera supprimé.</p>
        <button type="button" disabled={disabled} className="loodi-auth-sheet__primary" onClick={() => setConfirmAbandon(false)}>Continuer mon inscription</button>
        <button type="button" disabled={disabled} className="loodi-auth-sheet__secondary" onClick={() => void run('abandon', onAbandonIncompleteAccount).then((completed) => { if (completed) onClose() })}>{pending === 'abandon' ? 'Annulation…' : 'Annuler l’inscription'}</button>
      </> : state === 'handle-required' ? <>
        <p>C’est le nom sous lequel la communauté te reconnaîtra.</p>
        <label htmlFor="loodi-auth-handle">Nom de joueur</label>
        <input id="loodi-auth-handle" disabled={disabled} value={handle} onChange={(event) => setHandle(event.target.value)} autoComplete="username" />
        <button type="submit" disabled={disabled} className="loodi-auth-sheet__primary">{pending === 'handle' ? 'Enregistrement…' : 'C’est parti'}</button>
        <button type="button" disabled={disabled} className="loodi-auth-sheet__link" onClick={() => setConfirmAbandon(true)}>Utiliser un autre compte</button>
      </> : <>
        <button type="button" disabled={disabled} className="loodi-auth-sheet__secondary loodi-auth-sheet__google" onClick={() => void run('google', onSignInWithGoogle)}><GoogleIcon />{pending === 'google' ? 'Connexion…' : 'Continuer avec Google'}</button>
        <label htmlFor="loodi-auth-email">E-mail</label>
        <input id="loodi-auth-email" type="email" required disabled={disabled} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        <button type="submit" disabled={disabled} className="loodi-auth-sheet__primary">{pending === 'magic-link' ? 'Envoi…' : 'Recevoir un lien magique'}</button>
      </>}
      {notice && <p className={`loodi-auth-sheet__notice loodi-auth-sheet__notice--${notice.tone}`} role="status">{notice.text}</p>}
      {state !== 'handle-required' && !confirmAbandon && <button type="button" disabled={disabled} className="loodi-auth-sheet__link" onClick={close}>Fermer</button>}
    </form>
  </div>
}
