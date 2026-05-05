import { setRedisValue, getRedisValue, deleteRedisValue, USE_REDIS } from './redis';

// Fallback in-memory store for development
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email: string, code: string): Promise<void> {
  const otpData = JSON.stringify({
    code,
    attempts: 0,
  });

  if (USE_REDIS) {
    await setRedisValue(`otp:${email}`, otpData, OTP_EXPIRY);
  } else {
    // Fallback: in-memory storage
    otpStore.set(email, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY * 1000,
      attempts: 0,
    });
  }
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  let storedOTP: { code: string; attempts: number } | null = null;

  if (USE_REDIS) {
    const data = await getRedisValue(`otp:${email}`);
    if (!data) return false;
    storedOTP = JSON.parse(data);
  } else {
    const inMemory = otpStore.get(email);
    if (!inMemory || Date.now() > inMemory.expiresAt) {
      otpStore.delete(email);
      return false;
    }
    storedOTP = {
      code: inMemory.code,
      attempts: inMemory.attempts,
    };
  }

  if (!storedOTP) return false;

  if (storedOTP.attempts >= MAX_ATTEMPTS) {
    if (USE_REDIS) {
      await deleteRedisValue(`otp:${email}`);
    } else {
      otpStore.delete(email);
    }
    return false;
  }

  storedOTP.attempts++;

  // Update attempts
  if (USE_REDIS) {
    await setRedisValue(`otp:${email}`, JSON.stringify(storedOTP), OTP_EXPIRY);
  } else {
    const inMemory = otpStore.get(email)!;
    inMemory.attempts = storedOTP.attempts;
  }

  if (storedOTP.code === code) {
    if (USE_REDIS) {
      await deleteRedisValue(`otp:${email}`);
    } else {
      otpStore.delete(email);
    }
    return true;
  }

  return false;
}

export async function deleteOTP(email: string): Promise<void> {
  if (USE_REDIS) {
    await deleteRedisValue(`otp:${email}`);
  } else {
    otpStore.delete(email);
  }
}

export async function getRemainingAttempts(email: string): Promise<number> {
  let storedOTP: { code: string; attempts: number } | null = null;

  if (USE_REDIS) {
    const data = await getRedisValue(`otp:${email}`);
    if (!data) return MAX_ATTEMPTS;
    storedOTP = JSON.parse(data);
  } else {
    const inMemory = otpStore.get(email);
    if (!inMemory) return MAX_ATTEMPTS;
    storedOTP = {
      code: inMemory.code,
      attempts: inMemory.attempts,
    };
  }

  return MAX_ATTEMPTS - (storedOTP?.attempts || 0);
}
