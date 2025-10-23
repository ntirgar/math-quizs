"use client";
import { Box, Text } from '@radix-ui/themes';
import { useState, useEffect, useRef } from 'react';

interface DigitSelectorProps {
  digitInputs: string[];
  answerDigitCount: number;
  showResult: boolean;
  onDigitChange: (index: number, value: string) => void;
  questionKey: string; // For forcing re-render
}

export function DigitSelector({ 
  digitInputs, 
  answerDigitCount, 
  showResult, 
  onDigitChange,
  questionKey 
}: DigitSelectorProps) {
  // Calculate digit count (no client-side detection to avoid hydration mismatch)
  const digitCount = Math.min(answerDigitCount, 4);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (openIndex === null) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openIndex]);

  // Close when showing result (lock state)
  useEffect(() => { if (showResult) setOpenIndex(null); }, [showResult]);
  
  // Use CSS-based responsive sizing instead of JavaScript

  return (
    <Box style={{ 
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    }}
    className="digit-selector-container">
      <Text size="2" color="gray" mb="4" align="center">
        Enter your answer by place value:
      </Text>
      
      {/* Place Value Column Layout */}
      <Box style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        width: 'fit-content'
      }}>
        {/* Create columns based on answer digits, max 4 (thousands, hundreds, tens, ones) */}
        <Box 
          className="digit-input-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${digitCount}, 1fr)`,
            gap: '0.5rem',
            justifyContent: 'center',
            alignItems: 'start',
            justifyItems: 'center',
            width: 'fit-content'
          }}
        >
          {/* Place value headers */}
          {Array.from({ length: digitCount }, (_, index) => {
            const placeValueNames = ['thousands', 'hundreds', 'tens', 'ones'];
            const placeIndex = 4 - digitCount + index;
            const isVisible = placeIndex < 4 && answerDigitCount > (3 - placeIndex);
            
            return isVisible ? (
              <Box className="digit-container" key={index}>
                <Text 
                  className="place-value-label"
                  size="2" 
                  color="blue" 
                  align="center" 
                  weight="medium"
                  style={{ 
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {placeValueNames[placeIndex]}
                </Text>
              </Box>
            ) : null;
          })}
          
          {/* Digit input fields with custom grid dropdown */}
          {Array.from({ length: digitCount }, (_, index) => {
            const digitIndex = digitInputs.length - answerDigitCount + index;
            const placeIndex = 4 - digitCount + index;
            const isVisible = placeIndex < 4 && answerDigitCount > (3 - placeIndex);
            
            const currentValue = digitInputs[digitIndex];
            // Treat '0' as a valid value (previously falsy checks caused it to disappear)
            const hasValue = currentValue !== '' && currentValue !== null && currentValue !== undefined;
            const displayValue = hasValue ? String(currentValue) : undefined;
            
            return isVisible ? (
              <Box 
                key={`input-${digitIndex}-${questionKey}`}
                style={{ position: 'relative', width: '64px' }}
              >
                <Box
                  onClick={() => { if (!showResult) setOpenIndex(openIndex === digitIndex ? null : digitIndex); }}
                  className={`digit-selector-trigger digit-box ${hasValue ? 'digit-selected' : 'digit-empty'}`}
                  style={{
                    cursor: showResult ? 'not-allowed' : 'pointer',
                    border: hasValue ? '2px solid var(--blue-7)' : '2px solid var(--gray-6)',
                    backgroundColor: showResult ? 'var(--gray-2)' : hasValue ? 'var(--blue-2)' : 'var(--gray-1)',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    color: hasValue ? 'var(--blue-12)' : 'var(--gray-9)',
                    transform: hasValue ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: hasValue ? '0 2px 8px rgba(0, 100, 200, 0.2)' : 'none',
                    fontSize: '1.5rem',
                    fontFamily: 'monospace',
                    width: '100%',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px'
                  }}
                >
                  {hasValue ? displayValue : '?'}
                </Box>
                {openIndex === digitIndex && !showResult && (
                  <Box
                    ref={menuRef}
                    style={{
                      position: 'absolute',
                      top: '72px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--gray-1)',
                      border: '2px solid var(--gray-6)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      padding: '12px',
                      zIndex: 80,
                      width: '280px'
                    }}
                  >
                    <Box
                      className="digit-options-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                      }}
                    >
                      {[0,1,2,3,4,5,6,7,8,9].map(d => (
                        <Box
                          key={d}
                          onClick={() => { onDigitChange(digitIndex, String(d)); setOpenIndex(null); }}
                          style={{
                            fontSize: '1.5rem',
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            padding: '14px',
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            background: 'var(--gray-2)',
                            border: '2px solid var(--gray-4)',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all .15s ease'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.07)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                        >
                          {d}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : null;
          })}
        </Box>
        
        {/* Show a note if answer is longer than 4 digits */}
        {answerDigitCount > 4 && (
          <Box>
            <Text size="1" color="orange" align="center" style={{ fontStyle: 'italic' }}>
              This answer has {answerDigitCount} digits. Using simplified 4-digit layout.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}