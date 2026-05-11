import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, serif, label } from '../theme';

/**
 * SB icon mark.
 * variant: 'dark' (cream on ink) | 'light' (ink on white with border)
 */
export function SBIcon({ size = 60, variant = 'dark' }) {
  const isDark = variant !== 'light';
  const bg     = isDark ? C.ink  : C.white;
  const fg     = isDark ? C.cream : C.ink;
  const radius = size * 0.2;
  const fontSize = size * 0.34;

  return (
    <View style={[
      s.icon,
      {
        width: size, height: size, borderRadius: radius,
        backgroundColor: bg,
        borderWidth: isDark ? 0 : 1,
        borderColor: C.ink,
      },
    ]}>
      <Text style={[s.iconS, { fontSize, color: fg }]}>S</Text>
      <Text style={[s.iconB, { fontSize, color: fg }]}>B</Text>
    </View>
  );
}

/**
 * StyleBlend wordmark.
 * variant: 'dark' (cream text, ink bg) | 'cream' (ink text, cream bg) | 'light' (ink text, no bg)
 * showTagline: render the "ELEVATE YOUR EVERYDAY STYLE" line
 */
export function Wordmark({ variant = 'dark', showTagline = true, style }) {
  const hasBg       = variant !== 'light';
  const bg          = variant === 'dark' ? C.ink : C.cream;
  const textColor   = variant === 'dark' ? C.cream : C.ink;
  const tagColor    = variant === 'dark' ? C.inkFgMuted : C.muted;

  return (
    <View style={[s.wordmarkWrap, hasBg && { backgroundColor: bg }, style]}>
      <Text style={[s.wordmarkText, { color: textColor }]}>
        Style<Text style={s.wordmarkBold}>Blend</Text>
      </Text>
      {showTagline && (
        <Text style={[s.tagline, { color: tagColor }]}>
          ELEVATE YOUR EVERYDAY STYLE
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // SBIcon
  icon:         { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 1 },
  iconS:        { ...serif(20, '300'), letterSpacing: 1 },
  iconB:        { ...serif(20, '600') },

  // Wordmark
  wordmarkWrap: { alignItems: 'center', paddingHorizontal: 8 },
  wordmarkText: { ...serif(28, '300'), letterSpacing: 1 },
  wordmarkBold: { fontWeight: '600' },
  tagline:      { ...label(8), marginTop: 4, letterSpacing: 4 },
});
