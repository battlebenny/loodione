import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoodiPwa } from './index.js'

describe('LoodiPwa', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true })
  })

  it('renders no PWA runtime when embedded in One', () => {
    render(<LoodiPwa appName="Friends" standalone={false} />)
    expect(screen.queryByText('Installer Friends')).not.toBeInTheDocument()
    expect(screen.queryByText('Tu es hors ligne')).not.toBeInTheDocument()
  })

  it('captures and displays the install prompt with the application name', () => {
    render(<LoodiPwa appName="Friends" />)
    const prompt = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: ReturnType<typeof vi.fn>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
    prompt.prompt = vi.fn().mockResolvedValue(undefined)
    prompt.userChoice = Promise.resolve({ outcome: 'accepted' })

    fireEvent(window, prompt)

    expect(screen.getByText('Installer Friends')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Installer' })).toBeInTheDocument()
  })

  it('shows the offline banner when connectivity changes', () => {
    render(<LoodiPwa appName="Collec" />)
    expect(screen.queryByText('Tu es hors ligne')).not.toBeInTheDocument()

    fireEvent(window, new Event('offline'))

    expect(screen.getByRole('status')).toHaveTextContent('Tu es hors ligne')
  })
})
