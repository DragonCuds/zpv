import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;

let echoInstance = null;

export function getEcho() {
  if (echoInstance) return echoInstance;

  const token = localStorage.getItem('zpv_token');
  if (!token) {
    console.warn('[Echo] ❌ توکن پیدا نشد');
    return null;
  }

  console.log('[Echo] 🔄 در حال اتصال به Pusher...');
  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: '5ecce71eb36b4e1069db',
    cluster: 'eu',
    forceTLS: true,
    authEndpoint: 'https://amirrezaei2002x.shop/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  const conn = echoInstance.connector.pusher.connection;
  conn.bind('connected',    () => console.log('[Echo] ✅ Pusher متصل شد!'));
  conn.bind('disconnected', () => console.warn('[Echo] ⚠️  قطع شد'));
  conn.bind('failed',       () => console.error('[Echo] ❌ اتصال ناموفق'));
  conn.bind('error',    (e) => console.error('[Echo] ❌ خطا:', e));

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    console.log('[Echo] 🔌 قطع شد.');
  }
}