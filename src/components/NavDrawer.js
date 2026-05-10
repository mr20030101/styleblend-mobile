import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { C, R, serif } from '../theme';
import Icon, {
  faCartShopping, faClockRotateLeft,
  faRightFromBracket, faXmark,
} from '../components/Icon';

const DRAWER_WIDTH = 280;
const SCREEN_WIDTH = Dimensions.get('window').width;

const NAV_ITEMS = [
  { label: 'POS',          icon: faCartShopping,    screen: 'POS' },
  { label: 'Transactions', icon: faClockRotateLeft, screen: 'Transactions' },
];

export default function NavDrawer({ visible, onClose }) {
  const { user, settings, logout } = useAuth();
  const navigation = useNavigation();
  const storeName = settings?.store_name ?? 'StyleBlend';

  // Starts off-screen to the left
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNav = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    onClose();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  // Keep modal mounted so animation plays on close
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={s.root}>

        {/* Backdrop */}
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Drawer — slides in from left */}
        <Animated.View style={[s.drawerWrap, { transform: [{ translateX }] }]}>
          <SafeAreaView style={s.drawer} edges={['top', 'bottom']}>

            {/* ── Profile ── */}
            <View style={s.profile}>
              <View style={s.avatar}>
                <Text style={s.avatarS}>S</Text>
                <Text style={s.avatarB}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.storeName}>{storeName}</Text>
                <Text style={s.userName}>{user?.name}</Text>
                <View style={s.roleBadge}>
                  <Text style={s.roleBadgeText}>{user?.role}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Icon icon={faXmark} size={15} color={C.inkFgMuted} />
              </TouchableOpacity>
            </View>

            {/* ── Nav ── */}
            <View style={s.nav}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.screen}
                  style={s.navItem}
                  onPress={() => handleNav(item.screen)}
                  activeOpacity={0.75}
                >
                  <View style={s.navIconWrap}>
                    <Icon icon={item.icon} size={16} color={C.inkFgMuted} />
                  </View>
                  <Text style={s.navLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Sign Out ── */}
            <View style={s.footer}>
              <View style={s.footerDivider} />
              <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Icon icon={faRightFromBracket} size={15} color={C.danger} />
                <Text style={s.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </Animated.View>

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, flexDirection: 'row' },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,26,24,0.5)' },

  drawerWrap:    { width: DRAWER_WIDTH, height: '100%' },
  drawer:        { flex: 1, backgroundColor: C.ink, flexDirection: 'column' },

  // Profile
  profile:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 24, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(245,242,238,0.1)' },
  avatar:        { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245,242,238,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  avatarS:       { ...serif(18, '300'), color: C.cream },
  avatarB:       { ...serif(18, '600'), color: C.cream },
  storeName:     { ...serif(16, '300'), color: C.cream, letterSpacing: 0.5, marginBottom: 2 },
  userName:      { fontSize: 12, color: C.inkFgMuted, marginBottom: 6 },
  roleBadge:     { alignSelf: 'flex-start', backgroundColor: 'rgba(200,169,122,0.2)', borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText: { fontSize: 9, color: C.warm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,242,238,0.08)', alignItems: 'center', justifyContent: 'center' },

  // Nav
  nav:           { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  navItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 14, borderRadius: R.sm },
  navIconWrap:   { width: 20, alignItems: 'center' },
  navLabel:      { fontSize: 15, color: C.cream, fontWeight: '400', letterSpacing: 0.2 },

  // Footer
  footer:        { paddingHorizontal: 12, paddingBottom: 8 },
  footerDivider: { height: 0.5, backgroundColor: 'rgba(245,242,238,0.1)', marginBottom: 8 },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 14, borderRadius: R.sm },
  signOutText:   { fontSize: 15, color: C.danger, fontWeight: '500' },
});
