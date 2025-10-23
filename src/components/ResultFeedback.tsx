import { Box, Callout } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';

interface ResultFeedbackProps {
  lastAnswerCorrect: boolean | null;
  question: {
    num1: number;
    num2: number;
    answer: number;
  };
}

export function ResultFeedback({ lastAnswerCorrect, question }: ResultFeedbackProps) {
  return (
    <Box>
      {lastAnswerCorrect === null ? (
        // Learning mode for large numbers
        <Callout.Root 
          color="blue" 
          variant="soft"
        >
          <Callout.Icon>
            <LightningBoltIcon />
          </Callout.Icon>
          <Callout.Text>
            This is a learning example with a large answer:
          </Callout.Text>
        </Callout.Root>
      ) : (
        // Normal quiz mode
        <Callout.Root 
          color={lastAnswerCorrect ? 'green' : 'red'} 
          variant="soft"
        >
          <Callout.Icon>
            {lastAnswerCorrect ? <CheckCircledIcon /> : <CrossCircledIcon />}
          </Callout.Icon>
          <Callout.Text>
            {lastAnswerCorrect 
              ? 'Correct! Well done!' 
              : 'Incorrect. Here is the correct answer:'
            }
          </Callout.Text>
        </Callout.Root>
      )}
      
      {(lastAnswerCorrect === false || lastAnswerCorrect === null) && (
        <Box 
          mt="3"
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.8rem',
            textAlign: 'center',
            lineHeight: '1.2',
            padding: '0.8rem',
            border: lastAnswerCorrect === null ? '2px solid var(--blue-6)' : '2px solid var(--red-6)',
            borderRadius: '8px',
            backgroundColor: lastAnswerCorrect === null ? 'var(--blue-1)' : 'var(--red-1)'
          }}
        >
          <div style={{ marginBottom: '0.3rem' }}>
            {question.num1.toLocaleString()}
          </div>
          <div style={{ 
            borderBottom: lastAnswerCorrect === null ? '2px solid var(--blue-8)' : '2px solid var(--red-8)', 
            paddingBottom: '0.3rem',
            marginBottom: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span>+</span>
            <span>{question.num2.toLocaleString()}</span>
          </div>
          <div style={{ color: lastAnswerCorrect === null ? 'var(--blue-10)' : 'var(--red-10)', fontWeight: 'bold' }}>
            {question.answer.toLocaleString()}
          </div>
        </Box>
      )}
    </Box>
  );
}