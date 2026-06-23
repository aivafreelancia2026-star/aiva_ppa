import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore, supabase } from '../store/authStore'

const THEME = { bg: '#0f0f1a', surface: '#1a1a2e', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)', cyan: '#06b6d4' }

interface Item { id: string; name: string; quantity?: number; unit?: string; is_purchased: boolean; category?: string }

export default function ShoppingScreen() {
  const [items, setItems] = useState<Item[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuthStore()

  async function load() {
    if (!user) return
    const { data } = await supabase.from('shopping_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function toggle(item: Item) {
    await supabase.from('shopping_items').update({ is_purchased: !item.is_purchased }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i))
  }

  const pending = items.filter(i => !i.is_purchased)
  const purchased = items.filter(i => i.is_purchased)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping</Text>
        <Text style={styles.count}>{pending.length} to buy</Text>
      </View>
      <FlatList
        data={[...pending, ...purchased]}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#a78bfa" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggle(item)} style={[styles.itemCard, item.is_purchased && styles.purchased]}>
            <View style={[styles.check, item.is_purchased && styles.checkDone]}>
              {item.is_purchased && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, item.is_purchased && styles.strikethrough]}>{item.name}</Text>
              {(item.quantity || item.unit) && <Text style={styles.qty}>{item.quantity} {item.unit}</Text>}
            </View>
            {item.category && <Text style={styles.category}>{item.category}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Ionicons name="cart-outline" size={48} color={THEME.muted} />
            <Text style={{ color: THEME.muted }}>Empty list. Use AI Chat to add items!</Text>
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
  itemCard: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  purchased: { opacity: 0.5 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: THEME.cyan, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  itemName: { color: THEME.text, fontSize: 14, fontWeight: '600' },
  strikethrough: { textDecorationLine: 'line-through', color: THEME.muted },
  qty: { color: THEME.muted, fontSize: 12, marginTop: 2 },
  category: { color: THEME.muted, fontSize: 11, borderWidth: 1, borderColor: THEME.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
})
