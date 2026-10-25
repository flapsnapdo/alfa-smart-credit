import { useEffect, useState } from 'react';
import { Badge, Card, Group, List, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBulb, IconCheck, IconMinus } from '@tabler/icons-react';
import { api } from '../lib/apiClient';
import { GRADE_COLORS, GRADE_RISK } from '../lib/format';
import type { Application, Explanation } from '../lib/types';

/** «Почему такое решение и что можно улучшить» — из тех же данных, что видел скоринг */
export function ExplanationCard({ application }: { application: Application }) {
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  useEffect(() => {
    // Объяснение появляется вместе с решением; до него API отвечает 404 — блок не показываем
    api.explanation(application.id).then(setExplanation).catch(() => setExplanation(null));
  }, [application.id, application.status]);

  if (!explanation) return null;

  // Отказ по стоп-фактору (например, компания ликвидирована): балл не решал, поэтому его не показываем
  const stopFactor = application.decision?.type === 'REJECT' && explanation.grade !== 'D' && explanation.strengths.length === 0;

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
      <Group justify="space-between" mb="md">
        <Title order={4}>Почему такое решение</Title>
        {!stopFactor && (
          <Group gap="xs">
            <Text fw={700}>{explanation.score} баллов из 1000</Text>
            <Badge color={GRADE_COLORS[explanation.grade]} size="lg">
              Рейтинг {explanation.grade} · {GRADE_RISK[explanation.grade].toLowerCase()}
            </Badge>
          </Group>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        {explanation.strengths.length > 0 && (
          <div>
            <Text fw={600} mb="xs">Что в вашу пользу</Text>
            <List spacing={6} size="sm" icon={<ThemeIcon color="green" size={20} radius="xl"><IconCheck size={14} /></ThemeIcon>}>
              {explanation.strengths.map((s) => <List.Item key={s}>{s}</List.Item>)}
            </List>
          </div>
        )}
        {explanation.weaknesses.length > 0 && (
          <div>
            <Text fw={600} mb="xs">{stopFactor ? 'Причина' : 'Что снижает оценку'}</Text>
            <List spacing={6} size="sm" icon={<ThemeIcon color="red" size={20} radius="xl"><IconMinus size={14} /></ThemeIcon>}>
              {explanation.weaknesses.map((s) => <List.Item key={s}>{s}</List.Item>)}
            </List>
          </div>
        )}
      </SimpleGrid>

      {explanation.hints.length > 0 && (
        <>
          <Text fw={600} mt="xl" mb="xs">Что можно сделать</Text>
          <List spacing={6} size="sm" icon={<ThemeIcon color="yellow" size={20} radius="xl"><IconBulb size={14} /></ThemeIcon>}>
            {explanation.hints.map((h) => (
              <List.Item key={h.code}>
                {h.text}
                {h.points ? <Text span c="dimmed"> — +{h.points} баллов к оценке</Text> : null}
              </List.Item>
            ))}
          </List>
        </>
      )}
    </Card>
  );
}
