import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const workbox = vi.hoisted(() => {
  const register = vi.fn().mockResolvedValue(undefined)
  const addEventListener = vi.fn()
  const messageSW = vi.fn().mockResolvedValue(undefined)
  const Workbox = vi.fn(function MockWorkbox() {
    return { addEventListener, messageSW, register }
  })
  return { Workbox, addEventListener, messageSW, register }
})

vi.mock('workbox-window', () => ({ Workbox: workbox.Workbox }))

import { LoodiPwa } from './index.js'

describe('LoodiPwa', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    vi.restoreAllMocks()
    workbox.Workbox.mockClear()
    workbox.addEventListener.mockClear()
    workbox.messageSW.mockClear()
    workbox.register.mockClear()
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true })
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: {} })
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

  it('does not register a service worker in development without opt-in', async () => {
    render(<LoodiPwa appName="Collec" />)

    await Promise.resolve()

    expect(workbox.Workbox).not.toHaveBeenCalled()
  })

  it('registers the Vite PWA development worker without exposing its path to the application', async () => {
    render(<LoodiPwa appName="Collec" development />)

    await waitFor(() => expect(workbox.Workbox).toHaveBeenCalled())

    expect(workbox.Workbox).toHaveBeenCalledWith('/dev-sw.js?dev-sw')
    expect(workbox.register).toHaveBeenCalledOnce()
  })
})
