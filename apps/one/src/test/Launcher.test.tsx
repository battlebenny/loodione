import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { Launcher } from '@loodi/ui/launcher';

describe('Launcher', () => {
  const apps = [
    {
      id: 'loodi',
      name: 'collec',
      icon: '/icons/loodi.svg',
      color: '#ca4a16',
      url: 'https://loodi.vercel.app',
      badgeCount: 0,
      active: false,
    },
  ];

  it('renders light and dark image variants for path-based module icons', () => {
    const { container } = render(<Launcher apps={apps} open onSelect={vi.fn()} onClose={vi.fn()} />);

    const light = container.querySelector('.loodi-launcher__app-image--light');
    const dark = container.querySelector('.loodi-launcher__app-image--dark');

    expect(light).toHaveAttribute('src', '/icons/loodi.svg');
    expect(dark).toHaveAttribute('src', '/icons/loodi-dark.svg');
  });

  it('renders light and dark image variants for absolute SVG module icons', () => {
    const remoteApps = [{ ...apps[0], icon: 'https://battlebenny.github.io/loodione/icons/loodi.svg' }];
    const { container } = render(<Launcher apps={remoteApps} open onSelect={vi.fn()} onClose={vi.fn()} />);

    expect(container.querySelector('.loodi-launcher__app-image--light')).toHaveAttribute(
      'src',
      'https://battlebenny.github.io/loodione/icons/loodi.svg',
    );
    expect(container.querySelector('.loodi-launcher__app-image--dark')).toHaveAttribute(
      'src',
      'https://battlebenny.github.io/loodione/icons/loodi-dark.svg',
    );
  });

  it('prefers explicit launcher icon variants over the historical suffix convention', () => {
    const explicitApps = [{
      ...apps[0],
      icon: 'https://legacy.example.test/loodi.svg',
      iconLightUrl: 'https://assets.example.test/friends-light.svg',
      iconDarkUrl: 'https://assets.example.test/friends-dark.svg',
    }];
    const { container } = render(<Launcher apps={explicitApps} open onSelect={vi.fn()} onClose={vi.fn()} />);

    expect(container.querySelector('.loodi-launcher__app-image--light')).toHaveAttribute(
      'src',
      'https://assets.example.test/friends-light.svg',
    );
    expect(container.querySelector('.loodi-launcher__app-image--dark')).toHaveAttribute(
      'src',
      'https://assets.example.test/friends-dark.svg',
    );
  });

  it('toggles the image variants via the .dark class', () => {
    const css = readFileSync(resolve(process.cwd(), '../../packages/@loodi/ui/src/launcher.css'), 'utf8');

    expect(css).toMatch(/\.loodi-launcher__app-image--dark\s*\{[^}]*display:\s*none;/s);
    expect(css).toMatch(/:where\(\.dark\)\s+\.loodi-launcher__app-image--light\s*\{[^}]*display:\s*none;/s);
    expect(css).toMatch(/:where\(\.dark\)\s+\.loodi-launcher__app-image--dark\s*\{[^}]*display:\s*block;/s);
  });
});
