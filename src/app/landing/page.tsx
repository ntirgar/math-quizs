"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Legacy /landing route: redirect permanently to root.
export default function LegacyLandingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
