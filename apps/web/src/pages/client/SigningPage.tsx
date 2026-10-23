import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  Badge,
  Alert,
  Divider,
  Paper,
  PinInput,
  Box,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';
import { IconCheck } from '@tabler/icons-react';

export function SigningPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { amount, term, rate, monthlyPayment, applicationNumber } = useApplicationStore();

  const handleSign = () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError(null);

    // Имитация подписания
    setTimeout(() => {
      setSigned(true);
      setLoading(false);
    }, 1500);
  };

  if (signed) {
    return (
      <Container size="md" py={40}>
        <Card shadow="sm" padding="xl" radius="md" withBorder ta="center">
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#d3f9d8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <IconCheck size={40} color="#2b8a3e" />
          </div>
          <Title order={3} mb={10} style={{ color: '#2b8a3e' }}>
            Договор подписан!
            </Title>
          <Text c="dimmed" mb="xl">
            Договор №{applicationNumber || 'ЗК-2026-000123'} от {new Date().toLocaleDateString('ru-RU')}
          </Text>

          <Paper p="md" bg="#f8f9fa" radius="md" mb="xl">
            <Text size="sm" c="dimmed" mb="xs">
              Сумма кредита
            </Text>
            <Text fw={700} size="xl" color="red">
              {amount.toLocaleString('ru-RU')} ₽
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Срок: {term} месяцев • Ставка: {rate}%
            </Text>
          </Paper>

          <Alert color="blue" mb="xl">
            <Text size="sm">
              Деньги будут перечислены на расчётный счёт в течение 1-2 рабочих дней.
              Мы отправим уведомление на вашу почту.
            </Text>
          </Alert>

          <Button
            size="lg"
            color="red"
            onClick={() => navigate('/client/dashboard')}
            fullWidth
          >
            Перейти в кабинет
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Подписание договора
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Введите код из СМС для подписания договора
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">
          Договор №{applicationNumber || 'ЗК-2026-000123'}
        </Title>

        <Stack gap="sm" mb="lg">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Сумма
            </Text>
            <Text fw={600}>
              {amount.toLocaleString('ru-RU')} ₽
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Срок
            </Text>
            <Text fw={600}>{term} месяцев</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Ставка
            </Text>
            <Badge color="green">{rate}% годовых</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Платёж
            </Text>
            <Text fw={700}>
              {monthlyPayment.toLocaleString('ru-RU')} ₽/мес
            </Text>
          </Group>
        </Stack>

        <Divider mb="lg" />

        <Paper p="md" bg="#fff5f5" radius="md">
          <Text size="sm" fw={600} mb="xs">
            Код отправлен на +7 (9**) ***-**-12
          </Text>
          <Text size="xs" c="dimmed">
            Код действителен в течение 10 минут
          </Text>
        </Paper>
      </Card>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40} ta="center">
        <Text fw={600} mb="md">
          Введите код подтверждения
        </Text>
        <Box mb="md">
          <PinInput
            length={6}
            value={code}
            onChange={setCode}
            type="number"
            placeholder="○"
            size="lg"
            style={{ justifyContent: 'center' }}
          />
        </Box>
        <Text size="xs" c="dimmed">
          Для демонстрации введите любые 6 цифр
        </Text>
      </Card>

      <Button
        size="lg"
        color="red"
        onClick={handleSign}
        loading={loading}
        disabled={code.length !== 6}
        fullWidth
      >
        Подписать договор
      </Button>

      <Group justify="center" mt="md">
        <Button variant="subtle" onClick={() => navigate('/client/offer')}>
          Назад к оферте
        </Button>
      </Group>
    </Container>
  );
}