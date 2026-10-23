import { useState } from 'react';
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
} from '@mantine/core';
import { IconWallet, IconTools, IconChartBar, IconRefresh, IconPackage } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';

const products = [
  {
    code: 'working-capital',
    title: 'Пополнение оборотных средств',
    description: 'Для текущих бизнес-задач и операционной деятельности',
    icon: IconWallet,
    color: '#1971c2',
    rate: 'от 18%',
    amount: 'до 1 млрд ₽',
    term: '3–24 мес',
  },
  {
    code: 'equipment',
    title: 'Покупка оборудования',
    description: 'Для модернизации производства и покупки техники',
    icon: IconTools,
    color: '#2b8a3e',
    rate: 'от 15%',
    amount: 'до 5 млрд ₽',
    term: '12–60 мес',
  },
  {
    code: 'expansion',
    title: 'Расширение бизнеса',
    description: 'Для роста, масштабирования и выхода на новые рынки',
    icon: IconChartBar,
    color: '#f08c00',
    rate: 'от 16%',
    amount: 'до 3 млрд ₽',
    term: '6–36 мес',
  },
  {
    code: 'refinancing',
    title: 'Рефинансирование',
    description: 'Объединение существующих кредитов в один',
    icon: IconRefresh,
    color: '#862e9c',
    rate: 'от 14%',
    amount: 'до 2 млрд ₽',
    term: '12–48 мес',
  },
  {
    code: 'inventory',
    title: 'Закупка товара',
    description: 'Финансирование закупки сырья и товаров',
    icon: IconPackage,
    color: '#c92a2a',
    rate: 'от 17%',
    amount: 'до 500 млн ₽',
    term: '3–18 мес',
  },
];

export function ProductSelectPage() {
  const navigate = useNavigate();
  const setProductData = useApplicationStore((s) => s.setProductData);

  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(5000000);
  const [term, setTerm] = useState<number>(12);

  const monthlyPayment = Math.round((amount * (1 + 0.18 * (term / 12))) / term);

  const handleContinue = () => {
    if (!selectedPurpose) return;
    setProductData(selectedPurpose, amount, term, 18, monthlyPayment);
    navigate('/client/company');
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Выберите цель кредита
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Подберём лучший продукт под ваши задачи
      </Text>
        <Paper shadow="sm" p="xl" radius="md" mb={40} withBorder>
          <Group>
            <div style={{ flex: 1 }}>
              <Title order={3} mb={5}>Добро пожаловать!</Title>
              <Text size="sm" c="dimmed">
                Выберите цель кредита, и мы подберём лучшие условия для вашего бизнеса
              </Text>
            </div>
            <div style={{ fontSize: 48, opacity: 0.3 }}>💼</div>
          </Group>
        </Paper>
      <Stack gap="md" mb={40}>
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <Card
              key={product.code}
              shadow="sm"
              padding="xl"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                border:
                  selectedPurpose === product.code
                    ? '2px solid #EF3124'
                    : '1px solid #dee2e6',
                background:
                  selectedPurpose === product.code ? '#fff5f5' : 'white',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setSelectedPurpose(product.code)}
            >
              <Group>
                  <Group mt="md" gap="xs">
    <Badge variant="light" color={product.color} size="sm">
      {product.rate}
    </Badge>
    <Badge variant="light" color={product.color} size="sm">
      {product.amount}
    </Badge>
    <Badge variant="light" color={product.color} size="sm">
      {product.term}
    </Badge>
  </Group>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `${product.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={product.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title order={5} mb={5}>
                    {product.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {product.description}
                  </Text>
                </div>
                {selectedPurpose === product.code && (
                  <Badge color="red" size="lg">
                    ✓
                  </Badge>
                )}
              </Group>
            </Card>
          );
        })}
      </Stack>

      {selectedPurpose && (
        <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="lg">
            Параметры кредита
          </Title>
          <Stack>
            <NumberInput
              label="Сумма кредита"
              placeholder="Введите сумму"
              value={amount}
              onChange={(val) => setAmount(Number(val || 0))}
              min={100000}
              max={1000000000}
              thousandSeparator=" "
              suffix=" ₽"
              required
            />
            <NumberInput
              label="Срок кредита"
              placeholder="Введите срок"
              value={term}
              onChange={(val) => setTerm(Number(val || 0))}
              min={3}
              max={60}
              suffix=" мес"
              required
            />
          </Stack>

          <Paper mt="xl" p="md" bg="#f8f9fa" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  Примерный платёж
                </Text>
                <Text fw={700} size="xl" color="red">
                  {monthlyPayment.toLocaleString('ru-RU')} ₽/мес
                </Text>
              </div>
              <Text size="sm" c="dimmed">
                Ставка от 18% годовых
              </Text>
            </Group>
          </Paper>
        </Paper>
      )}

      <Button
        fullWidth
        size="lg"
        disabled={!selectedPurpose || amount < 100000 || term < 3}
        onClick={handleContinue}
        color="red"
      >
        Продолжить
      </Button>
    </Container>
  );
}