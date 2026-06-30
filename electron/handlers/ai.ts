import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Message = { role: 'user' | 'assistant'; content: string }

async function chatWithClaude(
  apiKey: string,
  messages: Message[],
  system?: string
): Promise<string> {
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: system ?? '',
    messages
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

async function chatWithOllama(
  baseUrl: string,
  model: string,
  messages: Message[],
  system?: string
): Promise<string> {
  const payload = {
    model,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
    stream: false
  }
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = (await res.json()) as { message?: { content: string } }
  return data.message?.content ?? ''
}

async function chatWithGemini(
  apiKey: string,
  messages: Message[],
  system?: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: system ?? '' })
  const chat = model.startChat({ history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }) as unknown as any) })
  const result = await chat.sendMessage(messages[messages.length - 1]?.content ?? '')
  return result.response.text()
}

export function registerAiHandlers(): void {
  ipcMain.handle(
    'ai:chat',
    async (
      _event,
      provider: string,
      messages: Message[],
      system?: string,
      options?: { apiKey?: string; ollamaUrl?: string; ollamaModel?: string; geminiApiKey?: string }
    ) => {
      if (provider === 'claude') {
        const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? ''
        return chatWithClaude(apiKey, messages, system)
      } else if (provider === 'gemini') {
        const apiKey = options?.geminiApiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ''
        return chatWithGemini(apiKey, messages, system)
      } else {
        const baseUrl = options?.ollamaUrl ?? 'http://localhost:11434'
        const model = options?.ollamaModel ?? 'llama3.2'
        return chatWithOllama(baseUrl, model, messages, system)
      }
    }
  )

  ipcMain.handle('ai:isAvailable', async (_event, provider: string, options?: { ollamaUrl?: string }) => {
    if (provider === 'ollama') {
      try {
        const url = options?.ollamaUrl ?? 'http://localhost:11434'
        const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        return res.ok
      } catch {
        return false
      }
    }
    return true
  })
}
