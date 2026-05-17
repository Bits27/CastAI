import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Citation {
  chunkId: string
  videoId: string
  videoTitle: string
  startSeconds: number
}


export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
}

interface ChatState {
  messages: ChatMessage[]
  streaming: boolean
  error: string | null
}

const initialState: ChatState = {
  messages: [],
  streaming: false,
  error: null,
}

const CITATION_RE = /\[SOURCE:([^:]+):([^:]+):([^:]+):([^\]]+)\]/g

function stripCitations(text: string): string {
  return text.replace(CITATION_RE, '').replace(/\s{2,}/g, ' ').trim()
}

function extractCitations(text: string): Citation[] {
  const citations: Citation[] = []
  let match: RegExpExecArray | null
  const re = /\[SOURCE:([^:]+):([^:]+):([^:]+):([^\]]+)\]/g
  while ((match = re.exec(text)) !== null) {
    citations.push({
      chunkId: match[1],
      videoId: match[2],
      videoTitle: match[3],
      startSeconds: parseFloat(match[4]),
    })
  }
  return citations
}

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { query, videoIds, collectionId }: { query: string; videoIds: string[]; collectionId?: string },
    { dispatch }
  ) => {
    const userMsgId = crypto.randomUUID()
    dispatch(chatSlice.actions.addUserMessage({ id: userMsgId, content: query }))

    const assistantMsgId = crypto.randomUUID()
    dispatch(chatSlice.actions.startAssistantMessage({ id: assistantMsgId }))

    const token = await getClerkToken()

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, videoIds, collectionId }),
    })

    if (!res.ok) {
      dispatch(chatSlice.actions.setError('Chat request failed'))
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      // SSE lines: "data: <token>\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          if (data === '[ERROR]') {
            dispatch(chatSlice.actions.setError('Something went wrong. Please try again.'))
            return
          }
          const decoded = data.replace(/\\n/g, '\n')
          accumulated += decoded
          dispatch(chatSlice.actions.appendToken({ id: assistantMsgId, token: decoded }))
        }
      }
    }

    const citations = extractCitations(accumulated)
    dispatch(chatSlice.actions.finalizeMessage({ id: assistantMsgId, citations }))
  }
)

async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).__clerkGetToken) {
    return (window as any).__clerkGetToken()
  }
  return ''
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage(state, action: PayloadAction<{ id: string; content: string }>) {
      state.messages.push({
        id: action.payload.id,
        role: 'user',
        content: action.payload.content,
        citations: [],
      })
    },
    startAssistantMessage(state, action: PayloadAction<{ id: string }>) {
      state.streaming = true
      state.messages.push({
        id: action.payload.id,
        role: 'assistant',
        content: '',
        citations: [],
      })
    },
    appendToken(state, action: PayloadAction<{ id: string; token: string }>) {
      const msg = state.messages.find((m) => m.id === action.payload.id)
      if (msg) msg.content += action.payload.token
    },
    finalizeMessage(state, action: PayloadAction<{ id: string; citations: Citation[] }>) {
      state.streaming = false
      const msg = state.messages.find((m) => m.id === action.payload.id)
      if (msg) {
        msg.content = stripCitations(msg.content)
        msg.citations = action.payload.citations
      }
    },
    clearChat(state) {
      state.messages = []
      state.streaming = false
      state.error = null
    },
    setError(state, action: PayloadAction<string>) {
      state.streaming = false
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sendMessage.rejected, (state) => {
      state.streaming = false
      state.error = 'Failed to send message'
    })
  },
})

export const { clearChat, setError } = chatSlice.actions
export default chatSlice.reducer
