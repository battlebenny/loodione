import { ChevronRight, QrCode } from 'lucide-react'
import type { PlayerQrCodeSectionProps } from './types.js'

/** Presentation-only entry point to the module-owned player QR code page. */
export function PlayerQrCodeSection({ onOpenQrCode, disabled = false }: PlayerQrCodeSectionProps) {
  return (
    <section className="loodi-player-qr-code" aria-labelledby="loodi-player-qr-code-title">
      <div className="loodi-player-qr-code__card">
        <h2 id="loodi-player-qr-code-title" className="loodi-player-qr-code__title">Mon code joueur</h2>
        <button
          type="button"
          className="loodi-player-qr-code__row"
          aria-label="Voir mon QR code"
          aria-describedby="loodi-player-qr-code-description"
          disabled={disabled}
          onClick={onOpenQrCode}
        >
          <span className="loodi-player-qr-code__icon"><QrCode size={18} aria-hidden="true" /></span>
          <span className="loodi-player-qr-code__copy">
            <strong>Voir mon QR code</strong>
            <small id="loodi-player-qr-code-description">Pour rejoindre vos compagnons.</small>
          </span>
          <ChevronRight className="loodi-player-qr-code__chevron" size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
