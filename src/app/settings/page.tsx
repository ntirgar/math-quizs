"use client";
import { AppShell } from '@/components/AppShell';
import { Card, Heading, Text, Flex, Switch, Button } from '@radix-ui/themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState<boolean>(false);

  useEffect(() => {
    const a = localStorage.getItem('audioEnabled');
    if (a != null) setAudioEnabled(a === 'true');
    const ad = localStorage.getItem('adaptiveMode');
    if (ad != null) setAdaptiveEnabled(ad === 'true');
  }, []);

  const persist = (key: string, value: boolean) => {
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new CustomEvent('ls-update',{ detail:{ key } }));
  };

  const clearAllData = () => {
    const keys = [
      'attempts','mistakes','progress','subskillProgress','addition_stage','single_digit_stats',
      'mult_attempts','mult_mistakes','mult_progress','mult_subskills','mult_stage','mult_tables_progress','mult_table_index',
      'sub_attempts','div_attempts'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent('ls-update',{ detail:{ key:'bulk-clear' } }));
  };

  return (
    <AppShell>
      <Heading size="6" mb="3">Settings</Heading>
      <Flex direction="column" gap="4" mt="2">
        <Card size="3">
          <Heading size="5" mb="3">Preferences</Heading>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Text>Audio Feedback</Text>
              <Switch checked={audioEnabled} onCheckedChange={(v)=> { setAudioEnabled(!!v); persist('audioEnabled', !!v); }} />
            </Flex>
            <Flex align="center" justify="between">
              <Text>Adaptive Mode (Addition / Multiplication)</Text>
              <Switch checked={adaptiveEnabled} onCheckedChange={(v)=> { setAdaptiveEnabled(!!v); persist('adaptiveMode', !!v); persist('mult_adaptive', !!v); }} />
            </Flex>
            <Flex align="center" justify="between">
              <Text>Theme</Text>
              <ThemeToggle />
            </Flex>
          </Flex>
        </Card>
        <Card size="3">
          <Heading size="5" mb="3">Data Management</Heading>
          <Text size="2" color="gray" mb="3">Clear all saved progress, attempts, and mistake history. This cannot be undone.</Text>
          <Button color="red" variant="solid" onClick={clearAllData}>Reset All Local Data</Button>
        </Card>
      </Flex>
    </AppShell>
  );
}
