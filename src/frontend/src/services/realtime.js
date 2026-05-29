import { REALTIME_WS_URL } from '../constants/config';

const DEFAULT_RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 15000];

export function createRealtimeClient({
  onMessage,
  onStatusChange,
  reconnectDelays = DEFAULT_RECONNECT_DELAYS,
  url = REALTIME_WS_URL
} = {}) {
  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let manuallyClosed = false;

  function updateStatus(status) {
    if (typeof onStatusChange === 'function') {
      onStatusChange(status);
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (manuallyClosed) {
      return;
    }

    const delay = reconnectDelays[Math.min(reconnectAttempt, reconnectDelays.length - 1)];
    reconnectAttempt += 1;
    updateStatus('reconnecting');
    clearReconnectTimer();
    reconnectTimer = setTimeout(connect, delay);
  }

  function handleMessage(event) {
    try {
      const payload = JSON.parse(event.data);
      if (payload && typeof payload.type === 'string' && typeof onMessage === 'function') {
        onMessage(payload);
      }
    } catch (error) {
      // Ignore malformed realtime messages. HTTP fallback remains available.
    }
  }

  function connect() {
    if (manuallyClosed || typeof WebSocket === 'undefined' || !url) {
      updateStatus('unavailable');
      return;
    }

    clearReconnectTimer();

    try {
      socket = new WebSocket(url);
    } catch (error) {
      updateStatus('unavailable');
      scheduleReconnect();
      return;
    }

    updateStatus('connecting');

    socket.onopen = () => {
      reconnectAttempt = 0;
      updateStatus('open');
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      updateStatus('error');
    };

    socket.onclose = () => {
      socket = null;
      updateStatus(manuallyClosed ? 'closed' : 'closed');
      scheduleReconnect();
    };
  }

  function disconnect() {
    manuallyClosed = true;
    clearReconnectTimer();

    if (socket) {
      socket.close();
      socket = null;
    }

    updateStatus('closed');
  }

  return {
    connect,
    disconnect,
    getStatus: () => {
      if (!socket) {
        return manuallyClosed ? 'closed' : 'disconnected';
      }

      return socket.readyState;
    }
  };
}
