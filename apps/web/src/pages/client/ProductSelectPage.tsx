import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  SimpleGrid,
  Card,
  Slider,
  Group,
  Button,
  Stack,
  Badge,
  Box,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';

// Цели кредита (плитки)
const LOAN_PURPOSES = [
  { id: 'working-capital', label: 'Пополнение оборотных средств', icon: '💰' },
  { id: 'equipment', label: 'Покупка оборудования', icon: '️' },
  { id: 'expansion', label: 'Расширение бизнеса', icon: '📈' },
  { id: 'refinancing', label: 'Рефинансирование', icon: '🔄' },
  { id: 'inventory', label: 'Закупка товара', icon: '📦' },
  { id: 'other', label: 'Другое', icon: '📋' },
];

export function ProductSelectPage() {
  const navigate = useNavigate();
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [amount, setAmount] = useState(1000000); // 1 млн рублей
  const [term, setTerm] = useState(12); // 12 месяцев

  // Простой калькулятор платежа (аннуитет)
  const calculatePayment = () => {
    const annualRate = 0.15; // 15% годовых
    const monthlyRate = annualRate / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                    (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(payment);
  };

  const monthlyPayment = calculatePayment();
  const overpayment = monthlyPayment * term - amount;

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Для чего вам нужны деньги?
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Выберите цель кредита, и мы подберём лучший продукт
      </Text>

      {/* Плитки целей */}
      <SimpleGrid cols={3} spacing="lg" mb={40}>
        {LOAN_PURPOSES.map((purpose) => (
          <Card
            key={purpose.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              border: selectedPurpose === purpose.id ? '2px solid #fa5252' : '1px solid #e9ecef',
              backgroundColor: selectedPurpose === purpose.id ? '#fff5f5' : 'white',
            }}
            onClick={() => setSelectedPurpose(purpose.id)}
          >
            <Box ta="center">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{purpose.icon}</div>
              <Text size="sm" fw={500}>
                {purpose.label}
              </Text>
            </Box>
          </Card>
        ))}
      </SimpleGrid>

      {/* Ползунки суммы и срока */}
      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Stack gap="xl">
          <div>
            <Group justify="space-between" mb={5}>
              <Text fw={500}>Сумма кредита</Text>
              <Badge size="lg" color="red" variant="light">
                {amount.toLocaleString('ru-RU')} ₽
              </Badge>
            </Group>
            <Slider
              min={100000}
              max={10000000}
              step={100000}
              value={amount}
              onChange={setAmount}
              marks={[
                { value: 1000000, label: '1 млн' },
                { value: 5000000, label: '5 млн' },
                { value: 10000000, label: '10 млн' },
              ]}
            />
          </div>

          <div>
            <Group justify="space-between" mb={5}>
              <Text fw={500}>Срок кредита</Text>
              <Badge size="lg" color="red" variant="light">
                {term} мес.
              </Badge>
            </Group>
            <Slider
              min={3}
              max={60}
              step={1}
              value={term}
              onChange={setTerm}
              marks={[
                { value: 12, label: '1 год' },
                { value: 24, label: '2 года' },
                { value: 36, label: '3 года' },
                { value: 60, label: '5 лет' },
              ]}
            />
          </div>
        </Stack>
      </Paper>

      {/* Рекомендуемый продукт и калькулятор */}
      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">
          Рекомендуемый продукт
        </Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={700} size="lg">
                Бизнес-кредит
              </Text>
              <Text size="sm" c="dimmed">
                Оптимально для вашей суммы и срока
              </Text>
            </div>
            <Badge size="lg" color="green">
              15% годовых
            </Badge>
          </Group>
        </Card>

        <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
          <Text fw={500} mb="sm">
            Калькулятор платежа
          </Text>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Ежемесячный платёж
              </Text>
              <Text fw={700} size="xl" color="red">
                {monthlyPayment.toLocaleString('ru-RU')} ₽
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Переплата
              </Text>
              <Text fw={700} size="xl">
                {Math.round(overpayment / 1000).toLocaleString('ru-RU')} тыс. ₽
              </Text>
            </div>
          </Group>
        </div>
      </Paper>

      {/* Кнопка продолжения */}
      <Button
        fullWidth
        size="lg"
        disabled={!selectedPurpose}
        onClick={() => navigate('/client/company')}
      >
        Продолжить
      </Button>
    </Container>
  );
}