import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  NumberInput,
  Badge,
  Paper,
  Alert,
  Loader,
} from '@mantine/core';
import { IconWallet, IconTools, IconPackage, IconDots } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { PURPOSES, months, rub } from '../../lib/format';
import type { Purpose, Recommendation } from '../../lib/types';
import { useApplicationStore } from '../../store/applicationStore';

const ICONS: Record<Purpose, { icon: typeof IconWallet; color: string }> = {
  CASH_GAP: { icon: IconWallet, color: '#1971c2' },
  WORKING_CAPITAL: { icon: IconPackage, color: '#c92a2a' },
  EQUIPMENT: { icon: IconTools, color: '#2b8a3e' },
  OTHER: { icon: IconDots, color: '#862e9c' },
};

export function ProductSelectPage() {
  const navigate = useNavigate();
  const draft = useApplicationStore();

  const [purpose, setPurpose] = useState<Purpose | null>(draft.purpose);
  const [amount, setAmount] = useState<number>(draft.amountRub);
  const [term, setTerm] = useState<number>(draft.term);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Подбор продукта и расчёт платежа — на стороне банка, с небольшой задержкой после ввода
  useEffect(() => {
    if (!purpose || amount <= 0 || term <= 0) return;
    setLoading(true);
    const timer = setTimeout(() => {
      api.recommend(purpose, Math.round(amount * 100), Math.min(term, 60))
        .then((r) => { setRecommendation(r); setError(null); })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [purpose, amount, term]);

  const product = recommendation?.recommended;
  const adjusted = recommendation && (recommendation.amount !== Math.round(amount * 100) || recommendation.term !== term);

  const handleContinue = () => {
    if (!purpose || !recommendation) return;
    // Если сумма или срок вне лимитов продукта, банк уже скорректировал их — продолжаем с ними
    draft.setProduct(purpose, recommendation.amount / 100, recommendation.term, recommendation);
    navigate('/client/company');
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Для чего вам деньги?
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Подберём продукт под вашу задачу и покажем примерный платёж
      </Text>

      <Stack gap="md" mb={40}>
        {PURPOSES.map((p) => {
          const { icon: Icon, color } = ICONS[p.value];
          const selected = purpose === p.value;
          return (
            <Card
              key={p.value}
              shadow="sm"
              padding="xl"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                border: selected ? '2px solid #EF3124' : '1px solid #dee2e6',
                background: selected ? '#fff5f5' : 'white',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setPurpose(p.value)}
            >
              <Group>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title order={5} mb={5}>{p.title}</Title>
                  <Text size="sm" c="dimmed">{p.description}</Text>
                </div>
                {selected && <Badge color="red" size="lg">✓</Badge>}
              </Group>
            </Card>
          );
        })}
      </Stack>

      {purpose && (
        <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="lg">
            Сколько и на какой срок
          </Title>
          <Group grow align="flex-start">
            <NumberInput
              label="Сумма"
              value={amount}
              onChange={(val) => setAmount(Number(val || 0))}
              min={0}
              step={50_000}
              thousandSeparator=" "
              suffix=" ₽"
              description={product ? `${rub(product.minAmount)} – ${rub(product.maxAmount)}` : undefined}
            />
            <NumberInput
              label="Срок"
              value={term}
              onChange={(val) => setTerm(Number(val || 0))}
              min={1}
              max={60}
              suffix=" мес"
              description={product ? `${product.minTerm}–${product.maxTerm} мес` : undefined}
            />
          </Group>

          {error && <Alert color="red" mt="lg">{error}</Alert>}

          {recommendation && product && (
            <Paper mt="xl" p="md" bg="#f8f9fa" radius="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" c="dimmed">Подходит продукт</Text>
                  <Text fw={700} size="lg">{product.name}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {rub(recommendation.amount)} на {months(recommendation.term)} · от {recommendation.rate}% годовых
                  </Text>
                  {recommendation.alternative && (
                    <Text size="xs" c="dimmed" mt={4}>Ещё подойдёт: {recommendation.alternative.name}</Text>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text size="sm" c="dimmed">{product.annuity ? 'Примерный платёж' : 'Проценты в месяц'}</Text>
                  <Group gap={6} justify="flex-end">
                    {loading && <Loader size="xs" />}
                    <Text fw={700} size="xl" c="red">{rub(recommendation.monthlyPayment)}</Text>
                  </Group>
                </div>
              </Group>
              {adjusted && (
                <Alert color="yellow" mt="md" p="xs">
                  У продукта «{product.name}» другие лимиты — посчитали для {rub(recommendation.amount)} на {months(recommendation.term)}
                </Alert>
              )}
              <Text size="xs" c="dimmed" mt="sm">{recommendation.note}</Text>
            </Paper>
          )}
        </Paper>
      )}

      <Button
        fullWidth
        size="lg"
        disabled={!purpose || !recommendation || loading}
        onClick={handleContinue}
        color="red"
      >
        Продолжить
      </Button>
    </Container>
  );
}
