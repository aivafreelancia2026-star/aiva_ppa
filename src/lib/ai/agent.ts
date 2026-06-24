import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIVA_TOOLS, toOpenAITools, toGeminiTools, toAnthropicTools } from './tools'
import type { AIModel, ChatMessage } from '@/types'

const SYSTEM_PROMPT = `You are AIVA — an intelligent agentic productivity assistant created by AIVA Freelancia.

Your capabilities:
- Manage tasks (create, update, delete, complete)
- Manage shopping lists (add, remove, update items)
- Track counters and habits (water intake, exercise, reading)
- Set and manage reminders (one-time and recurring)

Personality:
- Friendly, concise, and efficient
- Proactively ask for missing information
- Confirm actions after execution
- Handle multiple requests in one message
- Use natural language in responses, not JSON

When using tools:
1. Parse the user's intent carefully
2. Extract all relevant information from the message
3. Call the appropriate tool(s)
4. Confirm the action in your response naturally

For dates/times:
- "today" = ${new Date().toISOString().split('T')[0]}
- "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- Convert natural time expressions to ISO 8601

Always be helpful, accurate, and proactive.`

interface AgentStreamOptions {
  model: AIModel
  messages: ChatMessage[]
  userId: string
  onChunk?: (chunk: string) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<unknown>
}

export async function runAgent(options: AgentStreamOptions): Promise<string> {
  const { model, messages, onChunk, onToolCall } = options

  if (model.startsWith('gpt')) {
    return runOpenAIAgent(model, messages, onChunk, onToolCall)
  } else if (model.startsWith('gemini')) {
    return runGeminiAgent(model, messages, onChunk, onToolCall)
  } else if (model.startsWith('claude')) {
    return runAnthropicAgent(model, messages, onChunk, onToolCall)
  }
  throw new Error(`Unsupported model: ${model}`)
}

async function runOpenAIAgent(
  model: string,
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<unknown>
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const tools = toOpenAITools(AIVA_TOOLS)

  const history: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  let fullResponse = ''

  // Agentic loop — keep calling until no more tool calls
  while (true) {
    const response = await client.chat.completions.create({
      model,
      messages: history,
      tools,
      tool_choice: 'auto',
      stream: true,
    })

    let currentContent = ''
    const toolCallsBuffer: Record<number, { id: string; name: string; args: string }> = {}

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta

      if (delta?.content) {
        currentContent += delta.content
        fullResponse += delta.content
        onChunk?.(delta.content)
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0
          if (!toolCallsBuffer[idx]) {
            toolCallsBuffer[idx] = { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' }
          }
          if (tc.id) toolCallsBuffer[idx].id = tc.id
          if (tc.function?.name) toolCallsBuffer[idx].name += tc.function.name
          if (tc.function?.arguments) toolCallsBuffer[idx].args += tc.function.arguments
        }
      }
    }

    const toolCalls = Object.values(toolCallsBuffer)

    if (toolCalls.length === 0) break

    history.push({ role: 'assistant', content: currentContent || null, tool_calls: toolCalls.map(tc => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.name, arguments: tc.args },
    })) })

    for (const tc of toolCalls) {
      let result: unknown = { error: 'Tool execution not configured' }
      if (onToolCall) {
        try {
          const args = JSON.parse(tc.args)
          result = await onToolCall(tc.name, args)
        } catch (e) {
          result = { error: String(e) }
        }
      }
      history.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
    }
  }

  return fullResponse
}

async function runGeminiAgent(
  model: string,
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<unknown>
): Promise<string> {
  const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const geminiModel = client.getGenerativeModel({
    model: model.replace('gemini-', 'gemini-'),
    systemInstruction: SYSTEM_PROMPT,
    tools: toGeminiTools(AIVA_TOOLS) as any,
  })

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }))

  const chat = geminiModel.startChat({ history })
  const lastMessage = messages[messages.length - 1]

  let result = await chat.sendMessage(lastMessage.content)
  let fullResponse = ''

  while (true) {
    const resp = result.response
    const fnCalls = resp.functionCalls()

    if (!fnCalls || fnCalls.length === 0) {
      const text = resp.text()
      fullResponse += text
      onChunk?.(text)
      break
    }

    const functionResponses = []
    for (const fn of fnCalls) {
      let fnResult: unknown = { error: 'Not configured' }
      if (onToolCall) {
        try {
          fnResult = await onToolCall(fn.name, fn.args as Record<string, unknown>)
        } catch (e) {
          fnResult = { error: String(e) }
        }
      }
      functionResponses.push({
        functionResponse: { name: fn.name, response: { result: fnResult } },
      })
    }

    result = await chat.sendMessage(functionResponses)
  }

  return fullResponse
}

async function runAnthropicAgent(
  model: string,
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<unknown>
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const tools = toAnthropicTools(AIVA_TOOLS)

  let history: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))

  let fullResponse = ''

  while (true) {
    const response = await client.messages.create({
      model: model === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: history,
      tools,
      stream: true,
    })

    let currentText = ''
    const toolUses: Anthropic.ToolUseBlock[] = []

    for await (const event of response) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          currentText += event.delta.text
          fullResponse += event.delta.text
          onChunk?.(event.delta.text)
        }
      }
      if (event.type === 'message_delta' && event.delta.stop_reason === 'tool_use') {
        // tool use coming
      }
    }

    const finalMsg = await client.messages.create({
      model: model === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: history,
      tools,
    })

    history.push({ role: 'assistant', content: finalMsg.content })

    const hasToolUse = finalMsg.content.some(b => b.type === 'tool_use')
    if (!hasToolUse) {
      const textBlock = finalMsg.content.find(b => b.type === 'text')
      if (textBlock && textBlock.type === 'text') {
        fullResponse = textBlock.text
        onChunk?.(textBlock.text)
      }
      break
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of finalMsg.content) {
      if (block.type === 'tool_use') {
        let result: unknown = { error: 'Not configured' }
        if (onToolCall) {
          try {
            result = await onToolCall(block.name, block.input as Record<string, unknown>)
          } catch (e) {
            result = { error: String(e) }
          }
        }
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      }
    }
    history.push({ role: 'user', content: toolResults })
  }

  return fullResponse
}
