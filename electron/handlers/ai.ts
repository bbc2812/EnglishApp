import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Message = { role: 'user' | 'assistant'; content: string }

export async function chatWithClaude(
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

export async function chatWithOllama(
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

export async function chatWithGemini(
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

async function adaptArticleToLevel(_articleText: string, level: string, apiKey: string, provider: string, system: string): Promise<string> {
  const client = provider === 'claude' ? new Anthropic({ apiKey }) : null
  if (provider === 'claude' && client) {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: system,
      messages: [{ role: 'user', content: `Rewrite this article for ${level} level English learners. Use simpler vocabulary and shorter sentences while keeping the main ideas. Return ONLY the rewritten article text.` }]
    })
    return res.content[0]?.type === 'text' ? res.content[0].text : ''
  }
  return ''
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

  // --- AI: Adapt article to CEFR level ---
  ipcMain.handle(
    'ai:adaptArticle',
    async (_event, articleText: string, level: string, options?: { apiKey?: string; ollamaUrl?: string; ollamaModel?: string; geminiApiKey?: string; provider?: string }) => {
      const provider = options?.provider ?? 'claude'
      const apiKey = options?.apiKey ?? ''
      if (!apiKey) return articleText
      return adaptArticleToLevel(articleText, level, apiKey, provider,
        `You are an expert English language curriculum designer. Rewrite the provided text for ${level} level English learners. Use simpler vocabulary, shorter sentences, and more common structures while preserving the core meaning. Return ONLY the rewritten text with no additional commentary.`
      )
    }
  )

  // --- AI: Summarize content ---
  ipcMain.handle(
    'ai:summarizeContent',
    async (_event, content: string, options?: { apiKey?: string; ollamaUrl?: string; ollamaModel?: string; geminiApiKey?: string; provider?: string }) => {
      const provider = options?.provider ?? 'claude'
      const apiKey = options?.apiKey ?? ''
      if (!apiKey) return 'API key required'
      return adaptArticleToLevel(content, 'B1', apiKey, provider,
        `Summarize this text in 5-8 key bullet points. Use C1/C2 vocabulary. Keep each point to 2-3 sentences.`
      )
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
