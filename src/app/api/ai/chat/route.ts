import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/ai/agent'
import type { AIModel, ChatMessage } from '@/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, messages, model, conversationId } = await req.json() as {
    message: string
    messages: ChatMessage[]
    model: AIModel
    conversationId?: string
  }

  // Create or get conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: message.slice(0, 60), model })
      .select()
      .single()
    convId = conv?.id
  }

  // Save user message
  if (convId) {
    await supabase.from('messages').insert({
      conversation_id: convId,
      user_id: user.id,
      role: 'user',
      content: message,
    })
  }

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      if (convId) send({ conversationId: convId })

      try {
        const allMessages: ChatMessage[] = [
          ...messages,
          { id: 'current', role: 'user', content: message, created_at: new Date().toISOString() },
        ]

        await runAgent({
          model,
          messages: allMessages,
          userId: user.id,
          onChunk(chunk) {
            fullResponse += chunk
            send({ content: chunk })
          },
          async onToolCall(name, args) {
            return await executeTool(supabase, user.id, name, args)
          },
        })

        // Save assistant message
        if (convId && fullResponse) {
          await supabase.from('messages').insert({
            conversation_id: convId,
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
            model,
          })
        }

        send({ done: true })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        console.error('AI error:', err)
        const errMsg = 'Sorry, I encountered an error. Please try again.'
        send({ content: errMsg })
        send({ done: true, error: true })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function executeTool(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, name: string, args: Record<string, unknown>) {
  const today = new Date().toISOString().split('T')[0]

  switch (name) {
    // ── TASKS ──────────────────────────────────────────────
    case 'createTask': {
      const { data, error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: args.title,
        description: args.description,
        due_date: args.due_date,
        due_time: args.due_time,
        priority: args.priority ?? 'medium',
        status: 'pending',
        category: args.category,
        reminder_at: args.reminder_at,
      }).select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, task: data }
    }

    case 'updateTask': {
      let query = supabase.from('tasks').update({
        ...(args.title && { title: args.title }),
        ...(args.description !== undefined && { description: args.description }),
        ...(args.due_date && { due_date: args.due_date }),
        ...(args.due_time && { due_time: args.due_time }),
        ...(args.priority && { priority: args.priority }),
        ...(args.status && { status: args.status }),
        ...(args.category !== undefined && { category: args.category }),
      }).eq('user_id', userId)

      if (args.id) query = query.eq('id', args.id)
      else if (args.title_search) query = query.ilike('title', `%${args.title_search}%`)

      const { data, error } = await query.select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, task: data }
    }

    case 'completeTask': {
      let query = supabase.from('tasks').update({ status: 'completed' }).eq('user_id', userId)
      if (args.id) query = query.eq('id', args.id)
      else if (args.title_search) query = query.ilike('title', `%${args.title_search}%`)
      const { data, error } = await query.select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, task: data }
    }

    case 'deleteTask': {
      let query = supabase.from('tasks').delete().eq('user_id', userId)
      if (args.id) query = query.eq('id', args.id)
      else if (args.title_search) {
        const { data: found } = await supabase.from('tasks').select('id').eq('user_id', userId).ilike('title', `%${args.title_search}%`).single()
        if (!found) return { success: false, error: 'Task not found' }
        await supabase.from('tasks').delete().eq('id', found.id)
        return { success: true, deleted: found.id }
      }
      await query
      return { success: true }
    }

    case 'getTasks': {
      let query = supabase.from('tasks').select('*').eq('user_id', userId)
      if (args.status && args.status !== 'all') query = query.eq('status', args.status)
      if (args.priority) query = query.eq('priority', args.priority)
      if (args.category) query = query.ilike('category', `%${args.category}%`)
      if (args.search) query = query.or(`title.ilike.%${args.search}%,description.ilike.%${args.search}%`)
      if (args.due_date === 'today') query = query.eq('due_date', today)
      else if (args.due_date === 'tomorrow') {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
        query = query.eq('due_date', tomorrow)
      } else if (args.due_date) query = query.eq('due_date', args.due_date)
      if (args.limit) query = query.limit(Number(args.limit))
      query = query.order('due_date', { nullsFirst: false }).order('priority')
      const { data, error } = await query
      if (error) return { success: false, error: error.message }
      return { success: true, tasks: data, count: data?.length }
    }

    // ── SHOPPING ───────────────────────────────────────────
    case 'addShoppingItem': {
      const { data, error } = await supabase.from('shopping_items').insert({
        user_id: userId,
        name: args.name,
        quantity: args.quantity ? Number(args.quantity) : null,
        unit: args.unit,
        category: args.category,
        notes: args.notes,
        is_purchased: false,
      }).select().single()
      if (error) return { success: false, error: error.message }
      return { success: true, item: data }
    }

    case 'updateShoppingItem': {
      let query = supabase.from('shopping_items').update({
        ...(args.name && { name: args.name }),
        ...(args.quantity !== undefined && { quantity: Number(args.quantity) }),
        ...(args.unit !== undefined && { unit: args.unit }),
        ...(args.category !== undefined && { category: args.category }),
        ...(args.is_purchased !== undefined && { is_purchased: args.is_purchased === 'true' }),
      }).eq('user_id', userId)
      if (args.id) query = query.eq('id', args.id)
      else if (args.name_search) query = query.ilike('name', `%${args.name_search}%`)
      const { data, error } = await query.select().single()
      return error ? { success: false, error: error.message } : { success: true, item: data }
    }

    case 'removeShoppingItem': {
      if (args.name_search) {
        const { data: found } = await supabase.from('shopping_items').select('id').eq('user_id', userId).ilike('name', `%${args.name_search}%`).single()
        if (!found) return { success: false, error: 'Item not found' }
        await supabase.from('shopping_items').delete().eq('id', found.id)
        return { success: true }
      }
      if (args.id) await supabase.from('shopping_items').delete().eq('id', args.id)
      return { success: true }
    }

    case 'getShoppingList': {
      let query = supabase.from('shopping_items').select('*').eq('user_id', userId)
      if (args.filter === 'pending') query = query.eq('is_purchased', false)
      if (args.filter === 'purchased') query = query.eq('is_purchased', true)
      if (args.category) query = query.ilike('category', `%${args.category}%`)
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      return error ? { success: false, error: error.message } : { success: true, items: data, count: data?.length }
    }

    // ── COUNTERS ───────────────────────────────────────────
    case 'createCounter': {
      const { data, error } = await supabase.from('counters').insert({
        user_id: userId, name: args.name, description: args.description,
        value: 0, target: args.target ? Number(args.target) : null,
        unit: args.unit, icon: args.icon ?? '🔢',
        reset_daily: args.reset_daily === 'true',
      }).select().single()
      return error ? { success: false, error: error.message } : { success: true, counter: data }
    }

    case 'incrementCounter': {
      const amount = Number(args.amount ?? 1)
      let findQ = supabase.from('counters').select('*').eq('user_id', userId)
      if (args.id) findQ = findQ.eq('id', args.id)
      else if (args.name_search) findQ = findQ.ilike('name', `%${args.name_search}%`)
      const { data: found } = await findQ.single()
      if (!found) return { success: false, error: 'Counter not found' }
      const newVal = found.value + amount
      await supabase.from('counters').update({ value: newVal }).eq('id', found.id)
      await supabase.from('counter_logs').insert({ counter_id: found.id, user_id: userId, delta: amount, value_after: newVal, note: args.note })
      return { success: true, counter: { ...found, value: newVal }, message: `${found.name} is now ${newVal}${found.unit ? ' ' + found.unit : ''}` }
    }

    case 'resetCounter': {
      let findQ = supabase.from('counters').select('*').eq('user_id', userId)
      if (args.id) findQ = findQ.eq('id', args.id)
      else if (args.name_search) findQ = findQ.ilike('name', `%${args.name_search}%`)
      const { data: found } = await findQ.single()
      if (!found) return { success: false, error: 'Counter not found' }
      await supabase.from('counters').update({ value: 0, last_reset: today }).eq('id', found.id)
      return { success: true, message: `${found.name} reset to 0` }
    }

    case 'getCounters': {
      let query = supabase.from('counters').select('*').eq('user_id', userId)
      if (args.name_search) query = query.ilike('name', `%${args.name_search}%`)
      const { data, error } = await query.order('created_at')
      return error ? { success: false, error: error.message } : { success: true, counters: data }
    }

    // ── REMINDERS ──────────────────────────────────────────
    case 'createReminder': {
      const { data, error } = await supabase.from('reminders').insert({
        user_id: userId, title: args.title, description: args.description,
        remind_at: args.remind_at, frequency: args.frequency ?? 'once',
        frequency_config: args.frequency_config ? JSON.parse(String(args.frequency_config)) : null,
        is_active: true,
      }).select().single()
      return error ? { success: false, error: error.message } : { success: true, reminder: data }
    }

    case 'updateReminder': {
      let query = supabase.from('reminders').update({
        ...(args.title && { title: args.title }),
        ...(args.remind_at && { remind_at: args.remind_at }),
        ...(args.frequency && { frequency: args.frequency }),
        ...(args.is_active !== undefined && { is_active: args.is_active === 'true' }),
      }).eq('user_id', userId)
      if (args.id) query = query.eq('id', args.id)
      else if (args.title_search) query = query.ilike('title', `%${args.title_search}%`)
      const { data, error } = await query.select().single()
      return error ? { success: false, error: error.message } : { success: true, reminder: data }
    }

    case 'deleteReminder': {
      if (args.title_search) {
        const { data: found } = await supabase.from('reminders').select('id').eq('user_id', userId).ilike('title', `%${args.title_search}%`).single()
        if (!found) return { success: false, error: 'Reminder not found' }
        await supabase.from('reminders').delete().eq('id', found.id)
        return { success: true }
      }
      if (args.id) await supabase.from('reminders').delete().eq('id', args.id)
      return { success: true }
    }

    case 'getReminders': {
      let query = supabase.from('reminders').select('*').eq('user_id', userId)
      if (args.filter === 'active') query = query.eq('is_active', true)
      if (args.filter === 'upcoming') query = query.gte('remind_at', new Date().toISOString())
      if (args.filter === 'today') {
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59)
        query = query.gte('remind_at', new Date().toISOString()).lte('remind_at', endOfDay.toISOString())
      }
      query = query.order('remind_at')
      const { data, error } = await query
      return error ? { success: false, error: error.message } : { success: true, reminders: data, count: data?.length }
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` }
  }
}
