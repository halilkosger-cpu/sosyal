// In-memory OTP store (for development)
// In production, use Redis
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(email: string, code: string): void {
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY,
    attempts: 0,
  });
}

export function verifyOTP(email: string, code: string): boolean {
  const storedOTP = otpStore.get(email);

  if (!storedOTP) {
    return false;
  }

  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  if (storedOTP.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email);
    return false;
  }

  storedOTP.attempts++;

  if (storedOTP.code === code) {
    otpStore.delete(email);
    return true;
  }

  return false;
}

export function deleteOTP(email: string): void {
  otpStore.delete(email);
}

export function getRemainingAttempts(email: string): number {
  const storedOTP = otpStore.get(email);
  if (!storedOTP) return MAX_ATTEMPTS;
  return MAX_ATTEMPTS - storedOTP.attempts;
}
