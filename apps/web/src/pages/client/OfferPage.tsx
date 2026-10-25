import { useEffect, useState } from 'react';
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
  Loader,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { months, rub } from '../../lib/format';
import type { Application, Offer } from '../../lib/types';

export function OfferPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [app, setApp] = useState<Application | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.application(id).then(setApp).catch((e) => setError(e.message));
  }, [id]);

  if (!app) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const d = app.decision;
  const canAnswer = app.status === 'APPROVED' || app.status === 'COUNTER_OFFER';
  if (!d?.offer || !canAnswer) {
    return (
      <Container size="md" py={40}>
        <Alert color="gray" mb="lg">Сейчас по заявке нет предложения: {app.clientView.title.toLowerCase()}.</Alert>
        <Button variant="outline" onClick={() => navigate(`/client/applications/${id}`)}>К статусу заявки</Button>
      </Container>
    );
  }

  const offers: Offer[] = [d.offer, ...d.alternatives];

  const accept = async () => {
    setLoading('accept');
    setError(null);
    try {
      await api.accept(id, selected);
      navigate(`/client/applications/${id}/signing`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  const decline = async () => {
    setLoading('decline');
    try {
      await api.cancel(id);
      navigate(`/client/applications/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>{app.status === 'COUNTER_OFFER' ? 'Выберите вариант' : 'Условия кредита'}</Title>
      <Text c="dimmed" ta="center" mb={40}>
        Заявка {app.number} · вы запросили {rub(app.requested.amount)} на {months(app.requested.term)}
      </Text>

      {error && <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>{error}</Alert>}
      {app.status === 'COUNTER_OFFER' && d.reasons[0] && (
        <Alert color="orange" mb="lg">{d.reasons[0]}</Alert>
      )}

      <Stack gap="md" mb={40}>
        {offers.map((offer, i) => {
          const total = offer.monthlyPayment * offer.term;
          const isSelected = selected === i;
          return (
            <Card
              key={i}
              shadow="sm"
              padding="xl"
              radius="md"
              withBorder
              style={{
                cursor: offers.length > 1 ? 'pointer' : undefined,
                border: isSelected ? '2px solid #EF3124' : '1px solid #dee2e6',
                background: isSelected && offers.length > 1 ? '#fff5f5' : 'white',
              }}
              onClick={() => setSelected(i)}
            >
              <Group justify="space-between" mb="md">
                <Title order={4}>{offers.length > 1 ? `Вариант ${i + 1}` : 'Предложение банка'}</Title>
                {offers.length > 1 && isSelected && <Badge color="red" size="lg">Выбран</Badge>}
              </Group>
              <Divider mb="lg" />
              <Stack gap="lg">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">Сумма кредита</Text>
                    <Text fw={700} size="xl" c="red">{rub(offer.amount)}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" c="dimmed">Срок</Text>
                    <Text fw={600}>{months(offer.term)}</Text>
                  </div>
                </Group>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">Процентная ставка</Text>
                    <Badge color="green" size="lg">{offer.rate}% годовых</Badge>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" c="dimmed">Ежемесячный платёж</Text>
                    <Text fw={700} size="xl">{rub(offer.monthlyPayment)}</Text>
                  </div>
                </Group>
                <Paper p="md" bg="#fff5f5" radius="md">
                  <Text size="sm" fw={600} mb="xs">Итого к возврату: {rub(total)}</Text>
                  <Text size="sm" c="dimmed">Переплата: {rub(total - offer.amount)}</Text>
                </Paper>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Text size="sm" c="dimmed" ta="center" mb="md">
        После принятия сформируем договор и покажем код для подписи — прямо в кабинете.
      </Text>

      <Group>
        <Button size="lg" color="green" onClick={accept} loading={loading === 'accept'} disabled={!!loading} style={{ flex: 1 }}>
          Принять {offers.length > 1 ? `вариант ${selected + 1}` : 'условия'}
        </Button>
        <Button size="lg" variant="outline" color="red" onClick={decline} loading={loading === 'decline'} disabled={!!loading} style={{ flex: 1 }}>
          Отказаться
        </Button>
      </Group>

      <Group justify="center" mt="md">
        <Button variant="subtle" onClick={() => navigate(`/client/applications/${id}`)}>
          К статусу заявки
        </Button>
      </Group>
    </Container>
  );
}
