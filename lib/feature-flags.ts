// Feature Flags
// Controls which features are enabled via environment variables

/**
 * Returns true if WebSocket is enabled via the ENABLE_WEBSOCKET env var.
 * Defaults to false so existing HTTP chat is unaffected until explicitly enabled.
 */
export function isWebSocketEnabled(): boolean {
  return process.env.ENABLE_WEBSOCKET === 'true'
}

/**
 * Returns the WebSocket endpoint URL for the current environment.
 * Converts the current page origin from http(s) to ws(s).
 */
export function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}
