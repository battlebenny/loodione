import { ChevronRight, Settings } from 'lucide-react'
import type { GlobalSettingsSectionProps } from './types.js'

/**
 * Final section of an embedded module settings page. It hands control back to
 * the shell without exposing any shell-owned settings to the module.
 */
export function GlobalSettingsSection({
  onOpenShellSettings,
  shellName = 'Loodi One',
}: GlobalSettingsSectionProps) {
  return (
    <section className="loodi-global-settings" aria-labelledby="loodi-global-settings-title">
      <div className="loodi-global-settings__card">
        <h2 id="loodi-global-settings-title" className="loodi-global-settings__title">Paramètres globaux</h2>
        <button
          type="button"
          className="loodi-global-settings__row"
          aria-label="Autres paramètres"
          onClick={onOpenShellSettings}
        >
          <span className="loodi-global-settings__icon"><Settings size={18} aria-hidden="true" /></span>
          <span className="loodi-global-settings__copy">
            <strong>Autres paramètres</strong>
            <small>{shellName}</small>
          </span>
          <ChevronRight className="loodi-global-settings__chevron" size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
