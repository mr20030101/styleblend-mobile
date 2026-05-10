import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C, R, S, serif, label, eyebrow } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Sign In Failed', err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.cream} />

      {/* Top decoration */}
      <View style={s.topBar} />

      <View style={s.inner}>
        {/* Mark */}
        <View style={s.markWrap}>
          <View style={s.mark}>
            <Text style={s.markS}>S</Text>
            <Text style={s.markB}>B</Text>
          </View>
          <View style={s.goldDot} />
        </View>

        {/* Brand */}
        <Text style={s.wordmark}>Style<Text style={s.wordmarkBold}>Blend</Text></Text>
        <Text style={s.tagline}>Elevate Your Everyday Style</Text>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardEyebrow}>Point of Sale</Text>

          <View style={[s.inputWrap, focused === 'email' && s.inputFocused]}>
            <Text style={s.inputLabel}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[s.inputWrap, focused === 'password' && s.inputFocused]}>
            <Text style={s.inputLabel}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.cream} size="small" />
              : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>© StyleBlend · All rights reserved</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.cream },
  topBar:        { height: 3, backgroundColor: C.gold, opacity: 0.6 },
  inner:         { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 24 },

  // Mark
  markWrap:      { alignItems: 'center', marginBottom: 20, position: 'relative' },
  mark:          { width: 60, height: 60, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 1 },
  markS:         { ...serif(22, '300'), color: C.cream, letterSpacing: 1 },
  markB:         { ...serif(22, '600'), color: C.cream },
  goldDot:       { position: 'absolute', bottom: -2, right: '44%', width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },

  // Brand
  wordmark:      { ...serif(28, '300'), color: C.ink, textAlign: 'center', letterSpacing: 1 },
  wordmarkBold:  { fontWeight: '600' },
  tagline:       { ...label(9), textAlign: 'center', marginTop: 6, marginBottom: 32 },

  // Card
  card:          { backgroundColor: C.white, borderRadius: R.xl, padding: 24, ...S.card },
  cardEyebrow:   { ...eyebrow(9), textAlign: 'center', marginBottom: 20 },

  // Inputs
  inputWrap:     { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, marginBottom: 12, backgroundColor: C.surface },
  inputFocused:  { borderColor: C.gold, backgroundColor: C.white },
  inputLabel:    { ...label(9), marginBottom: 3 },
  input:         { fontSize: 15, color: C.ink, fontWeight: '400', padding: 0 },

  // Button
  btn:           { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText:       { ...label(11), color: C.cream, letterSpacing: 2 },

  footer:        { ...label(9), textAlign: 'center', marginTop: 28, letterSpacing: 1 },
});
