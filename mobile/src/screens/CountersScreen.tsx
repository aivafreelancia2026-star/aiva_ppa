import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, supabase } from '../store/authStore'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)' }

interface Counter { id: string; name: string; icon: string; value: number; target?: number; unit?: string; color: string }

export default function CountersScreen() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuthStore()

  async function load() {
    if (!user) return
    const { data } = await supabase.from('counters').select('*').eq('user_id', user.id).order('created_at')
    setCounters(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function increment(counter: Counter) {
    const newVal = counter.value + 1
    await supabase.from('counters').update({ value: newVal }).eq('id', counter.id)
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, value: newVal } : c))
  }

  async function reset(counter: Counter) {
    await supabase.from('counters').update({ value: 0 }).eq('id', counter.id)
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, value: 0 } : c))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Counters</Text>
        <Text style={styles.count}>{counters.length} trackers</Text>
      </View>
      <FlatList
        data={counters}
        keyExtractor={c => c.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#a78bfa" />}
        renderItem={({ item }) => {
          const progress = item.target ? Math.min((item.value / item.target) * 100, 100) : null
          const color = item.color ?? '#8b5cf6'
          return (
            <View style={[styles.card, { flex: 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 22 }}>{item.icon ?? '🔢'}</Text>
                <TouchableOpacity onPress={() => reset(item)}>
                  <Ionicons name="refresh" size={14} color={THEME.muted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={[styles.value, { color }]}>{item.value}</Text>
              {item.unit && <Text style={styles.unit}>{item.unit}</Text>}
              {progress !== null && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
                </View>
              )}
              <TouchableOpacity onPress={() => increment(item)} style={[styles.incBtn, { backgroundColor: `${color}20` }]}>
                <Ionicons name="add" size={20} color={color} />
                <Text style={[styles.incBtnText, { color }]}>+1</Text>
              </TouchableOpacity>
            </View>
          )
        }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Ionicons name="bar-chart-outline" size={48} color={THEME.muted} />
            <Text style={{ color: THEME.muted }}>No counters. Use AI Chat to create one!</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 8, padding: 20, paddingBottom: 12 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  count: { color: THEME.muted, fontSize: 13 },
  card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 16, padding: 14, gap: 8 },
  cardName: { color: THEME.text, fontSize: 13, fontWeight: '600' },
  value: { fontSize: 36, fontWeight: '900' },
  unit: { color: THEME.muted, fontSize: 11, marginTop: -4 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  incBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, paddingVertical: 8 },
  incBtnText: { fontSize: 13, fontWeight: '700' },
})
