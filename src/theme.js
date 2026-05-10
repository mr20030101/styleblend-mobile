// StyleBlend — Design System
// Brand: Ink #1a1a18 · Cream #f5f2ee · Warm Gold #c8a97a · Accent #b8956a · Muted #8a8680

export const C = {
  // Core brand
  ink:        '#1a1a18',
  cream:      '#f5f2ee',
  warm:       '#c8a97a',
  gold:       '#b8956a',
  muted:      '#8a8680',
  line:       'rgba(26,26,24,0.10)',
  lineStrong: 'rgba(26,26,24,0.18)',

  // Surfaces
  white:      '#ffffff',
  surface:    '#faf9f7',   // slightly warm white for cards
  surfaceAlt: '#f0ede8',   // pressed / input bg

  // Ink variants (on dark bg)
  inkFg:      '#f5f2ee',
  inkFgMuted: 'rgba(245,242,238,0.45)',
  inkFgSub:   'rgba(245,242,238,0.25)',

  // Status
  success:    '#2d7a4f',
  successBg:  '#edf7f1',
  danger:     '#c0392b',
  dangerBg:   '#fdf0ee',
  warning:    '#b07d2a',
  warningBg:  '#fdf6e8',
};

export const R = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   22,
  xxl:  28,
  pill: 999,
};

export const S = {
  card: {
    shadowColor: '#1a1a18',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  subtle: {
    shadowColor: '#1a1a18',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
};

// Typography helpers — Georgia is the closest system serif to Cormorant Garamond
export const serif   = (size, weight = '300') => ({ fontFamily: 'Georgia', fontSize: size, fontWeight: weight });
export const sans    = (size, weight = '400') => ({ fontSize: size, fontWeight: weight });
export const label   = (size = 10)            => ({ fontSize: size, fontWeight: '500', letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted });
export const eyebrow = (size = 9)             => ({ fontSize: size, fontWeight: '400', letterSpacing: 2.2, textTransform: 'uppercase', color: C.gold });
