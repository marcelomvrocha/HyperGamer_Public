import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');

    let take: number | undefined = 12; // Keep existing default behavior for pages that do not request a range
    if (limitParam === 'all') {
      take = undefined;
    } else if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        take = parsedLimit;
      }
    }

    const biometrics = await prisma.biometricsWeekly.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      ...(typeof take === 'number' ? { take } : {}),
    });
    return NextResponse.json(biometrics);
  } catch (error) {
    console.error('Error fetching biometrics:', error);
    return NextResponse.json({ error: 'Failed to fetch biometrics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, weightKg, bfPercent, lbmKg, bmi } = body;

    // Normalize date to start of day to ensure consistent comparison
    const biometricDate = date ? new Date(date) : new Date();
    biometricDate.setHours(0, 0, 0, 0);

    const biometric = await prisma.biometricsWeekly.upsert({
      where: {
        userId_date: {
          userId,
          date: biometricDate,
        },
      },
      update: {
        weightKg,
        bfPercent: bfPercent || null,
        lbmKg: lbmKg || null,
        bmi: bmi || null,
      },
      create: {
        userId,
        date: biometricDate,
        weightKg,
        bfPercent: bfPercent || null,
        lbmKg: lbmKg || null,
        bmi: bmi || null,
      },
    });

    return NextResponse.json(biometric);
  } catch (error) {
    console.error('Error saving biometrics:', error);
    return NextResponse.json({ error: 'Failed to save biometrics' }, { status: 500 });
  }
}
