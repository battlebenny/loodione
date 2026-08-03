import { useEffect, useState, type CSSProperties } from 'react'
import { X } from 'lucide-react'
import type { AccountBottomSheetProps } from './types.js'
import { useBottomSheetDrag } from './use-bottom-sheet-drag.js'

export function AccountBottomSheet({ open, playerName, onClose, onOpenAccount, onSignOut, onOverlayChange }: AccountBottomSheetProps) {
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drag = useBottomSheetDrag(onClose)

  useEffect(() => { if (!open) { setConfirmSignOut(false); setPending(false); setError(null) } }, [open])
  useEffect(() => { onOverlayChange?.(open); return () => onOverlayChange?.(false) }, [open, onOverlayChange])
  if (!open) return null

  const signOut = async () => {
    if (pending) return
    setPending(true)
    try { await onSignOut(); onClose() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Une erreur est survenue. Réessaie dans un instant.') }
    finally { setPending(false) }
  }

  return <div className="loodi-auth-sheet" role="dialog" aria-modal="true" aria-labelledby="loodi-account-bottom-sheet-title">
    <button type="button" className="loodi-auth-sheet__backdrop" aria-label="Fermer" onClick={onClose} />
    <div className={`loodi-auth-sheet__panel${drag.isDragging ? ' loodi-auth-sheet__panel--dragging' : ''}`} style={{ '--sheet-drag-offset': `${drag.dragOffset}px` } as CSSProperties}>
      <div data-testid="bottom-sheet-handle" className="loodi-auth-sheet__handle" {...drag.handleProps} />
      <header><h2 id="loodi-account-bottom-sheet-title">{confirmSignOut ? 'Se déconnecter' : 'Mon compte Loodi'}</h2><button type="button" disabled={pending} onClick={onClose} aria-label="Fermer"><X size={20} aria-hidden="true" /></button></header>
      {confirmSignOut ? <><p>Tu veux vraiment changer de compte ? Tu pourras te reconnecter quand tu veux.</p><button type="button" disabled={pending} className="loodi-auth-sheet__primary" onClick={() => setConfirmSignOut(false)}>Rester connecté</button><button type="button" disabled={pending} className="loodi-auth-sheet__secondary" onClick={() => void signOut()}>{pending ? 'Déconnexion…' : 'Se déconnecter'}</button></> : <><p className="loodi-auth-sheet__player">{playerName ? `@${playerName}` : ''}</p><button type="button" className="loodi-auth-sheet__primary" onClick={() => { onOpenAccount(); onClose() }}>Gérer mon compte</button><button type="button" className="loodi-auth-sheet__secondary" onClick={() => setConfirmSignOut(true)}>Se déconnecter</button></>}
      {error && <p className="loodi-auth-sheet__notice loodi-auth-sheet__notice--danger" role="status">{error}</p>}
    </div>
  </div>
}
