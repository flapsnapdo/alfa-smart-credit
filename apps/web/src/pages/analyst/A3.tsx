import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  Radio,
  Textarea,
  NumberInput,
  Alert,
  Badge,
  Divider,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';

export function A3() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [decision, setDecision] = useState<string | null>(null);
  const [reason, setReason] = useState('');
const [counterAmount, setCounterAmount] = useState<string | number>('');
const [counterRate, setCounterRate] = useState<string | number>('');
const [counterTerm, setCounterTerm] = useState<string | number>('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!decision) {
      setError('Выберите решение');
      return;
    }
    if (decision === 'REJECTED' && !reason) {
      setError('Укажите причины отказа');
      return;
    }

    try {
      await fetch('/api/v1/analyst/applications/' + id + '/decision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reason,
          counterAmount: counterAmount || undefined,
          counterRate: counterRate || undefined,
          counterTerm: counterTerm || undefined,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError('Ошибка при сохранении решения');
    }
  };

  if (submitted) {
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
            <Text size="xl">✓</Text>
          </div>
          <Title order={3} mb={10} style={{ color: '#2b8a3e' }}>
            Решение сохранено!
          </Title>
          <Text c="dimmed" mb="xl">
            Решение по заявке отправлено клиенту
          </Text>
          <Button onClick={() => navigate('/analyst/dashboard')}>
            Вернуться к списку заявок
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" py={40}>
      <Title mb={10}>Принятие решения</Title>
      <Text c="dimmed" mb={40}>
        Заявка №{id}
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Выберите решение</Title>
        <Radio.Group value={decision} onChange={setDecision}>
          <Stack gap="md">
            <Card
              padding="md"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                border: decision === 'APPROVED' ? '2px solid #2b8a3e' : '1px solid #dee2e6',
                background: decision === 'APPROVED' ? '#f8fff9' : 'white',
              }}
              onClick={() => setDecision('APPROVED')}
            >
              <Group>
                <Radio value="APPROVED" />
                <div>
                  <Text fw={600}>Одобрить заявку</Text>
                  <Text size="sm" c="dimmed">Клиент получает кредит на запрошенных условиях</Text>
                </div>
                <Badge color="green" ml="auto">APPROVED</Badge>
              </Group>
            </Card>

            <Card
              padding="md"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                border: decision === 'COUNTER_OFFER' ? '2px solid #f08c00' : '1px solid #dee2e6',
                background: decision === 'COUNTER_OFFER' ? '#fff9f0' : 'white',
              }}
              onClick={() => setDecision('COUNTER_OFFER')}
            >
              <Group>
                <Radio value="COUNTER_OFFER" />
                <div>
                  <Text fw={600}>Контрпредложение</Text>
                  <Text size="sm" c="dimmed">Изменить условия кредита</Text>
                </div>
                <Badge color="orange" ml="auto">COUNTER</Badge>
              </Group>
            </Card>

            <Card
              padding="md"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                border: decision === 'REJECTED' ? '2px solid #c92a2a' : '1px solid #dee2e6',
                background: decision === 'REJECTED' ? '#fff5f5' : 'white',
              }}
              onClick={() => setDecision('REJECTED')}
            >
              <Group>
                <Radio value="REJECTED" />
                <div>
                  <Text fw={600}>Отклонить заявку</Text>
                  <Text size="sm" c="dimmed">Отказать в кредитовании</Text>
                </div>
                <Badge color="red" ml="auto">REJECTED</Badge>
              </Group>
            </Card>
          </Stack>
        </Radio.Group>
      </Card>

      {decision === 'COUNTER_OFFER' && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">Новые условия</Title>
          <Stack>
            <NumberInput
  label="Сумма, ₽"
  placeholder="4000000"
  value={counterAmount}
  onChange={(val) => setCounterAmount(val || '')}
  thousandSeparator=" "
/>
            <NumberInput
  label="Сумма, ₽"
  placeholder="4000000"
  value={counterAmount}
  onChange={(val) => setCounterAmount(val || '')}
  thousandSeparator=" "
/>
<NumberInput
  label="Сумма, ₽"
  placeholder="4000000"
  value={counterAmount}
  onChange={(val) => setCounterAmount(val || '')}
  thousandSeparator=" "
/>
          </Stack>
        </Card>
      )}

      {decision === 'REJECTED' && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">Причины отказа</Title>
          <Textarea
            placeholder="Укажите причины отказа..."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={4}
            required
          />
        </Card>
      )}

      <Group>
        <Button
          size="lg"
          color="red"
          onClick={handleSubmit}
          disabled={!decision}
          style={{ flex: 1 }}
        >
          Сохранить решение
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/analyst/application/${id}`)}
        >
          Назад
        </Button>
      </Group>
    </Container>
  );
}