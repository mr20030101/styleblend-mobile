import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, R, serif, label } from '../theme';
import Icon, { faBars } from '../components/Icon';
import NavDrawer from '../components/NavDrawer';

/**
 * Shared top header used across main screens.
 *
 * Props:
 *   right  — optional JSX to render on the right side (cart button, etc.)
 */
export default function AppHeader({ right }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => setDrawerOpen(true)} activeOpacity={0.8}>
          <Icon icon={faBars} size={18} color={C.cream} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={s.wordmark}>Style<Text style={s.wordmarkBold}>Blend</Text></Text>
          <Text style={s.sub}>Point of Sale</Text>
        </View>

        <View style={s.rightSlot}>
          {right ?? <View style={{ width: 40 }} />}
        </View>
      </View>

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, backgroundColor: C.ink },
  iconBtn:      { width: 40, height: 40, borderRadius: R.sm, backgroundColor: 'rgba(245,242,238,0.08)', alignItems: 'center', justifyContent: 'center' },
  wordmark:     { ...serif(20, '300'), color: C.cream, letterSpacing: 0.8 },
  wordmarkBold: { fontWeight: '600' },
  sub:          { ...label(8), color: 'rgba(245,242,238,0.45)', marginTop: 3 },
  rightSlot:    { width: 40, alignItems: 'flex-end' },
});
