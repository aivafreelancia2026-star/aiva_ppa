import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', purple: '#7c3aed', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.2)' }

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { signIn, signUp } = useAuthStore()

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return }
    setLoading(true)
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(email, password, name)
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Ionicons name="sparkles" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>AIVA AI</Text>
            <Text style={styles.appTagline}>Agentic Productivity Assistant</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>

            {mode === 'signup' && (
              <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={THEME.muted} style={styles.input} autoCapitalize="words" />
            )}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={THEME.muted} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
            <View style={styles.passRow}>
              <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={THEME.muted} style={[styles.input, { flex: 1, marginBottom: 0 }]} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={THEME.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.authBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.toggleText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>AIVA Freelancia · aivafreelancia.com</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  logoSection: { alignItems: 'center', gap: 8 },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 4, shadowColor: THEME.purple, shadowRadius: 20, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 4 } },
  appName: { color: THEME.text, fontSize: 26, fontWeight: '800' },
  appTagline: { color: THEME.muted, fontSize: 13 },
  card: { backgroundColor: THEME.surface, borderRadius: 20, padding: 24, gap: 14, borderWidth: 1, borderColor: THEME.border },
  title: { color: THEME.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  input: { backgroundColor: 'rgba(15,15,26,0.8)', borderWidth: 1, borderColor: THEME.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: THEME.text, fontSize: 14 },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12, backgroundColor: 'rgba(15,15,26,0.8)', borderWidth: 1, borderColor: THEME.border, borderRadius: 12 },
  authBtn: { backgroundColor: THEME.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: THEME.purple, shadowRadius: 12, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 } },
  authBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  toggleText: { color: THEME.muted, textAlign: 'center', fontSize: 13 },
  footer: { color: 'rgba(148,163,184,0.4)', textAlign: 'center', fontSize: 11 },
})
