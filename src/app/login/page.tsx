"use client";
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, Heading, Text, Flex, TextField, Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
  router.push('/dashboard');
  } catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); } finally { setLoading(false); }
  };

  return (
    <AppShell hideHeader>
      <Heading size="7" mb="4">Parent Login</Heading>
      <Card size="4" style={{ maxWidth:420 }}>
        <form onSubmit={submit}>
          <Flex direction="column" gap="3">
            <label>
              <Text size="2" mb="1" as="div">Email</Text>
              <TextField.Root value={email} onChange={e=> setEmail(e.target.value)} required type="email" autoComplete="email" />
            </label>
            <label>
              <Text size="2" mb="1" as="div">Password</Text>
              <TextField.Root value={password} onChange={e=> setPassword(e.target.value)} required type="password" autoComplete="current-password" />
            </label>
            {error && <Text size="2" color="red">{error}</Text>}
            <Button disabled={loading} type="submit" color="purple">{loading? 'Logging in...':'Login'}</Button>
            <Text size="2" color="gray">Need an account? <Link href="/register">Register</Link></Text>
          </Flex>
        </form>
      </Card>
    </AppShell>
  );
}
