import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(root, 'src/tokens.source.json')
const source = JSON.parse(await readFile(sourcePath, 'utf8'))

const expectedCounts = {
  color: 78,
  theme: 30,
  spacing: 5,
  radius: 4,
  font: 3,
  typography: 5,
  shadow: 4,
}

for (const [group, count] of Object.entries(expectedCounts)) {
  if (Object.keys(source[group]).length !== count) {
    throw new Error(`Expected ${count} ${group} tokens`)
  }
}

const cssFontFamily = (font) => font.map((name) => name.includes(' ') ? `"${name}"` : name).join(', ')
const cssShadow = (shadow) => `${shadow.offsetX} ${shadow.offsetY} ${shadow.blur} ${shadow.spread} ${shadow.color}`
const cssColor = (color) => {
  const alias = color.match(/^\{([^}]+)\}$/)
  return alias ? `var(--${alias[1].replaceAll('.', '-')})` : color
}
const cssTypography = (typography) => (
  `${typography.fontWeight} ${typography.fontSize}/${typography.lineHeight} var(--font-${typography.fontFamily})`
)

const cssGroups = [
  ['color', cssColor],
  ['spacing', (value) => value],
  ['radius', (value) => value],
  ['font', cssFontFamily],
  ['typography', cssTypography],
  ['shadow', cssShadow],
]

const css = [
  '/* Generated from tokens.source.json. Do not edit manually. */',
  ':root {',
  ...cssGroups.flatMap(([group, formatter]) => Object.entries(source[group])
    .map(([name, value]) => `  --${group}-${name}: ${formatter(value)};`)),
  ...Object.entries(source.typography)
    .filter(([, value]) => value.letterSpacing)
    .map(([name, value]) => `  --typography-${name}-letter-spacing: ${value.letterSpacing};`),
  ...Object.entries(source.typography)
    .filter(([, value]) => value.textTransform)
    .map(([name, value]) => `  --typography-${name}-text-transform: ${value.textTransform};`),
  ...Object.entries(source.theme)
    .map(([name, variants]) => `  --color-theme-${name}: ${cssColor(variants.light)};`),
  '}',
  '.dark {',
  ...Object.entries(source.theme)
    .map(([name, variants]) => `  --color-theme-${name}: ${cssColor(variants.dark)};`),
  '}',
  '',
].join('\n')

const dtcg = {
  '$description': 'Loodi · Core design tokens. Generated from tokens.source.json.',
  color: Object.fromEntries(Object.entries(source.color).map(([name, value]) => [name, {
    '$type': 'color',
    '$value': value,
  }])),
  theme: Object.fromEntries(Object.entries(source.theme).map(([name, variants]) => [name, {
    light: {
      '$type': 'color',
      '$value': variants.light,
    },
    dark: {
      '$type': 'color',
      '$value': variants.dark,
    },
  }])),
  spacing: Object.fromEntries(Object.entries(source.spacing).map(([name, value]) => [name, {
    '$type': 'dimension',
    '$value': value,
  }])),
  radius: Object.fromEntries(Object.entries(source.radius).map(([name, value]) => [name, {
    '$type': 'dimension',
    '$value': value,
  }])),
  font: Object.fromEntries(Object.entries(source.font).map(([name, value]) => [name, {
    '$type': 'fontFamily',
    '$value': value,
  }])),
  typography: Object.fromEntries(Object.entries(source.typography).map(([name, value]) => [name, {
    '$type': 'typography',
    '$value': {
      ...value,
      fontFamily: `{font.${value.fontFamily}}`,
    },
  }])),
  shadow: Object.fromEntries(Object.entries(source.shadow).map(([name, value]) => [name, {
    '$type': 'shadow',
    '$value': value,
  }])),
}

await Promise.all([
  writeFile(resolve(root, 'src/tokens.css'), css),
  writeFile(resolve(root, 'src/tokens.dtcg.json'), `${JSON.stringify(dtcg, null, 2)}\n`),
])
