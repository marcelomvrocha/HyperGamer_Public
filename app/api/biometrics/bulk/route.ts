import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { biometrics } = body;

    if (!Array.isArray(biometrics)) {
      return NextResponse.json({ error: 'biometrics must be an array' }, { status: 400 });
    }

    const results = [];

    for (const bio of biometrics) {
      const { date, weightKg, bfPercent, lbmKg, bmi } = bio;

      if (!date || !weightKg) {
        console.warn('Skipping biometric entry missing required fields:', bio);
        continue;
      }

      try {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const biometric = await prisma.biometricsWeekly.upsert({
          where: {
            userId_date: {
              userId,
              date: normalizedDate,
            },
          },
          update: {
            weightKg: parseFloat(weightKg),
            bfPercent: bfPercent ? parseFloat(bfPercent) : null,
            lbmKg: lbmKg ? parseFloat(lbmKg) : null,
            bmi: bmi ? parseFloat(bmi) : null,
          },
          create: {
            userId,
            date: normalizedDate,
            weightKg: parseFloat(weightKg),
            bfPercent: bfPercent ? parseFloat(bfPercent) : null,
            lbmKg: lbmKg ? parseFloat(lbmKg) : null,
            bmi: bmi ? parseFloat(bmi) : null,
          },
        });
        results.push(biometric);
      } catch (error) {
        console.error('Error upserting biometric:', bio, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      total: biometrics.length,
      results,
    });
  } catch (error) {
    console.error('Error bulk importing biometrics:', error);
    return NextResponse.json({ error: 'Failed to bulk import biometrics' }, { status: 500 });
  }
}
