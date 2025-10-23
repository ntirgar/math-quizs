import { Card, Heading, ScrollArea, Flex, Text, Badge } from '@radix-ui/themes';

interface Progress {
  [key: string]: number;
}

interface ProgressHistoryProps {
  progress: Progress;
}

export function ProgressHistory({ progress }: ProgressHistoryProps) {
  const progressEntries = Object.entries(progress);

  if (progressEntries.length === 0) {
    return null;
  }

  return (
    <Card size="3" mt="6">
      <Heading size="5" mb="4">Question History</Heading>
      <ScrollArea style={{ height: '200px' }}>
        <Flex direction="column" gap="2">
          {progressEntries
            .sort((a, b) => b[1] - a[1])
            .map(([questionKey, count]) => (
              <Flex key={questionKey} justify="between" align="center">
                <Text size="2">{questionKey.replace('+', ' + ')}</Text>
                <Badge color="green" variant="soft">
                  {count} time{count !== 1 ? 's' : ''} correct
                </Badge>
              </Flex>
            ))
          }
        </Flex>
      </ScrollArea>
    </Card>
  );
}