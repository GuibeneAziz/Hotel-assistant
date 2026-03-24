# Requirements Document: WebSocket Real-Time Chat

## Introduction

This document specifies the requirements for implementing WebSocket-based real-time chat functionality for the Tunisia Hotel Assistant application. The system will enable streaming AI responses, typing indicators, instant bidirectional communication, and real-time notifications while maintaining backward compatibility with the existing HTTP-based chat endpoint.

The current implementation uses HTTP POST requests for each message, resulting in 1-3 second delays per message. The WebSocket implementation will provide sub-100ms response times for streaming chunks and enable a ChatGPT-like user experience with word-by-word AI responses.

## Glossary

- **WebSocket_Server**: The server-side WebSocket handler that manages persistent connections
- **WebSocket_Client**: The browser-side WebSocket client that maintains connection to server
- **HTTP_Chat_Endpoint**: The existing HTTP POST /api/chat endpoint used as fallback
- **Groq_AI_Service**: The AI service (lib/ai-service.ts) that generates responses with streaming support
- **Rate_Limiter**: The Redis-backed rate limiting system that prevents abuse
- **Analytics_Tracker**: The system that tracks chat interactions and guest behavior
- **Connection_Manager**: Component that handles WebSocket connection lifecycle and reconnection
- **Message_Chunk**: A partial AI response segment streamed to the client
- **Typing_Indicator**: Visual feedback showing AI is processing a response
- **Session_State**: Persistent connection state including authentication and conversation history
- **Fallback_Handler**: Component that switches to HTTP when WebSocket fails


## Requirements

### Requirement 1: WebSocket Connection Management

**User Story:** As a hotel guest, I want a persistent connection to the chat server, so that I can receive instant responses without repeated connection overhead.

#### Acceptance Criteria

1. WHEN a guest opens the chat interface, THE WebSocket_Client SHALL establish a connection to the WebSocket_Server within 500ms
2. WHILE the connection is active, THE WebSocket_Client SHALL maintain a heartbeat ping every 30 seconds
3. IF the connection is lost, THEN THE Connection_Manager SHALL attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
4. WHEN reconnection attempts exceed 5 failures, THE Fallback_Handler SHALL switch to HTTP_Chat_Endpoint
5. THE WebSocket_Server SHALL track active connections per session_id to prevent duplicate connections
6. WHEN a connection is established, THE WebSocket_Server SHALL authenticate the session_id and load Session_State
7. THE Connection_Manager SHALL emit connection state events (connecting, connected, disconnected, reconnecting, failed)
8. FOR ALL connection state changes, the client SHALL display appropriate UI feedback within 50ms


### Requirement 2: Streaming AI Response Delivery

**User Story:** As a hotel guest, I want to see AI responses appear word-by-word like ChatGPT, so that I get immediate feedback and don't wait for complete responses.

#### Acceptance Criteria

1. WHEN a guest sends a message, THE WebSocket_Server SHALL invoke Groq_AI_Service with streaming enabled
2. WHEN Groq_AI_Service generates a Message_Chunk, THE WebSocket_Server SHALL transmit it to WebSocket_Client within 50ms
3. THE WebSocket_Client SHALL append each Message_Chunk to the displayed message within 20ms of receipt
4. THE WebSocket_Server SHALL send Message_Chunks at minimum intervals of 50ms to prevent overwhelming the client
5. WHEN streaming completes, THE WebSocket_Server SHALL send a completion marker message
6. IF streaming fails mid-response, THEN THE WebSocket_Server SHALL send an error message and mark the response as incomplete
7. THE WebSocket_Client SHALL buffer Message_Chunks if they arrive faster than 20ms intervals
8. FOR ALL streamed responses, the complete message SHALL match the result from HTTP_Chat_Endpoint for identical inputs (idempotence property)


### Requirement 3: Typing Indicators

**User Story:** As a hotel guest, I want to see when the AI is processing my question, so that I know my message was received and a response is coming.

#### Acceptance Criteria

1. WHEN a guest sends a message, THE WebSocket_Client SHALL display Typing_Indicator within 50ms
2. WHEN the first Message_Chunk arrives, THE WebSocket_Client SHALL hide Typing_Indicator and begin displaying response
3. IF no Message_Chunk arrives within 5 seconds, THE WebSocket_Client SHALL display a "still processing" message
4. WHEN streaming completes, THE WebSocket_Client SHALL remove all typing indicators
5. THE Typing_Indicator SHALL include animated visual feedback (e.g., three pulsing dots)
6. IF connection is lost during typing, THE WebSocket_Client SHALL show "reconnecting" status instead of typing indicator
7. THE WebSocket_Server SHALL send a "typing_start" event immediately upon receiving a message
8. THE WebSocket_Server SHALL send a "typing_end" event when streaming begins or if an error occurs


### Requirement 4: Rate Limiting for WebSocket Connections

**User Story:** As a system administrator, I want rate limiting applied to WebSocket connections, so that the system is protected from abuse while maintaining security standards.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL track message count per WebSocket connection using the existing Redis-backed system
2. WHEN a connection sends more than 100 messages in 15 minutes, THE WebSocket_Server SHALL send a rate limit error message
3. THE WebSocket_Server SHALL NOT close the connection when rate limit is exceeded, only reject new messages
4. WHEN rate limit is exceeded, THE WebSocket_Client SHALL display a user-friendly message with retry time
5. THE Rate_Limiter SHALL use the same sliding window algorithm as HTTP_Chat_Endpoint
6. THE WebSocket_Server SHALL apply rate limits per session_id, not per connection (to handle reconnections)
7. WHEN a rate-limited user reconnects, THE Rate_Limiter SHALL maintain the same limit counter
8. THE Rate_Limiter SHALL reset counters after the 15-minute window expires


### Requirement 5: Input Validation and Sanitization

**User Story:** As a system administrator, I want all WebSocket messages validated and sanitized, so that the system maintains the same security posture as the HTTP endpoint.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL validate all incoming messages using the existing chatMessageSchema from lib/validation.ts
2. WHEN an invalid message is received, THE WebSocket_Server SHALL send an error response and NOT process the message
3. THE WebSocket_Server SHALL sanitize message content using DOMPurify before processing
4. THE WebSocket_Server SHALL reject messages exceeding 1000 characters
5. THE WebSocket_Server SHALL validate message structure includes required fields (message, hotelData, sessionId)
6. IF sanitization removes content, THE WebSocket_Server SHALL log the incident for security monitoring
7. THE WebSocket_Server SHALL apply the same validation rules as HTTP_Chat_Endpoint for consistency
8. FOR ALL valid messages, sanitization SHALL be idempotent (sanitize(sanitize(x)) = sanitize(x))


### Requirement 6: Analytics Tracking Preservation

**User Story:** As a hotel manager, I want WebSocket chat interactions tracked the same way as HTTP chat, so that analytics remain accurate and complete.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL invoke Analytics_Tracker for every processed message
2. THE Analytics_Tracker SHALL record question categories, topics, and guest demographics identically to HTTP_Chat_Endpoint
3. WHEN a message is processed via WebSocket, THE Analytics_Tracker SHALL increment the same counters as HTTP processing
4. THE WebSocket_Server SHALL pass session_id, hotel_id, and message content to Analytics_Tracker
5. IF analytics tracking fails, THE WebSocket_Server SHALL log the error but continue processing the message
6. THE Analytics_Tracker SHALL detect language, category, and sentiment from WebSocket messages
7. WHEN comparing analytics data, WebSocket and HTTP messages SHALL be indistinguishable in reports
8. FOR ALL tracked metrics, the total count SHALL equal the sum of HTTP and WebSocket messages (completeness property)


### Requirement 7: HTTP Fallback Mechanism

**User Story:** As a hotel guest, I want the chat to work even if WebSocket fails, so that I can always get assistance regardless of network conditions.

#### Acceptance Criteria

1. WHEN WebSocket connection fails after 5 reconnection attempts, THE Fallback_Handler SHALL switch to HTTP_Chat_Endpoint
2. THE Fallback_Handler SHALL preserve conversation history when switching from WebSocket to HTTP
3. WHEN using HTTP fallback, THE WebSocket_Client SHALL display a notice that real-time features are unavailable
4. THE Fallback_Handler SHALL periodically attempt to re-establish WebSocket connection every 60 seconds
5. WHEN WebSocket becomes available again, THE Fallback_Handler SHALL switch back to WebSocket mode
6. THE HTTP_Chat_Endpoint SHALL remain unchanged and fully functional during WebSocket implementation
7. THE Fallback_Handler SHALL use the same message format for both WebSocket and HTTP to ensure compatibility
8. FOR ALL messages sent via fallback, the response SHALL be identical to direct HTTP_Chat_Endpoint usage (equivalence property)


### Requirement 8: Conversation History Management

**User Story:** As a hotel guest, I want my conversation history maintained across the WebSocket session, so that the AI understands context from previous messages.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL maintain conversation history in Session_State for each active connection
2. THE Session_State SHALL store the last 6 messages (3 exchanges) as per existing HTTP implementation
3. WHEN a new message arrives, THE WebSocket_Server SHALL append it to Session_State before generating response
4. WHEN a connection is re-established, THE WebSocket_Server SHALL restore Session_State from Redis cache
5. THE WebSocket_Server SHALL persist Session_State to Redis every 30 seconds and on disconnect
6. THE Session_State SHALL expire from Redis after 24 hours of inactivity
7. WHEN Session_State is unavailable, THE WebSocket_Server SHALL start with empty history
8. FOR ALL reconnections within 24 hours, conversation history SHALL be preserved (persistence property)


### Requirement 9: Groq AI Service Streaming Integration

**User Story:** As a developer, I want the Groq AI service enhanced to support streaming, so that responses can be delivered incrementally to users.

#### Acceptance Criteria

1. THE Groq_AI_Service SHALL support a new streaming mode in addition to existing non-streaming mode
2. WHEN streaming is enabled, THE Groq_AI_Service SHALL set stream: true in the API request
3. THE Groq_AI_Service SHALL yield Message_Chunks as they arrive from the Groq API
4. WHEN streaming is disabled (HTTP mode), THE Groq_AI_Service SHALL behave identically to current implementation
5. THE Groq_AI_Service SHALL handle streaming errors by returning partial response with error indicator
6. THE Groq_AI_Service SHALL apply the same caching logic for complete streamed responses
7. THE Groq_AI_Service SHALL use the same system prompt and parameters for both streaming and non-streaming modes
8. FOR ALL inputs, concatenating all Message_Chunks SHALL equal the non-streaming response (round-trip property)


### Requirement 10: Real-Time Hotel Data Change Notifications

**User Story:** As a hotel guest, I want to be notified immediately when hotel information changes, so that I always have current information about facilities and services.

#### Acceptance Criteria

1. WHEN hotel settings are updated in the database, THE WebSocket_Server SHALL broadcast a notification to all connected clients for that hotel
2. THE WebSocket_Client SHALL display a non-intrusive notification when hotel data changes
3. THE notification SHALL include a summary of what changed (e.g., "Pool hours updated")
4. THE WebSocket_Client SHALL offer to refresh the conversation context with updated information
5. WHEN a guest accepts the refresh, THE WebSocket_Client SHALL reload hotel settings and notify the user
6. THE WebSocket_Server SHALL use Redis pub/sub to coordinate notifications across multiple server instances
7. THE notification system SHALL NOT interrupt ongoing message streaming
8. WHEN hotel data changes, ALL active connections for that hotel SHALL receive notification within 2 seconds


### Requirement 11: WebSocket Message Protocol

**User Story:** As a developer, I want a well-defined message protocol for WebSocket communication, so that client and server can communicate reliably and extensibly.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL use JSON format for all messages with a "type" field indicating message purpose
2. THE protocol SHALL support message types: "chat_message", "chunk", "typing_start", "typing_end", "error", "notification", "ping", "pong"
3. WHEN sending a chat message, THE WebSocket_Client SHALL include: type, message, sessionId, hotelData, timestamp
4. WHEN sending a chunk, THE WebSocket_Server SHALL include: type, chunk, messageId, isComplete, timestamp
5. THE protocol SHALL include a messageId field to correlate chunks with original messages
6. WHEN an error occurs, THE WebSocket_Server SHALL send: type: "error", code, message, recoverable
7. THE WebSocket_Client SHALL validate message structure before processing
8. FOR ALL message types, the protocol SHALL be versioned to support future extensions


### Requirement 12: Serverless Environment Compatibility

**User Story:** As a system administrator, I want the WebSocket implementation to work in serverless environments like Vercel, so that deployment remains simple and scalable.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL be implemented using Next.js API routes with WebSocket upgrade support
2. WHERE serverless WebSocket is not supported, THE system SHALL automatically use HTTP fallback
3. THE WebSocket_Server SHALL use Redis for state management to support multiple server instances
4. THE WebSocket_Server SHALL NOT rely on in-memory state that would be lost on serverless function termination
5. THE Connection_Manager SHALL handle serverless function cold starts gracefully
6. THE WebSocket_Server SHALL complete message processing within serverless timeout limits (typically 10 seconds)
7. WHERE Vercel deployment is used, THE system SHALL utilize Vercel's WebSocket support or fallback appropriately
8. THE implementation SHALL document deployment requirements for serverless vs. traditional hosting


### Requirement 13: Performance and Latency Requirements

**User Story:** As a hotel guest, I want responses to feel instant, so that the chat experience is smooth and responsive.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL deliver the first Message_Chunk within 100ms of receiving a message
2. THE WebSocket_Server SHALL deliver subsequent Message_Chunks with average latency under 50ms
3. THE WebSocket_Client SHALL render each Message_Chunk within 20ms of receipt
4. THE Typing_Indicator SHALL appear within 50ms of sending a message
5. THE WebSocket connection establishment SHALL complete within 500ms on initial load
6. THE reconnection attempt SHALL begin within 1 second of detecting disconnection
7. THE system SHALL maintain performance with up to 100 concurrent WebSocket connections per server instance
8. FOR ALL message processing, end-to-end latency SHALL be under 3 seconds for 95th percentile


### Requirement 14: Error Handling and Recovery

**User Story:** As a hotel guest, I want clear error messages and automatic recovery, so that temporary issues don't prevent me from getting help.

#### Acceptance Criteria

1. WHEN a WebSocket error occurs, THE WebSocket_Client SHALL display a user-friendly error message
2. THE error message SHALL indicate whether the issue is temporary or requires action
3. IF the error is recoverable, THE Connection_Manager SHALL attempt automatic reconnection
4. IF the error is not recoverable, THE Fallback_Handler SHALL switch to HTTP mode
5. THE WebSocket_Server SHALL log all errors with sufficient context for debugging
6. WHEN Groq_AI_Service fails during streaming, THE WebSocket_Server SHALL send partial response with error indicator
7. THE WebSocket_Client SHALL handle malformed messages gracefully without crashing
8. FOR ALL error conditions, the system SHALL maintain conversation history and allow retry


### Requirement 15: Security and Authentication

**User Story:** As a system administrator, I want WebSocket connections secured with the same standards as HTTP endpoints, so that the system remains protected from attacks.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL validate session_id on connection establishment
2. THE WebSocket_Server SHALL reject connections without valid session_id
3. THE WebSocket_Server SHALL apply the same CORS policies as HTTP endpoints
4. THE WebSocket_Server SHALL use WSS (WebSocket Secure) protocol in production
5. THE WebSocket_Server SHALL implement connection timeout of 5 minutes for idle connections
6. THE WebSocket_Server SHALL limit maximum message size to 10KB to prevent memory attacks
7. THE WebSocket_Server SHALL track and limit concurrent connections per IP address (max 5)
8. FOR ALL security measures, WebSocket SHALL maintain parity with HTTP_Chat_Endpoint protections


### Requirement 16: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive tests for WebSocket functionality, so that the system is reliable and regressions are caught early.

#### Acceptance Criteria

1. THE system SHALL include unit tests for Connection_Manager covering all connection states
2. THE system SHALL include integration tests for message streaming with mock Groq_AI_Service
3. THE system SHALL include tests for fallback mechanism switching between WebSocket and HTTP
4. THE system SHALL include property-based tests for message protocol serialization/deserialization (round-trip property)
5. THE system SHALL include tests verifying rate limiting works identically for WebSocket and HTTP
6. THE system SHALL include tests confirming analytics tracking is identical for both protocols
7. THE system SHALL include load tests demonstrating 100 concurrent connections
8. FOR ALL existing HTTP chat tests, equivalent WebSocket tests SHALL exist and pass


### Requirement 17: Monitoring and Observability

**User Story:** As a system administrator, I want visibility into WebSocket connection health and performance, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL log connection events (connect, disconnect, error) with timestamps and session_id
2. THE WebSocket_Server SHALL track metrics: active connections, messages per second, average latency, error rate
3. THE WebSocket_Server SHALL expose a health check endpoint showing WebSocket service status
4. THE system SHALL log when fallback to HTTP occurs with reason
5. THE WebSocket_Server SHALL track and log rate limit violations
6. THE system SHALL monitor and alert when error rate exceeds 5% of messages
7. THE WebSocket_Server SHALL track streaming performance (time to first chunk, chunks per second)
8. FOR ALL production deployments, metrics SHALL be exportable to monitoring systems (e.g., Prometheus format)


### Requirement 18: Backward Compatibility

**User Story:** As a system administrator, I want zero breaking changes to existing functionality, so that current users are not impacted during rollout.

#### Acceptance Criteria

1. THE HTTP_Chat_Endpoint SHALL remain fully functional and unchanged
2. THE existing chat UI SHALL work without modification if WebSocket is disabled
3. THE WebSocket implementation SHALL be feature-flagged for gradual rollout
4. WHEN WebSocket is disabled, THE system SHALL function identically to current implementation
5. THE existing tests for HTTP chat SHALL continue to pass without modification
6. THE analytics system SHALL work identically regardless of protocol used
7. THE rate limiting system SHALL apply consistent limits across both protocols
8. FOR ALL existing API contracts, behavior SHALL remain unchanged (backward compatibility property)


## Correctness Properties for Property-Based Testing

### Property 1: Message Round-Trip Integrity

**Description:** Streaming a message in chunks and concatenating them should produce the same result as non-streaming mode.

**Property:** For all valid messages M and hotel context H:
```
concat(stream(M, H)) = generate(M, H)
```

**Test Strategy:** Generate random valid messages, compare streamed vs non-streamed responses.

### Property 2: Protocol Serialization Idempotence

**Description:** Serializing and deserializing WebSocket messages should preserve all data.

**Property:** For all valid WebSocket messages W:
```
deserialize(serialize(W)) = W
```

**Test Strategy:** Generate random valid WebSocket messages, verify round-trip through JSON serialization.

### Property 3: Rate Limit Consistency

**Description:** Rate limiting should behave identically for WebSocket and HTTP protocols.

**Property:** For all message sequences S and session ID sid:
```
rateLimitResult(S, sid, "websocket") = rateLimitResult(S, sid, "http")
```

**Test Strategy:** Send identical message sequences through both protocols, verify rate limit triggers at same point.

### Property 4: Analytics Tracking Completeness

**Description:** Every processed message should be tracked exactly once in analytics.

**Property:** For all messages M processed:
```
count(analyticsDB, M.sessionId) = count(processedMessages, M.sessionId)
```

**Test Strategy:** Send messages through both protocols, verify analytics counts match total messages sent.

### Property 5: Connection State Machine Validity

**Description:** Connection state transitions should follow valid state machine rules.

**Property:** For all state transitions (S1 -> S2):
```
isValidTransition(S1, S2) = true
```

Valid transitions:
- disconnected -> connecting -> connected
- connected -> disconnected
- connected -> reconnecting -> connected
- reconnecting -> failed -> disconnected

**Test Strategy:** Generate random connection events, verify no invalid state transitions occur.

### Property 6: Fallback Equivalence

**Description:** Messages sent via HTTP fallback should produce identical responses to WebSocket.

**Property:** For all messages M and context C:
```
response(M, C, "websocket") = response(M, C, "http_fallback")
```

**Test Strategy:** Send same messages through WebSocket and fallback, compare responses.

### Property 7: Session State Persistence

**Description:** Reconnecting within timeout should restore conversation history.

**Property:** For all sessions S with history H, if reconnect within 24 hours:
```
getHistory(S, after_reconnect) = H
```

**Test Strategy:** Establish session, disconnect, reconnect, verify history preserved.

### Property 8: Chunk Ordering Preservation

**Description:** Message chunks should arrive in order and be reassembled correctly.

**Property:** For all streamed messages M with chunks [C1, C2, ..., Cn]:
```
order(received_chunks) = [C1, C2, ..., Cn] AND
concat(received_chunks) = M
```

**Test Strategy:** Stream messages, verify chunk order and final concatenation matches original.

### Property 9: Error Recovery Invariant

**Description:** System should maintain conversation history through error recovery.

**Property:** For all sessions S with history H, after any error E and recovery:
```
getHistory(S, after_recovery) contains H
```

**Test Strategy:** Inject errors at various points, verify history not lost.

### Property 10: Security Parity

**Description:** WebSocket should enforce same security measures as HTTP.

**Property:** For all security checks C:
```
applies(C, "websocket") = applies(C, "http")
```

Security checks: rate limiting, input sanitization, session validation, message size limits.

**Test Strategy:** Attempt security violations through both protocols, verify identical blocking behavior.

## Non-Functional Requirements

### Performance
- First chunk latency: < 100ms (95th percentile)
- Subsequent chunk latency: < 50ms (average)
- Connection establishment: < 500ms
- Reconnection attempt: < 1s after disconnect
- Support 100 concurrent connections per instance

### Scalability
- Horizontal scaling via Redis state management
- No in-memory state dependencies
- Support for serverless deployment

### Reliability
- 99.9% uptime for WebSocket service
- Automatic fallback on failure
- Graceful degradation
- Zero data loss during reconnection

### Security
- WSS (TLS) in production
- Session validation on connect
- Rate limiting per session
- Input sanitization
- Connection limits per IP

### Maintainability
- Feature flag for gradual rollout
- Comprehensive logging
- Metrics export
- Clear error messages
- Documentation for deployment

---

## Success Metrics

1. **Performance:** 95% of first chunks delivered within 100ms
2. **Reliability:** < 1% of connections require HTTP fallback
3. **User Experience:** Typing indicators appear within 50ms
4. **Compatibility:** 100% of existing HTTP tests pass
5. **Security:** Zero security regressions
6. **Analytics:** 100% of messages tracked accurately

---

## Out of Scope

The following are explicitly NOT included in this specification:

1. **Multi-user chat rooms:** Only 1-on-1 guest-to-AI chat
2. **File uploads via WebSocket:** Continue using HTTP for files
3. **Video/audio streaming:** Text-only communication
4. **Admin dashboard via WebSocket:** Admin features remain HTTP-based
5. **Mobile app WebSocket:** Specification covers web browser only
6. **Custom WebSocket server:** Use Next.js API routes, not standalone server
7. **WebRTC:** Not using peer-to-peer protocols
8. **GraphQL subscriptions:** Using plain WebSocket protocol

---

## Dependencies and Constraints

### Technical Dependencies
- Next.js 14 with WebSocket support
- Groq SDK with streaming API
- Redis for state management and pub/sub
- Existing PostgreSQL database
- Current authentication system

### Constraints
- Must work in Vercel serverless environment
- Must maintain < 10KB message size
- Must complete within serverless timeout (10s)
- Must use existing Redis instance
- Must not require database schema changes

### External Service Limits
- Groq API: 14,400 requests/day (free tier)
- Redis: 10,000 commands/day (free tier)
- Vercel: 100GB bandwidth/month (free tier)

---

## Glossary Additions

- **Chunk Buffering**: Temporarily storing message chunks when they arrive faster than display rate
- **Exponential Backoff**: Reconnection strategy that increases wait time after each failure
- **Heartbeat Ping**: Periodic message to keep connection alive and detect disconnection
- **Idempotence**: Property where applying operation multiple times has same effect as once
- **Round-Trip Property**: Property where encoding then decoding returns original value
- **Sliding Window**: Rate limiting algorithm that counts requests in rolling time window
- **State Machine**: Formal model of connection states and valid transitions
- **WSS Protocol**: WebSocket Secure, encrypted WebSocket over TLS

---

## References

- EARS (Easy Approach to Requirements Syntax) patterns
- INCOSE requirements quality guidelines
- OWASP WebSocket Security Cheat Sheet
- Groq API Streaming Documentation
- Next.js API Routes with WebSocket
- Redis Pub/Sub Documentation
- Property-Based Testing principles

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Draft - Awaiting Review
