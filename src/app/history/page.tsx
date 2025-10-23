"use client";
import { Container, Heading, Text, Flex, Button } from '@radix-ui/themes';
import { QuestionHistoryPanel, AppHeader } from '@/components';
import { useQuizLogic } from '@/hooks/useQuizLogic';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { progress, mistakes, loadSpecificQuestion, clearProgressHistory, clearMistakes } = useQuizLogic();
  const router = useRouter();
  return (
    <Container style={{ padding: '2rem 1rem' }}>
      <AppHeader />
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Heading size="6">History & Review</Heading>
        <Button variant="soft" onClick={() => router.push('/')}>Back to Quiz</Button>
      </Flex>
      <Text size="2" color="gray" mb="4">Explore mastered questions and revisit recent mistakes. Click any entry to load it back into the main quiz.</Text>
      <QuestionHistoryPanel 
        progress={progress} 
        mistakes={mistakes}
        onReattempt={(a,b)=> { loadSpecificQuestion(a,b); router.push('/'); }}
        onClearProgress={() => { if (confirm('Clear all mastery history?')) clearProgressHistory(); }}
        onClearMistakes={() => { if (confirm('Clear all recorded mistakes?')) clearMistakes(); }}
      />
    </Container>
  );
}