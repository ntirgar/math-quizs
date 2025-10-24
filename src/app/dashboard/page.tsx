"use client";
import { AppShell } from '@/components/AppShell';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { Card, Flex, Heading, Text, Box } from '@radix-ui/themes';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AppShell>
      <Text size="3" mb="5" color="gray">Jump into a practice mode or review your growth analytics.</Text>
      <ProgressDashboard />
      <Flex mt="6" gap="4" wrap="wrap">
        <Card size="2" style={{ flex:'1 1 280px' }}>
          <Heading size="4" mb="2">Next Steps</Heading>
            <Text size="2" color="gray">Select an operation to begin adaptive practice or visit Growth to see detailed mistake analysis.</Text>
            <Flex mt="3" gap="2" wrap="wrap">
              <Link href="/addition" className="link-button">Addition</Link>
              <Link href="/subtraction" className="link-button">Subtraction</Link>
              <Link href="/multiplication" className="link-button link-button--purple">Multiplication</Link>
              <Link href="/division" className="link-button">Division</Link>
              <Link href="/growth" className="link-button">Growth & Analysis</Link>
              <Link href="/settings" className="link-button">Settings</Link>
            </Flex>
        </Card>
      </Flex>
      <Box mt="6">
        <Text size="1" color="gray">Subtraction & Division practice active. More mastery analytics coming soon.</Text>
      </Box>
    </AppShell>
  );
}
