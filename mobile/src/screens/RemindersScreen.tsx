import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, supabase } from '../store/authStore'
import { format, parseISO } from 'date-fns'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)' }

interface Reminder { id: string; title: string; remind_at: string; frequency: string; is_active: boolean; description?: string }

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuthStore()

  async function load() {
    if (!user) return
    const { data } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at')
    setReminders(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function toggle(r: Reminder) {
    await supabase.from('reminders').update({ is_active: !r.is_active }).eq('id', r.id)
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, is_active: !x.is_active } : x))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.count}>{reminders.filter(r => r.is_active).length} active</Text>
      </View>
      <FlatList
        data={reminders}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#a78bfa" />}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.inactive]}>
            <View style={[styles.iconBox, { backgroundColor: item.is_active ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.1)' }]}>
              <Ionicons name={item.is_active ? 'notifications' : 'notifications-off'} size={20} color={item.is_active ? '#f59e0b' : THEME.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{item.title}</Text>
              <Text style={styles.reminderTime}>{format(parseISO(item.remind_at), 'MMM d · h:mm a')}</Text>
              {item.frequency !== 'once' && <Text style={styles.freq}>{item.frequency}</Text>}
            </View>
            <TouchableOpacity onPress={() => toggle(item)}>
              <Ionicons name={item.is_active ? 'toggle' : 'toggle-outline'} size={28} color={item.is_active ? '#7c3aed' : THEME.muted} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Ionicons name="notifications-outline" size={48} color={THEME.muted} />
            <Text style={{ color: THEME.muted }}>No reminders. Use AI Chat to set one!</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 8, padding: 20, paddingBottom: 12 },
  title: { color: THEME.text, fontSize: 24, fontWeight: '800' },
  count: { color: THEME.muted, fontSize: 13 },
  card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inactive: { opacity: 0.5 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { color: THEME.text, fontSize: 14, fontWeight: '600' },
  reminderTime: { color: THEME.muted, fontSize: 12, marginTop: 3 },
  freq: { color: '#a78bfa', fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
})
