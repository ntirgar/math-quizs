import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ user: null });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: payload.sub, email: payload.email } });
}
