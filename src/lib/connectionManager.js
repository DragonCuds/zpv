/**
 * connectionManager.js
 *
 * Hybrid WebSocket + HTTP Polling
 *
 * State machine:
 *   'connecting'  → WS در حال اتصال (تا ۱۰ ثانیه صبر میکنه)
 *   'ws'          → WS وصله، polling خاموشه
 *   'polling'     → WS قطعه یا وصل نشد، polling فعاله
 *   'stabilizing' → WS تازه وصل شد، داریم ۵ ثانیه صبر می‌کنیم قبل از switch
 */

import { getEcho } from './echo';

const WS_CONNECT_TIMEOUT  = 10_000; // اگه WS تا ۱۰ ثانیه وصل نشد → polling
const WS_STABILITY_DELAY  =  5_000; // بعد از وصل شدن WS، ۵ ثانیه صبر → switch

class ConnectionManager {
  constructor() {
    this._state       = 'connecting'; // 'connecting' | 'ws' | 'stabilizing' | 'polling'
    this._listeners   = new Set();    // ({onState, onMessage, onListRefresh}) => void
    this._connectTimer   = null;      // تایمر ۱۰ثانیه اول
    this._stabilityTimer = null;      // تایمر ۵ثانیه stability
    this._wsChannel      = null;
    this._userId         = null;
    this._initialized    = false;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * راه‌اندازی — فقط یه بار صدا زده میشه (از ChatPage)
   */
  init(userId) {
    if (this._initialized && this._userId === userId) return;
    this._userId      = userId;
    this._initialized = true;
    console.log('[CM] 🚀 Init برای userId:', userId);
    this._startConnecting();
  }

  /**
   * ثبت listener
   * برمیگردونه یه تابع برای unsubscribe
   */
  subscribe(listener) {
    this._listeners.add(listener);
    // فوری state فعلی رو بهش بده
    listener.onState?.(this._state);
    return () => this._listeners.delete(listener);
  }

  getState() {
    return this._state;
  }

  destroy() {
    this._clearTimers();
    this._leaveWsChannel();
    this._initialized = false;
    console.log('[CM] 🔌 Destroyed');
  }

  // ─── State Machine ─────────────────────────────────────────────────────────

  _setState(newState) {
    if (this._state === newState) return;
    console.log(`[CM] 📡 State: ${this._state} → ${newState}`);
    this._state = newState;
    this._listeners.forEach(l => l.onState?.(newState));
  }

  _startConnecting() {
    this._setState('connecting');
    this._tryWs();

    // اگه تا ۱۰ ثانیه وصل نشد → polling
    this._connectTimer = setTimeout(() => {
      if (this._state === 'connecting') {
        console.warn('[CM] ⏰ WS تا ۱۰ثانیه وصل نشد → polling');
        this._switchToPolling();
      }
    }, WS_CONNECT_TIMEOUT);
  }

  _tryWs() {
    const echo = getEcho();
    if (!echo || !this._userId) {
      console.warn('[CM] ⚠️ Echo یا userId نیست');
      this._switchToPolling();
      return;
    }

    // گوش دادن به event های WS
    try {
      this._wsChannel = echo.private(`user.${this._userId}`);

      this._wsChannel.listen('.new.message', (data) => {
        console.log('[CM] 📨 WS پیام جدید:', data.conversation_id);
        this._listeners.forEach(l => l.onMessage?.(data));
        this._listeners.forEach(l => l.onListRefresh?.());
      });

      this._wsChannel.listen('.chat.request', (data) => {
        console.log('[CM] 📬 WS درخواست چت جدید');
        this._listeners.forEach(l => l.onListRefresh?.());
      });

      // مانیتور کردن state خود Pusher
      const conn = echo.connector?.pusher?.connection;
      if (conn) {
        conn.bind('connected', () => this._onWsConnected());
        conn.bind('disconnected', () => this._onWsDisconnected());
        conn.bind('unavailable',  () => this._onWsDisconnected());
        conn.bind('failed',       () => this._onWsDisconnected());

        // اگه الان already connected باشه
        if (conn.state === 'connected') {
          this._onWsConnected();
        }
      } else {
        // نمیتونیم state رو مانیتور کنیم → polling
        this._switchToPolling();
      }
    } catch (err) {
      console.error('[CM] ❌ خطا در اتصال WS:', err);
      this._switchToPolling();
    }
  }

  _onWsConnected() {
    clearTimeout(this._connectTimer);
    this._connectTimer = null;

    if (this._state === 'ws') return; // قبلاً وصل بوده

    if (this._state === 'polling') {
      // از polling داریم میریم به WS — ۵ ثانیه stability check
      console.log('[CM] 🔄 WS وصل شد (از polling) — ۵ ثانیه stability check...');
      this._setState('stabilizing');

      clearTimeout(this._stabilityTimer);
      this._stabilityTimer = setTimeout(() => {
        if (this._state === 'stabilizing') {
          console.log('[CM] ✅ WS پایداره → switch به WS');
          this._switchToWs();
        }
      }, WS_STABILITY_DELAY);

    } else {
      // از connecting مستقیم وصل شد
      console.log('[CM] ✅ WS اولیه وصل شد');
      this._switchToWs();
    }
  }

  _onWsDisconnected() {
    clearTimeout(this._stabilityTimer);
    this._stabilityTimer = null;

    if (this._state === 'polling') return; // قبلاً polling

    console.warn('[CM] ⚡ WS قطع شد → polling');
    this._switchToPolling();
  }

  _switchToWs() {
    this._setState('ws');
    // polling listener ها خودشون چک می‌کنن state رو
  }

  _switchToPolling() {
    clearTimeout(this._connectTimer);
    clearTimeout(this._stabilityTimer);
    this._connectTimer   = null;
    this._stabilityTimer = null;
    this._setState('polling');
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  _clearTimers() {
    clearTimeout(this._connectTimer);
    clearTimeout(this._stabilityTimer);
    this._connectTimer   = null;
    this._stabilityTimer = null;
  }

  _leaveWsChannel() {
    try {
      const echo = getEcho();
      if (echo && this._userId) {
        echo.leave(`user.${this._userId}`);
      }
    } catch (_) {}
    this._wsChannel = null;
  }
}

// Singleton
export const connectionManager = new ConnectionManager();