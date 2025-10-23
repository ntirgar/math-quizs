import { Box, Heading, Text, Flex, Button, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { usePathname } from 'next/navigation';

// Lightweight header augmentation: adaptive mode toggle & summary

export function AppHeader() {
  const pathname = usePathname();
  const isGrowth = pathname === '/growth';
  const isMultiplication = pathname?.startsWith('/multiplication');
  const isAddition = pathname === '/addition';
  const isSubtraction = pathname === '/subtraction';
  const isDivision = pathname === '/division';
  const isSettings = pathname === '/settings';
  const isDashboard = pathname === '/';
  // Global product name replaces per-page title emphasis.
  const productName = 'Maths Wizard';
  const pageTitle = isDashboard
    ? 'Dashboard'
    : isGrowth
      ? 'Growth & Learning'
      : isMultiplication
        ? 'Multiplication Practice'
        : isAddition
          ? 'Addition Practice'
          : isSubtraction
            ? 'Subtraction Practice'
            : isDivision
              ? 'Division Practice'
              : isSettings
                ? 'Settings'
                : 'Maths Wizard';
  const subtitle = 'An AI-powered adaptive maths learning platform helping learners master addition and multiplication through personalized practice, staged progression, and real-time analytics.';

  return (
    <Box mb="6">
      <Flex justify="between" align="center" mb="2" wrap="wrap" gap="3">
        <Box>
          <Flex align="center" gap="3" wrap="wrap">
            <Heading size="8" as="h1" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <LightningBoltIcon width="40" height="40" /> {productName}
            </Heading>
            <Badge size="2" color="purple" variant="soft" style={{ alignSelf:'center' }}>AI Adaptive</Badge>
          </Flex>
          <Text size="2" color="gray" mt="2" weight="medium" style={{ maxWidth:'780px' }}>
            {subtitle}
          </Text>
          <Text size="1" color="gray" mt="1" style={{ fontStyle:'italic' }}>{pageTitle}</Text>
        </Box>
        <Flex gap="2" align="center" wrap="wrap">
          <Button asChild variant={isDashboard ? 'solid' : 'soft'} size="2"><Link href="/">Dashboard</Link></Button>
          <Button asChild variant={isAddition ? 'solid' : 'soft'} size="2"><Link href="/addition">Addition</Link></Button>
          <Button asChild variant={isSubtraction ? 'solid' : 'soft'} size="2"><Link href="/subtraction">Subtraction</Link></Button>
          <Button asChild variant={isMultiplication ? 'solid' : 'soft'} size="2"><Link href="/multiplication">Multiplication</Link></Button>
          <Button asChild variant={isDivision ? 'solid' : 'soft'} size="2"><Link href="/division">Division</Link></Button>
          <Button asChild variant={isGrowth ? 'solid' : 'soft'} size="2"><Link href="/growth">Growth</Link></Button>
          <Button asChild variant={isSettings ? 'solid' : 'soft'} size="2"><Link href="/settings">Settings</Link></Button>
        </Flex>
      </Flex>
      {/* Subtitle moved inside title block; keep layout spacing consistent */}
    </Box>
  );
}