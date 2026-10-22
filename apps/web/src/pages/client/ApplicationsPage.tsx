import { Container, Title, Text, Card, Badge, Stack, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';

export function ApplicationsPage() {
  const navigate = useNavigate();
  const { applicationNumber, amount, term, purpose } = useApplicationStore();

  const applications = applicationNumber
    ? [{
        id: 'app-1',
        number: applicationNumber,
        status: 'SUBMITTED',
        statusLabel: 'На рассмотрении',
        statusColor: 'yellow',
        amount: `${amount.toLocaleString('ru-RU')} ₽`,
        term: `${term} месяцев`,
        purpose: purpose || 'Не указана',
        createdAt: '22.10.2026',
      }]
    : [];

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb={40}>
        <Title>Мои заявки</Title>
        <Button onClick={() => navigate('/client/product-select')}>Новая заявка</Button>
      </Group>

      {applications.length === 0 ? (
        <Card shadow="sm" padding="lg" radius="md" withBorder ta="center">
          <Text c="dimmed">У вас пока нет заявок</Text>
          <Button mt="md" onClick={() => navigate('/client/product-select')}>
            Создать первую заявку
          </Button>
        </Card>
      ) : (
        <Stack gap="md">
          {applications.map((app) => (
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
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}