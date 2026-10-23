import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Stepper,
  Group,
  Alert,
  Button,
  Stack,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';
import { apiClient } from '../../lib/apiClient';

export function StatusPage() {
  const navigate = useNavigate();
  const { applicationId, applicationNumber } = useApplicationStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const data = await apiClient.applications.get(applicationId || 'app-1');
      setStatus(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [applicationId]);

  if (loading) {
    return (
      <Container size="md" py={40}>
        <Text ta="center">Загрузка статуса...</Text>
      </Container>
    );
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'COUNTER_OFFER': return 'yellow';
      case 'UNDER_REVIEW': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'Одобрено';
      case 'REJECTED': return 'Отказано';
      case 'COUNTER_OFFER': return 'Контрпредложение';
      case 'UNDER_REVIEW': return 'На проверке';
      default: return 'Отправлено';
    }
  };

  const getStep = (s: string) => {
    switch (s) {
      case 'APPROVED': return 3;
      case 'REJECTED': return 3;
      case 'COUNTER_OFFER': return 3;
      case 'UNDER_REVIEW': return 2;
      default: return 1;
    }
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Статус заявки</Title>
      <Text c="dimmed" ta="center" mb={10}>
        Автообновление каждые 3 секунды
      </Text>
      <Text c="dimmed" ta="center" size="xs" mb={40}>
        Последнее обновление: {lastUpdate.toLocaleTimeString()}
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Group justify="space-between" mb="md">
          <Title order={4}>Заявка №{applicationNumber || 'ЗК-2026-000123'}</Title>
          <Badge color={getStatusColor(status?.status || 'SUBMITTED')} size="lg">
            {getStatusLabel(status?.status || 'SUBMITTED')}
          </Badge>
        </Group>

        <Stepper active={getStep(status?.status || 'SUBMITTED')} orientation="vertical" mt="xl">
          <Stepper.Step label="Заявка создана" description="Отправлена на рассмотрение" />
          <Stepper.Step label="На проверке" description="Аналитик изучает документы" />
          <Stepper.Step label="Решение принято" description="Ожидание" />
        </Stepper>

        {/* ОДОБРЕНО */}
        {status?.status === 'APPROVED' && (
          <Alert color="green" title="Заявка одобрена!" mt="xl">
            <Stack gap="xs" mb="md">
              <Text>Сумма: {status.amount?.toLocaleString('ru-RU')} ₽</Text>
              <Text>Ставка: {status.rate}% годовых</Text>
              <Text>Срок: {status.term} месяцев</Text>
              <Text fw={700}>Платёж: {status.monthlyPayment?.toLocaleString('ru-RU')} ₽/мес</Text>
            </Stack>
            <Button onClick={() => navigate('/client/signing')}>
              Перейти к подписанию
            </Button>
          </Alert>
        )}

        {/* КОНТРПРЕДЛОЖЕНИЕ */}
        {status?.status === 'COUNTER_OFFER' && (
          <Alert color="yellow" title="Контрпредложение от банка" mt="xl">
            <Stack gap="xs" mb="md">
              <Text>Банк предлагает изменить условия:</Text>
              <Text>Сумма: 4 000 000 ₽ (вместо 5 000 000 ₽)</Text>
              <Text>Ставка: 20% (вместо 18%)</Text>
              <Text>Срок: 10 месяцев (вместо 12)</Text>
            </Stack>
            <Group>
              <Button color="green">Принять предложение</Button>
              <Button variant="outline" color="red">Отклонить</Button>
            </Group>
          </Alert>
        )}

        {/* ОТКАЗ */}
        {status?.status === 'REJECTED' && (
          <Alert color="red" title="Заявка отклонена" mt="xl">
            <Text fw={600} mb="sm">Причины отказа:</Text>
            <Stack gap="xs" mb="md">
              <Text>• Недостаточная выручка за последний квартал</Text>
              <Text>• Высокая долговая нагрузка (DTI &gt; 60%)</Text>
              <Text>• Отрицательная динамика финансовых показателей</Text>
            </Stack>
            <Button variant="outline" onClick={() => navigate('/client/product-select')}>
              Подать новую заявку
            </Button>
          </Alert>
        )}
      </Card>

      <Group justify="center">
        <Button variant="outline" onClick={() => navigate('/client/dashboard')}>
          В кабинет
        </Button>
      </Group>
    </Container>
  );
}