import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, supabase } from '../store/authStore'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', purple: '#7c3aed', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)' }

const STAT_CONFIG = [
  { key: 'tasks', label: 'Tasks', icon: 'checkmark-circle' as const, color: '#8b5cf6', table: 'tasks', field: 'status', value: 'pending' },
  { key: 'shopping', label: 'Shopping', icon: 'cart' as const, color: '#06b6d4', table: 'shopping_items', field: 'is_purchased', value: false },
  { key: 'counters', label: 'Counters', icon: 'bar-chart' as const, color: '#10b981', table: 'counters', field: null, value: null },
  { key: 'reminders', label: 'Reminders', icon: 'notifications' as const, color: '#f59e0b', table: 'reminders', field: 'is_active', value: true },
]

export default function DashboardScreen() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  async function loadStats() {
    if (!user) return
    const results: Record<string, number> = {}
    for (const s of STAT_CONFIG) {
      let q = supabase.from(s.table).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if (s.field && s.value !== null) q = q.eq(s.field, s.value)
      const { count } = await q
      results[s.key] = count ?? 0
    }
    setStats(results)
  }

  useEffect(() => { loadStats() }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadStats(); setRefreshing(false) }} tintColor="#a78bfa" />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}! 👋</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{name[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STAT_CONFIG.map(s => (
            <View key={s.key} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}20` }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{stats[s.key] ?? 0}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Chat CTA */}
        <View style={styles.chatCta}>
          <View style={styles.chatCtaIcon}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatCtaTitle}>Talk to AIVA</Text>
            <Text style={styles.chatCtaSub}>"Add milk to shopping and remind me at 6 PM"</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16 },
  greeting: { color: THEME.muted, fontSize: 13 },
  name: { color: THEME.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 16, padding: 16, width: '47%', gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: THEME.text, fontSize: 28, fontWeight: '800' },
  statLabel: { color: THEME.muted, fontSize: 12, fontWeight: '500' },
  chatCta: { margin: 16, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatCtaIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  chatCtaTitle: { color: THEME.text, fontSize: 14, fontWeight: '600' },
  chatCtaSub: { color: THEME.muted, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
})
