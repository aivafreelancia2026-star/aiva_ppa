import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, Animated
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://your-aiva-app.vercel.app'

const THEME = {
  bg: '#0f0f1a', surface: '#1a1a2e', purple: '#7c3aed',
  text: '#f8fafc', muted: '#94a3b8', border: 'rgba(139,92,246,0.15)',
  card: 'rgba(139,92,246,0.08)',
}

interface Message { id: string; role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  "Show today's tasks",
  "Add milk to shopping list",
  "Remind me at 8 PM",
  "Increase water count by 1",
]

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const { session } = useAuthStore()

  const sendMessage = useCallback(async (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
    const assistantId = (Date.now() + 1).toString()

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: content, messages: messages.slice(-10), model: 'gpt-4o-mini', userId: session?.user?.id }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6))
                if (parsed.content) {
                  fullContent += parsed.content
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m))
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Sorry, an error occurred.' } : m))
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading, session])

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.aiRow]}>
      {item.role === 'assistant' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        {item.content ? (
          <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>
            {item.content}
          </Text>
        ) : (
          <ActivityIndicator size="small" color="#a78bfa" />
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>AIVA AI</Text>
          <Text style={styles.headerSub}>Your productivity assistant</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={32} color="#fff" />
            </View>
            <Text style={styles.emptyTitle}>How can I help?</Text>
            <Text style={styles.emptySub}>Try one of these:</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask AIVA anything..."
            placeholderTextColor={THEME.muted}
            style={styles.input}
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: THEME.border },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: THEME.text, fontSize: 15, fontWeight: '700' },
  headerSub: { color: THEME.muted, fontSize: 11, marginTop: 1 },
  messageList: { padding: 16, gap: 12, flexGrow: 1 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 4 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 8, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, minHeight: 40, justifyContent: 'center' },
  userBubble: { backgroundColor: THEME.purple, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: THEME.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: THEME.border },
  bubbleText: { color: THEME.muted, fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: THEME.border },
  input: { flex: 1, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: THEME.text, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: THEME.purple, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: THEME.text, fontSize: 18, fontWeight: '700' },
  emptySub: { color: THEME.muted, fontSize: 13 },
  suggestions: { width: '100%', gap: 8, paddingHorizontal: 16 },
  suggestion: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: 12, padding: 12 },
  suggestionText: { color: THEME.muted, fontSize: 13 },
})
