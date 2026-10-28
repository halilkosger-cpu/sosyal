import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceStatus {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  services?: {
    database: ServiceStatus;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isShallow = searchParams.get('shallow') === 'true';

  let dbStatus: ServiceStatus = { status: 'up' };
  let isHealthy = true;

  if (!isShallow) {
    const dbStartTime = Date.now();
    try {
      // 3 saniye içinde cevap alamazsa zaman aşımı
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Veritabanı yanıt zaman aşımı (3s)')), 3000)
        ),
      ]);
      dbStatus = {
        status: 'up',
        latencyMs: Date.now() - dbStartTime,
      };
    } catch (err: any) {
      isHealthy = false;
      dbStatus = {
        status: 'down',
        latencyMs: Date.now() - dbStartTime,
        error: process.env.NODE_ENV === 'development' ? err?.message : 'Bağlantı hatası',
      };
    }
  }

  const responseBody: HealthResponse = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    ...(isShallow ? {} : { services: { database: dbStatus } }),
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: {
      // Sik ping atan izleme servisi veritabanini uyutmasin diye sonuc CDN'de 10 dk tutulur.
      'Cache-Control': isHealthy ? 'public, s-maxage=600' : 'no-store',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
