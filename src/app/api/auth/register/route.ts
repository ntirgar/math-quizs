import { NextRequest, NextResponse } from 'next/server';
import { createUser, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status:400 });
    if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'Invalid types' }, { status:400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password too short' }, { status:400 });
    const user = createUser(email, password);
    const token = signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ user: { email: user.email } });
    res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path:'/' });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('exists')) return NextResponse.json({ error: 'User already exists' }, { status:409 });
    return NextResponse.json({ error: 'Registration failed' }, { status:500 });
  }
}