/** The shared, varied palette available to every player profile. */
export const PROFILE_COLORS = [
  '#A83D16', '#C24B30', '#C9652E', '#B77A22', '#917A20', '#747D27', '#4F7B38', '#2F7B52',
  '#20756A', '#1F6F7C', '#276A8C', '#3B5F99', '#4B6A68', '#514F98', '#684E92', '#824B87',
  '#9B4775', '#AD3D62', '#9F393F', '#8E3C30', '#754E33', '#705A32', '#66613A', '#586744',
  '#3F6E4D', '#2C6C61', '#265F73', '#36577F', '#F5F5F0', '#1A1A18', '#777770', '#B0AEA6',
] as const

export type ProfileColor = typeof PROFILE_COLORS[number]

export function defaultProfileColor(handle?: string): ProfileColor {
  if (!handle) return PROFILE_COLORS[0]
  let hash = 0
  for (const char of handle) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PROFILE_COLORS[hash % PROFILE_COLORS.length]
}

/** Returns an AA-friendly monogram colour for a profile tint. */
export function profileColorText(color?: string) {
  const channels = color?.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255)
  if (!channels || channels.length !== 3) return '#FFFFFF'

  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)

  return luminance > 0.35 ? '#1A1A18' : '#FFFFFF'
}
