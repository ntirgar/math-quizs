import { NextResponse } from 'next/server';
import { getUserCount } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ userCount: getUserCount() });
}
