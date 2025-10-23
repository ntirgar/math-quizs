import { Box, Text } from '@radix-ui/themes';
import { NumberDisplay } from './NumberDisplay';
import { OperatorDisplay } from './OperatorDisplay';

interface MathProblemProps {
  num1: number;
  num2: number;
  operator?: string; // '+' or '×'
  heading?: string; // Custom heading text
  resultValue?: number; // Optional for dynamic max digit calc when known (e.g., product)
  children?: React.ReactNode; // Answer section (digit selectors or result)
}

export function MathProblem({ num1, num2, operator = '+', heading, resultValue, children }: MathProblemProps) {
  const num1Length = String(num1).length;
  const num2Length = String(num2).length;
  const resLength = typeof resultValue === 'number' ? String(resultValue).length : String(operator === '+' ? num1 + num2 : num1 * num2).length;
  const maxDigits = Math.max(num1Length, num2Length, resLength);

  return (
    <Box 
      className="math-problem-container"
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        padding: '0 1rem'
      } as React.CSSProperties}
    >
      <Box className="math-problem-wrapper">
        <Text 
          size="3" 
          align="center" 
          color="gray" 
          mb="3"
          className="math-problem-question"
        >
          {heading || (operator === '+' ? 'Solve this addition problem:' : 'Solve this multiplication problem:')}
        </Text>
        <Box className="math-problem-content">
          <Box className="math-problem-row">
            <OperatorDisplay showBlank={true} />
            <NumberDisplay 
              value={num1} 
              variant="default"
              maxDigits={maxDigits}
            />
          </Box>
          
          <Box className="math-problem-row math-problem-addend">
            <OperatorDisplay character={operator} />
            <NumberDisplay 
              value={num2} 
              variant="addend"
              maxDigits={maxDigits}
            />
          </Box>
          
          <Box 
            style={{ 
              marginTop: 'var(--spacing)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            <OperatorDisplay character="=" />
            {children ? (
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                {children}
              </Box>
            ) : (
              <Box className="math-problem-result">
                ?
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}