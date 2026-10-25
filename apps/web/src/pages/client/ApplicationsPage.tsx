import { useEffect, useState } from 'react';
import { Container, Title, Text, Card, Badge, Stack, Button, Group, Alert, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { dateTime, months, rub, statusColor } from '../../lib/format';
import type { ApplicationListItem } from '../../lib/types';
import { useApplicationStore } from '../../store/applicationStore';

export function ApplicationsPage() {
  const navigate = useNavigate();
  const resetDraft = useApplicationStore((s) => s.reset);
  const [applications, setApplications] = useState<ApplicationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.applications().then(setApplications).catch((e) => setError(e.message));
  }, []);

  const newApplication = () => {
    resetDraft();
    navigate('/client/product-select');
  };

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb={10}>
        <Title>Мои заявки</Title>
        <Button onClick={newApplication}>Получить финансирование</Button>
      </Group>
      <Text c="dimmed" mb={40}>Здесь все ваши заявки и их статус</Text>

      {error && <Alert color="red" mb="lg">{error}</Alert>}
      {!applications && !error && <Group justify="center"><Loader /></Group>}

      {applications?.length === 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder ta="center">
          <Text c="dimmed">У вас пока нет заявок</Text>
          <Button mt="md" onClick={newApplication}>
            Создать первую заявку
          </Button>
        </Card>
      )}

      <Stack gap="md">
        {applications?.map((app) => (
          <Card
            key={app.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/client/applications/${app.id}`)}
          >
            <Group justify="space-between" mb="sm">
              <div>
                <Text fw={700}>{app.number}</Text>
                <Text size="sm" c="dimmed">{app.company.name}</Text>
              </div>
              <Badge color={statusColor(app.status)} size="lg">{app.clientView.title}</Badge>
            </Group>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Продукт</Text>
                <Text fw={500}>{app.product.name}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Сумма</Text>
                <Text fw={500}>{rub(app.requested.amount)}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Срок</Text>
                <Text>{months(app.requested.term)}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Обновлена</Text>
                <Text>{dateTime(app.updatedAt)}</Text>
              </div>
            </Group>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
