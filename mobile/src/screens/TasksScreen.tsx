import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert, RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, supabase } from '../store/authStore'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', purple: '#7c3aed', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)' }
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' }

interface Task { id: string; title: string; status: string; priority: string; due_date?: string; category?: string }

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const { user } = useAuthStore()

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }, [user])

  useEffect(() => { load() }, [])

  async function complete(id: string) {
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function remove(id: string) {
    Alert.alert('Delete task?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('tasks').delete().eq('id', id); setTasks(prev => prev.filter(t => t.id !== id)) } },
    ])
  }

  const filtered = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.count}>{tasks.length} active</Text>
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={THEME.muted} style={{ marginLeft: 12 }} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search tasks..." placeholderTextColor={THEME.muted} style={styles.searchInput} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#a78bfa" />}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity onPress={() => complete(item.id)} style={styles.checkbox}>
              <Ionicons name="ellipse-outline" size={22} color={THEME.purple} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.taskMeta}>
                <View style={[styles.badge, { backgroundColor: `${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] ?? THEME.purple}20` }]}>
                  <Text style={[styles.badgeText, { color: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] ?? THEME.purple }]}>{item.priority}</Text>
                </View>
                {item.due_date && <Text style={styles.dueDate}>{item.due_date}</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#f87171" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={48} color={THEME.muted} />
            <Text style={{ color: THEME.muted }}>No tasks. Use AI Chat to add tasks!</Text>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, padding: 12, color: THEME.text, fontSize: 14 },
  taskCard: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { padding: 2 },
  taskTitle: { color: THEME.text, fontSize: 14, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  dueDate: { color: THEME.muted, fontSize: 11 },
  deleteBtn: { padding: 6 },
})
