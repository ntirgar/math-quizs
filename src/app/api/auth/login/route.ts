import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status:400 });
    const user = verifyUser(email, password);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status:401 });
    const token = signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ user: { email: user.email } });
    res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path:'/' });
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status:500 });
  }
}