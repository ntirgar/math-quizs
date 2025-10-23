import { Box, Heading, Flex } from '@radix-ui/themes';
import { DigitBox } from './DigitBox';

export function DigitBoxDemo() {
  return (
    <Box style={{ padding: '2rem' }}>
      <Heading size="5" mb="4">Unified DigitBox Component Demo</Heading>
      
      <Heading size="3" mb="3">Question Numbers (Display Mode)</Heading>
      <Flex gap="3" mb="6" style={{ alignItems: 'flex-end' }}>
        <DigitBox 
          value="9" 
          placeValueLabel="hundreds" 
          variant="default" 
        />
        <DigitBox 
          value="3" 
          placeValueLabel="tens" 
          variant="default" 
        />
        <DigitBox 
          value="3" 
          placeValueLabel="ones" 
          variant="default" 
        />
      </Flex>
      
      <Heading size="3" mb="3">Answer Selection (Interactive Mode)</Heading>
      <Flex gap="3" mb="4" style={{ alignItems: 'flex-end' }}>
        <DigitBox 
          isInteractive={true}
          selectedValue="1"
          placeValueLabel="hundreds"
          onValueChange={(value) => console.log('Selected:', value)}
          questionKey="demo"
        />
        <DigitBox 
          isInteractive={true}
          selectedValue=""
          placeValueLabel="tens"
          onValueChange={(value) => console.log('Selected:', value)}
          questionKey="demo"
        />
        <DigitBox 
          isInteractive={true}
          selectedValue=""
          placeValueLabel="ones"
          onValueChange={(value) => console.log('Selected:', value)}
          questionKey="demo"
        />
      </Flex>
      
      <Box style={{ 
        padding: '1rem', 
        backgroundColor: 'var(--gray-2)', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <Heading size="2" mb="2">Benefits of Unified Component:</Heading>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li><strong>Identical sizing:</strong> Same width, height, and font-size across all breakpoints</li>
          <li><strong>Consistent spacing:</strong> Same gap between digits in both contexts</li>
          <li><strong>Unified styling:</strong> Same border-radius, transitions, and visual hierarchy</li>
          <li><strong>Single source of truth:</strong> One component to maintain for both use cases</li>
          <li><strong>Perfect alignment:</strong> Question and answer digits line up perfectly</li>
        </ul>
      </Box>
    </Box>
  );
}