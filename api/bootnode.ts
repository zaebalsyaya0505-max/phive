import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge', // Обязательно Edge для минимальной задержки (latency)
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  
  // Базовая защита от сторонних сканеров (секретный токен в заголовке)
  const authHeader = req.headers.get('x-phive-auth');
  if (authHeader !== process.env.PHIVE_SECRET_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 1. РЕГИСТРАЦИЯ ЖИВОГО УЗЛА (POST запрос от сидера)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { peerId, multiaddr } = body;

      // Получаем реальный IP узла (Vercel прокидывает его в заголовках)
      const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

      // Сохраняем в KV базу с TTL (время жизни) 5 минут.
      // Если узел не пинганул сервер за 5 минут, он удаляется из списка.
      await kv.sadd('active_peers', JSON.stringify({ peerId, multiaddr, ip: clientIp }));
      // В реальном проекте тут нужна логика очистки старых записей
      
      return new Response(JSON.stringify({ status: 'registered' }), { status: 200 });
    } catch (e) {
      return new Response('Bad Request', { status: 400 });
    }
  }

  // 2. ВЫДАЧА СПИСКА ПИРОВ ДЛЯ НОВИЧКОВ (GET запрос)
  if (req.method === 'GET') {
    // Получаем список активных пиров
    const peers = await kv.smembers('active_peers');
    
    // Перемешиваем и отдаем случайные 10 узлов, чтобы не перегружать одних и тех же
    const shuffled = peers.sort(() => 0.5 - Math.random()).slice(0, 10);

    return new Response(JSON.stringify({ peers: shuffled }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
