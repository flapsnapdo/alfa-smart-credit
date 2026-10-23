import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Group,
  Button,
  Stack,
  Paper,
  Divider,
  Grid,
  Alert,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';

const PURPOSE_LABELS: Record<string, string> = {
  'working-capital': 'Пополнение оборотных средств',
  'equipment': 'Покупка оборудования',
  'expansion': 'Расширение бизнеса',
  'refinancing': 'Рефинансирование',
  'inventory': 'Закупка товара',
};

export function A2() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/v1/analyst/applications/' + id);
      const data = await res.json();
      setApplication(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!application) {
    return (
      <Container size="md" py={40}>
        <Text ta="center">Загрузка...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py={40}>
      <Group mb="md" justify="space-between">
        <div>
          <Title order={2}>Заявка {application.number}</Title>
          <Text c="dimmed">{application.companyName}</Text>
        </div>
        <Button variant="outline" onClick={() => navigate('/analyst/dashboard')}>
          ← Назад к списку
        </Button>
      </Group>

      <Grid>
        {/* Основная информация */}
        <Grid.Col span={8}>
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Параметры заявки</Title>
            <Stack gap="md">
              <Group justify="space-between">
                <Text c="dimmed">Сумма кредита</Text>
                <Text fw={700} size="lg">{application.amount.toLocaleString('ru-RU')} ₽</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Срок</Text>
                <Text fw={600}>{application.term} месяцев</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Цель</Text>
                <Badge color="blue">{PURPOSE_LABELS[application.purpose] || application.purpose}</Badge>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Дата подачи</Text>
                <Text>{new Date(application.createdAt).toLocaleDateString('ru-RU')}</Text>
              </Group>
            </Stack>
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Данные компании</Title>
            <Stack gap="md">
              <Group justify="space-between">
                <Text c="dimmed">Название</Text>
                <Text fw={600}>{application.companyName}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">ИНН</Text>
                <Text>{application.inn}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">ОГРН</Text>
                <Text>{application.ogrn}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Директор</Text>
                <Text>{application.directorName}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Адрес</Text>
                <Text>{application.address}</Text>
              </Group>
            </Stack>
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Title order={4} mb="md">Финансовые показатели</Title>
            <Grid>
              <Grid.Col span={6}>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Выручка</Text>
                  <Text fw={700} size="lg">{application.revenue.toLocaleString('ru-RU')} ₽</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Прибыль</Text>
                  <Text fw={700} size="lg">{application.profit.toLocaleString('ru-RU')} ₽</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Долговая нагрузка</Text>
                  <Text fw={700} size="lg">{application.debt.toLocaleString('ru-RU')} ₽</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Сотрудники</Text>
                  <Text fw={700} size="lg">{application.employees} чел.</Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>

        {/* Боковая панель */}
        <Grid.Col span={4}>
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md" ta="center">Скоринг</Title>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: application.score >= 70 ? '#d3f9d8' : application.score >= 50 ? '#fff3bf' : '#ffc9c9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Text fw={700} size="xl" style={{ color: Number(application.score) >= 70 ? '#2b8a3e' : Number(application.score) >= 50 ? '#f08c00' : '#c92a2a' }}>
  {application.score}
</Text>
            </div>
            <Text ta="center" size="sm" c="dimmed">
              {application.score >= 70 ? 'Низкий риск' : application.score >= 50 ? 'Средний риск' : 'Высокий риск'}
            </Text>
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={5} mb="md">Статус</Title>
            <Badge
              color={application.status === 'SUBMITTED' ? 'blue' : 'yellow'}
              size="lg"
              fullWidth
            >
              {application.status === 'SUBMITTED' ? 'Новая заявка' : 'На проверке'}
            </Badge>
          </Card>

          <Button
            fullWidth
            size="lg"
            color="red"
            onClick={() => navigate(`/analyst/application/${id}/decision`)}
          >
            Принять решение
          </Button>
        </Grid.Col>
      </Grid>
    </Container>
  );
}