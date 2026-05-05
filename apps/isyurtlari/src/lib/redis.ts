import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

const REDIS_URL = process.env.REDIS_URL;
const USE_REDIS = !!REDIS_URL;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (!USE_REDIS) return null;

  if (client) return client;

  try {
    client = createClient({
      url: REDIS_URL,
    });

    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('Redis connected'));

    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

export async function setRedisValue(key: string, value: string, expirySeconds: number): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;

    await redis.setEx(key, expirySeconds, value);
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

export async function getRedisValue(key: string): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    return await redis.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function deleteRedisValue(key: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;

    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

export async function incrementRedisValue(key: string): Promise<number | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    return await redis.incr(key);
  } catch (error) {
    console.error('Redis incr error:', error);
    return null;
  }
}

export { USE_REDIS };
