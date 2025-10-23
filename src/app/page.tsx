"use client";
import { AppShell } from '@/components/AppShell';
import { Card, Heading, Text, Flex, Box, Button, Separator } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RootLanding() {
	const [userCount, setUserCount] = useState<number|null>(null);
	useEffect(()=> { (async ()=> { try { const res = await fetch('/api/auth/stats'); const data = await res.json(); setUserCount(data.userCount); } catch {} })(); }, []);
	return (
		<AppShell hideHeader>
			<div className="landing-hero">
				{/* Decorative floating math symbols */}
				<div className="float-symbol sym-plus">+</div>
				<div className="float-symbol sym-minus">−</div>
				<div className="float-symbol sym-times">×</div>
				<div className="float-symbol sym-divide">÷</div>
				<div className="hero-content">
					<Heading size="8" mb="4" className="gradient-title">Maths Wizard AI</Heading>
					<Text size="3" mb="6" className="hero-sub">
						Adaptive maths mastery platform. Each digit you enter becomes a learning signal: fact fluency, place value stability, borrowing proficiency, table recall & division strength. Our engine responds instantly with the optimal next challenge.
					</Text>
					<Flex gap="4" mb="7" wrap="wrap" align="center">
						<Button asChild size="4" color="purple"><Link href="/register">Get Started Free</Link></Button>
						<Button asChild size="4" variant="surface"><Link href="/login">Parent Login</Link></Button>
						<Button asChild size="4" variant="outline"><Link href="/addition">Try Demo Practice</Link></Button>
						{userCount !== null && <Button variant="ghost" size="3" disabled>{userCount} demo account{userCount===1?'':'s'}</Button>}
					</Flex>
					<Flex gap="3" mb="8" wrap="wrap" className="pill-row">
						<BadgeLike>Real-time Attempt Scoring</BadgeLike>
						<BadgeLike>Misconception Classification</BadgeLike>
						<BadgeLike>Dynamic Stage Promotion</BadgeLike>
						<BadgeLike>Unified Timeline</BadgeLike>
						<BadgeLike>Privacy-Friendly</BadgeLike>
					</Flex>
				</div>
			</div>
			<Separator size="4" mb="6" />
			<Heading size="6" mb="5">Why This AI Works</Heading>
			<Flex gap="4" wrap="wrap" mb="8">
				<Card size="4" className="feature-card">
					<Heading size="4" mb="2">Adaptive Staging</Heading>
					<Text size="2" color="gray">Promotion when accuracy, streak & coverage converge—no manual level selection.</Text>
				</Card>
				<Card size="4" className="feature-card">
					<Heading size="4" mb="2">Mistake Insight Engine</Heading>
					<Text size="2" color="gray">Classifies misconception types to shape targeted remediation pathways.</Text>
				</Card>
				<Card size="4" className="feature-card">
					<Heading size="4" mb="2">Unified Attempt Graph</Heading>
					<Text size="2" color="gray">Cross-operation analytics reveals mastery gradients & retention dips.</Text>
				</Card>
				<Card size="4" className="feature-card">
					<Heading size="4" mb="2">Data Minimization</Heading>
					<Text size="2" color="gray">Only parent email retained. Learning signals—never personal profiles.</Text>
				</Card>
			</Flex>
			<Box mt="4" mb="2">
				<Text size="1" color="gray">Demo environment, credentials stored locally (data/users.json). Use throwaway email.</Text>
			</Box>
		</AppShell>
	);
}

function BadgeLike({ children }: { children: React.ReactNode }) {
	return (
		<Box style={{
			background:'var(--gray-3)',
			border:'1px solid var(--gray-6)',
			padding:'6px 10px',
			borderRadius:999,
			fontSize:'0.7rem',
			fontWeight:500,
			letterSpacing:'0.5px'
		}}>{children}</Box>
	);
}
