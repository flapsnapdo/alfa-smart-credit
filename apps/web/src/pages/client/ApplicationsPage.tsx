import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Stack,
  Button,
  Group,
  Paper,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    number: 'ЗК-2026-000123',
    status: 'SUBMITTED',
    statusLabel: 'На рассмотрении',
    statusColor: 'yellow',
    amount: '5 000 000 ₽',
    term: '12 месяцев',
    createdAt: '22.10.2026',
  },
  {
    id: 'app-2',
    number: 'ЗК-2026-000089',
    status: 'APPROVED',
    statusLabel: 'Одобрена',
    statusColor: 'green',
    amount: '3 000 000 ₽',
    term: '24 месяца',
    createdAt: '15.10.2026',
  },
];

export function ApplicationsPage() {
  const navigate = useNavigate();

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb={40}>
        <Title>Мои заявки</Title>
        <Button onClick={() => navigate('/client/product-select')}>
          Новая заявка
        </Button>
      </Group>

      <Stack gap="md">
        {MOCK_APPLICATIONS.map((app) => (
          <Card key={app.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={700}>{app.number}</Text>
              <Badge color={app.statusColor}>{app.statusLabel}</Badge>
            </Group>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Сумма</Text>
                <Text fw={500}>{app.amount}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Срок</Text>
                <Text>{app.term}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Создана</Text>
                <Text>{app.createdAt}</Text>
              </div>
            </Group>
            <Button variant="light" fullWidth mt="md">
              Подробнее
            </Button>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}