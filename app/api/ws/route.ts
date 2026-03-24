// WebSocket Server Handler
// Handles WebSocket upgrade requests and manages real-time chat connections

import { generateResponseStream } from '@/lib/ai-service'
import { buildHotelKnowledge, extractRelevantContext } from '@/lib/rag-knowledge'
import { getAllHotelSettings } from '@/lib/db'
import { chatRateLimiter, getClientIp } from '@/lib/rate-limiter'
import { chatMessageSchema, validateAndSanitize } from '@/lib/validation'
import { sessionStateManager } from '@/lib/session-state'
import {
  detectQuestionCategory,
  trackQuestionCategory,
  trackPopularTopic,
} from '@/lib/analytics'
import type {
  ClientMessage,
  ChatMessage,
  ChunkMessage,
  TypingStartMessage,
  TypingEndMessage,
  ErrorMessage,
  PongMessage,
} from '@/lib/websocket-types'
import { hasRequiredFields, isValidJSON } from '@/lib/websocket-types'

// ============================================
// Active connection tracking (per session)
// ============================================
const activeConnections = new Map<string, WebSocket>()

// ============================================
// Helper: send a typed message to a WebSocket client
// ============================================
function sendMessage(ws: WebSocket, message: object): void {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  } catch (err) {
    console.error('WS send error:', err)
  }
}

// ============================================
// Helper: build an error message payload
// ============================================
function makeError(
  code: ErrorMessage['code'],
  message: string,
  recoverable: boolean,
  retryAfter?: number
): ErrorMessage {
  return {
    type: 'error',
    code,
    message,
    recoverable,
    ...(retryAfter !== undefined && { retryAfter }),
    timestamp: Date.now(),
  }
}

// ============================================
// Handle incoming chat_message
// ============================================
async function handleChatMessage(
  ws: WebSocket,
  msg: ChatMessage,
  clientIp: string
): Promise<void> {
  const { messageId, message, sessionId, hotelData } = msg

  // 1. Rate limiting (per session ID, same limit as HTTP)
  const rateResult = await chatRateLimiter.checkLimit(sessionId)
  if (!rateResult.success) {
    sendMessage(ws, makeError(
      'RATE_LIMIT_EXCEEDED',
      'Too many messages. Please wait before sending more.',
      true,
      rateResult.retryAfter
    ))
    return
  }

  // 2. Typing indicator – let the client know we received the message
  const typingStart: TypingStartMessage = { type: 'typing_start', timestamp: Date.now() }
  sendMessage(ws, typingStart)

  try {
    // 3. Load hotel settings
    const allSettings = await getAllHotelSettings()
    const hotelId = hotelData?.id || Object.keys(allSettings)[0]
    const hotelSettings = allSettings[hotelId]

    if (!hotelSettings) {
      const typingEnd: TypingEndMessage = { type: 'typing_end', timestamp: Date.now() }
      sendMessage(ws, typingEnd)
      sendMessage(ws, makeError(
        'AI_SERVICE_ERROR',
        'Hotel configuration not found. Please contact the front desk.',
        false
      ))
      return
    }

    // 4. Load session state (conversation history)
    const session = await sessionStateManager.getOrCreateState(sessionId, hotelId)
    const conversationHistory = session.conversationHistory

    // 5. Build RAG context
    const fullKnowledge = buildHotelKnowledge(hotelSettings, hotelData, null)
    const relevantContext = extractRelevantContext(message, fullKnowledge)

    // 6. Analytics (non-blocking)
    trackAnalytics(message, hotelId, session.guestProfile?.ageRange).catch(err =>
      console.error('WS analytics error (non-blocking):', err)
    )

    // 7. Stream AI response
    let fullResponse = ''
    let chunkCount = 0
    let lastChunkTime = Date.now()

    const typingEnd: TypingEndMessage = { type: 'typing_end', timestamp: Date.now() }
    sendMessage(ws, typingEnd)

    for await (const chunk of generateResponseStream(message, relevantContext, conversationHistory)) {
      fullResponse += chunk
      chunkCount++

      // Buffer: enforce minimum 50ms between chunks to avoid overwhelming client
      const now = Date.now()
      const elapsed = now - lastChunkTime
      if (elapsed < 50 && chunkCount > 1) {
        await new Promise(r => setTimeout(r, 50 - elapsed))
      }
      lastChunkTime = Date.now()

      const chunkMsg: ChunkMessage = {
        type: 'chunk',
        messageId,
        chunk,
        isComplete: false,
        timestamp: Date.now(),
      }
      sendMessage(ws, chunkMsg)
    }

    // 8. Append event images if relevant, then send completion
    const imageAppendix = buildEventImageAppendix(fullResponse, hotelSettings?.specialEvents || [])
    if (imageAppendix) {
      const imageChunk: ChunkMessage = {
        type: 'chunk',
        messageId,
        chunk: '\n' + imageAppendix,
        isComplete: false,
        timestamp: Date.now(),
      }
      sendMessage(ws, imageChunk)
      fullResponse += '\n' + imageAppendix
    }

    // Send completion marker
    const completeMsg: ChunkMessage = {
      type: 'chunk',
      messageId,
      chunk: '',
      isComplete: true,
      timestamp: Date.now(),
    }
    sendMessage(ws, completeMsg)

    // 9. Persist conversation history
    await sessionStateManager.updateHistory(sessionId, { role: 'user', content: message })
    await sessionStateManager.updateHistory(sessionId, { role: 'assistant', content: fullResponse })

    console.log(`✅ WS chat complete: session=${sessionId} chunks=${chunkCount}`)
  } catch (err: any) {
    console.error('WS chat error:', err)

    const typingEnd: TypingEndMessage = { type: 'typing_end', timestamp: Date.now() }
    sendMessage(ws, typingEnd)

    const isRateLimit = err.message?.includes('Rate limit') || err.status === 429
    const isAuthError = err.message?.includes('API key') || err.status === 401

    sendMessage(ws, makeError(
      isRateLimit ? 'RATE_LIMIT_EXCEEDED' : isAuthError ? 'AUTHENTICATION_ERROR' : 'AI_SERVICE_ERROR',
      isRateLimit
        ? 'Service is temporarily busy. Please try again in a moment.'
        : isAuthError
        ? 'AI service configuration error. Please contact the front desk.'
        : 'An error occurred. Please try again.',
      !isAuthError
    ))
  }
}

// ============================================
// Analytics helper (same logic as HTTP endpoint)
// ============================================
async function trackAnalytics(message: string, hotelId: string, ageRange?: string) {
  const { category, subcategory, topics } = detectQuestionCategory(message)
  await trackQuestionCategory(hotelId, category, subcategory, ageRange)
  for (const topic of topics) {
    await trackPopularTopic(hotelId, topic)
  }
}

// Build [IMAGE:url] appendix for events mentioned in the AI response
function buildEventImageAppendix(response: string, events: any[]): string {
  const eventsWithImages = events.filter((e: any) => e.imageUrl)
  if (eventsWithImages.length === 0) return ''

  const responseLower = response.toLowerCase()
  const imageTags: string[] = []

  for (const event of eventsWithImages) {
    const titleWords = event.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
    const mentioned = titleWords.some((word: string) => responseLower.includes(word))
    if (mentioned) {
      imageTags.push(`[IMAGE:${event.imageUrl}]`)
    }
  }

  return imageTags.join('\n')
}

// ============================================
// GET handler – WebSocket upgrade
// ============================================
export async function GET(request: Request) {
  // Check for WebSocket upgrade header
  const upgradeHeader = request.headers.get('upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  // Extract session ID from query string
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId || sessionId.trim() === '') {
    return new Response('Missing sessionId', { status: 400 })
  }

  const clientIp = getClientIp(request)

  // Prevent duplicate connections for the same session
  const existing = activeConnections.get(sessionId)
  if (existing && existing.readyState === WebSocket.OPEN) {
    console.warn(`WS duplicate connection attempt: session=${sessionId}`)
    existing.close(1008, 'New connection established')
  }

  // Upgrade the connection
  // @ts-ignore – Next.js edge runtime WebSocket upgrade API
  const { socket, response } = Deno?.upgradeWebSocket
    // Deno (edge runtime) path
    // @ts-ignore
    ? Deno.upgradeWebSocket(request)
    // Node.js path via Next.js experimental WebSocket support
    : (() => {
        // Fallback: return 501 if runtime doesn't support WebSocket upgrades
        return { socket: null, response: new Response('WebSocket not supported in this environment', { status: 501 }) }
      })()

  if (!socket) {
    return response
  }

  // Track connection
  activeConnections.set(sessionId, socket)
  console.log(`🔌 WS connected: session=${sessionId} ip=${clientIp}`)

  // ---- Event handlers ----

  socket.onopen = () => {
    console.log(`✅ WS open: session=${sessionId}`)
  }

  socket.onmessage = async (event: MessageEvent) => {
    const raw = typeof event.data === 'string' ? event.data : null

    if (!raw || !isValidJSON(raw)) {
      sendMessage(socket, makeError('VALIDATION_ERROR', 'Invalid message format', true))
      return
    }

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      sendMessage(socket, makeError('VALIDATION_ERROR', 'Malformed JSON', true))
      return
    }

    // Validate required fields
    if (!hasRequiredFields(parsed)) {
      sendMessage(socket, makeError('VALIDATION_ERROR', 'Missing required message fields', true))
      return
    }

    const clientMsg = parsed as ClientMessage

    if (clientMsg.type === 'ping') {
      const pong: PongMessage = { type: 'pong', timestamp: Date.now() }
      sendMessage(socket, pong)
      return
    }

    if (clientMsg.type === 'chat_message') {
      // Validate with Zod schema (same as HTTP endpoint)
      const validation = validateAndSanitize(chatMessageSchema, {
        message: clientMsg.message,
        hotelData: clientMsg.hotelData,
        sessionId: clientMsg.sessionId,
      })

      if (!validation.success) {
        sendMessage(socket, makeError(
          'VALIDATION_ERROR',
          validation.errors?.join(', ') || 'Invalid message',
          true
        ))
        return
      }

      await handleChatMessage(socket, clientMsg, clientIp)
      return
    }

    // Unknown message type
    sendMessage(socket, makeError('VALIDATION_ERROR', `Unknown message type: ${(clientMsg as any).type}`, true))
  }

  socket.onclose = (event: CloseEvent) => {
    activeConnections.delete(sessionId)
    console.log(`🔌 WS closed: session=${sessionId} code=${
event.code}`)
  }

  socket.onerror = (err: Event) => {
    console.error(`❌ WS error: session=${sessionId}`, err)
    activeConnections.delete(sessionId)
  }

  return response
}
