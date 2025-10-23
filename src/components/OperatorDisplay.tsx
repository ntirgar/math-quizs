import { Box, Text } from '@radix-ui/themes';
import { CSSProperties } from 'react';

interface OperatorDisplayProps {
  character?: string; // Any character to display
  showBlank?: boolean; // Show blank box for alignment
  className?: string;
  style?: CSSProperties;
}

export function OperatorDisplay({ 
  character,
  showBlank = false,
  className,
  style 
}: OperatorDisplayProps) {
  return (
    <Box
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '1em', // Align with digit boxes
        width: '2em', // Fixed width to prevent shifting
        minWidth: '2em', // Ensure consistent width
        marginRight: '0.5em',
        ...style
      }}
    >
      {(character || showBlank) && (
        <Text 
          style={{ 
            fontSize: '2rem',
            color: showBlank ? 'transparent' : 'var(--gray-10)',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            backgroundColor: showBlank ? 'var(--gray-2)' : 'transparent',
            border: showBlank ? '2px dashed var(--gray-4)' : 'none',
            borderRadius: showBlank ? '4px' : '0',
            width: showBlank ? '1.5em' : 'auto',
            height: showBlank ? '1.5em' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {showBlank ? '' : character}
        </Text>
      )}
    </Box>
  );
}