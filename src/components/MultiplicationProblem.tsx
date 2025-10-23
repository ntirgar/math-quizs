import { Box, Text } from '@radix-ui/themes';
import { NumberDisplay } from './NumberDisplay';
import { OperatorDisplay } from './OperatorDisplay';
import React from 'react';

interface MultiplicationProblemProps {
  a: number;
  b: number;
  children?: React.ReactNode;
}

export function MultiplicationProblem({ a, b, children }: MultiplicationProblemProps) {
  const aLen = String(a).length;
  const bLen = String(b).length;
  const productLen = String(a * b).length;
  const maxDigits = Math.max(aLen, bLen, productLen);

  return (
    <Box className="math-problem-container" style={{ display:'flex', justifyContent:'center', width:'100%', padding:'0 1rem' }}>
      <Box className="math-problem-wrapper">
        <Text size="3" align="center" color="gray" mb="3" className="math-problem-question">
          Solve this multiplication problem:
        </Text>
        <Box className="math-problem-content">
          <Box className="math-problem-row">
            <OperatorDisplay showBlank={true} />
            <NumberDisplay value={a} variant="default" maxDigits={maxDigits} />
          </Box>
          <Box className="math-problem-row math-problem-addend">
            <OperatorDisplay character="×" />
            <NumberDisplay value={b} variant="addend" maxDigits={maxDigits} />
          </Box>
          <Box style={{ marginTop:'var(--spacing)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <OperatorDisplay character="=" />
            {children ? <Box style={{ display:'flex', alignItems:'center' }}>{children}</Box> : <Box className="math-problem-result">?</Box>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}