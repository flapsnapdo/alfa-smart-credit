import {
  Container,
  Title,
  Text,
  Paper,
  Stepper,
  Button,
  Group,
  Card,
  Badge,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function StatusPage() {
  const navigate = useNavigate();

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Статус заявки
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Ваша заявка отправлена и находится на рассмотрении
      </Text>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Group justify="space-between" mb="md">
          <Title order={4}>Заявка №ЗК-2026-000123</Title>
          <Badge color="yellow" size="lg">На рассмотрении</Badge>
        </Group>

        <Stepper active={1} orientation="vertical" mt="xl">
          <Stepper.Step label="Заявка создана" description="22.10.2026, 10:00" />
          <Stepper.Step label="Отправлена на проверку" description="22.10.2026, 10:05" />
          <Stepper.Step label="Проверка документов" description="Ожидание" />
          <Stepper.Step label="Решение" description="Ожидание" />
        </Stepper>
      </Card>

      <Text c="dimmed" ta="center" mb="md">
        Обычно рассмотрение занимает 1-3 рабочих дня. Мы уведомим вас о решении.
      </Text>

      <Group justify="center">
        <Button variant="outline" onClick={() => navigate('/client/dashboard')}>
          Перейти в кабинет
        </Button>
      </Group>
    </Container>
  );
}