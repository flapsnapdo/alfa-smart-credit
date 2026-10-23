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
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';

export function OfferPage() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  const { amount, term, rate, monthlyPayment, purpose } = useApplicationStore();

  const PURPOSE_LABELS: Record<string, string> = {
    'working-capital': 'Пополнение оборотных средств',
    'equipment': 'Покупка оборудования',
    'expansion': 'Расширение бизнеса',
    'refinancing': 'Рефинансирование',
    'inventory': 'Закупка товара',
  };

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => navigate('/client/signing'), 1500);
  };

  const handleDecline = () => {
    setDeclined(true);
  };

  if (declined) {
    return (
      <Container size="md" py={40}>
        <Alert color="red" title="Оферта отклонена" mb="lg">
          <Text mb="md">Вы отклонили условия кредитования. Вы можете подать новую заявку.</Text>
          <Button onClick={() => navigate('/client/product-select')}>
            Подать новую заявку
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Оферта</Title>
      <Text c="dimmed" ta="center" mb={40}>
        Ознакомьтесь с условиями кредитования
      </Text>

      {accepted && (
        <Alert color="green" title="Оферта принята!" mb="lg">
          Переход к подписанию договора...
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Group justify="space-between" mb="md">
          <Title order={4}>Условия кредитования</Title>
          <Badge color="red" size="lg">Предложение банка</Badge>
        </Group>

        <Divider mb="lg" />

        <Stack gap="lg">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Цель кредита</Text>
              <Text fw={600}>{purpose ? PURPOSE_LABELS[purpose] || purpose : 'Не указана'}</Text>
            </div>
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Сумма кредита</Text>
              <Text fw={700} size="xl" color="red">
                {amount.toLocaleString('ru-RU')} ₽
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="sm" c="dimmed">Срок</Text>
              <Text fw={600}>{term} месяцев</Text>
            </div>
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Процентная ставка</Text>
              <Badge color="green" size="lg">{rate}% годовых</Badge>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="sm" c="dimmed">Ежемесячный платёж</Text>
              <Text fw={700} size="xl">
                {monthlyPayment.toLocaleString('ru-RU')} ₽
              </Text>
            </div>
          </Group>

          <Paper p="md" bg="#fff5f5" radius="md" mt="md">
            <Text size="sm" fw={600} mb="xs">Итого к возврату:</Text>
            <Text size="xl" fw={700} color="red">
              {(monthlyPayment * term).toLocaleString('ru-RU')} ₽
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Переплата: {((monthlyPayment * term) - amount).toLocaleString('ru-RU')} ₽
            </Text>
          </Paper>
        </Stack>
      </Card>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={5} mb="md">Условия договора</Title>
        <Stack gap="xs">
          <Text size="sm">• Досрочное погашение без комиссий</Text>
          <Text size="sm">• Возможность реструктуризации долга</Text>
          <Text size="sm">• Страхование не является обязательным</Text>
          <Text size="sm">• Обеспечение: поручительство директора</Text>
          <Text size="sm">• Штраф за просрочку: 0.1% от суммы платежа в день</Text>
        </Stack>
      </Card>

      <Group>
        <Button
          size="lg"
          color="green"
          onClick={handleAccept}
          disabled={accepted}
          loading={accepted}
          style={{ flex: 1 }}
        >
          Принять оферту
        </Button>
        <Button
          size="lg"
          variant="outline"
          color="red"
          onClick={handleDecline}
          disabled={accepted}
          style={{ flex: 1 }}
        >
          Отклонить
        </Button>
      </Group>

      <Group justify="center" mt="md">
        <Button variant="subtle" onClick={() => navigate('/client/documents')}>
          Назад к документам
        </Button>
      </Group>
    </Container>
  );
}