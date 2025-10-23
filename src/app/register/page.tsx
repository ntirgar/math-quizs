"use client";
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, Heading, Text, Flex, TextField, Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [error,setError] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/');
    } catch (err) { setError(err instanceof Error ? err.message : 'Registration failed'); } finally { setLoading(false); }
  };

  return (
    <AppShell hideHeader>
      <Heading size="7" mb="4">Create Parent Account</Heading>
      <Card size="4" style={{ maxWidth:420 }}>
        <form onSubmit={submit}>
          <Flex direction="column" gap="3">
            <label>
              <Text size="2" mb="1" as="div">Email</Text>
              <TextField.Root value={email} onChange={e=> setEmail(e.target.value)} required type="email" autoComplete="email" />
            </label>
            <label>
              <Text size="2" mb="1" as="div">Password</Text>
              <TextField.Root value={password} onChange={e=> setPassword(e.target.value)} required type="password" autoComplete="new-password" />
            </label>
            <label>
              <Text size="2" mb="1" as="div">Confirm Password</Text>
              <TextField.Root value={confirm} onChange={e=> setConfirm(e.target.value)} required type="password" autoComplete="new-password" />
            </label>
            {error && <Text size="2" color="red">{error}</Text>}
            <Button disabled={loading} type="submit" color="purple">{loading? 'Registering...':'Register'}</Button>
            <Text size="2" color="gray">Already have an account? <Link href="/login">Login</Link></Text>
          </Flex>
        </form>
      </Card>
    </AppShell>
  );
}
