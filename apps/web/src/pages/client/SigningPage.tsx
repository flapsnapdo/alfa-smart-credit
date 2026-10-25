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
  PinInput,
  Box,
  Loader,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { dateTime, months, rub } from '../../lib/format';
import type { Contract } from '../../lib/types';

export function SigningPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.contract(id).then(setContract).catch((e) => setError(e.message));
  }, [id]);

  const handleSign = async () => {
    setLoading(true);
    setError(null);
    try {
      setContract(await api.sign(id, code));
    } catch (e) {
      setError((e as Error).message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (!contract) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const { offer } = contract;

  if (contract.status === 'ISSUED') {
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
            Средства выданы
          </Title>
          <Text c="dimmed" mb="xl">
            Договор {contract.number}{contract.signedAt ? ` подписан ${dateTime(contract.signedAt)}` : ''}
          </Text>

          <Paper p="md" bg="#f8f9fa" radius="md" mb="xl">
            <Text size="sm" c="dimmed" mb="xs">Зачислено на счёт</Text>
            <Text fw={700} size="xl" c="red">{rub(offer.amount)}</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Срок: {months(offer.term)} • Ставка: {offer.rate}% • Платёж: {rub(offer.monthlyPayment)}/мес
            </Text>
            {contract.payoutId && <Text size="xs" c="dimmed" mt="xs">Номер операции: {contract.payoutId}</Text>}
          </Paper>

          <Button size="lg" color="red" onClick={() => navigate('/client/dashboard')} fullWidth>
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
        Проверьте условия и подтвердите договор кодом
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Договор {contract.number}</Title>
        <Stack gap="sm" mb="lg">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Сумма</Text>
            <Text fw={600}>{rub(offer.amount)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Срок</Text>
            <Text fw={600}>{months(offer.term)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Ставка</Text>
            <Badge color="green">{offer.rate}% годовых</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Платёж</Text>
            <Text fw={700}>{rub(offer.monthlyPayment)}/мес</Text>
          </Group>
        </Stack>

        <Divider mb="lg" />

        {contract.demoSignCode && (
          <Paper p="md" bg="#fff5f5" radius="md">
            <Text size="sm" fw={600}>
              Код для подписи: <Text span fw={800} size="lg" c="red">{contract.demoSignCode}</Text>
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              По условиям демо код показываем прямо в кабинете. В настоящем банке он пришёл бы в приложение или по СМС.
            </Text>
          </Paper>
        )}
      </Card>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40} ta="center">
        <Text fw={600} mb="md">Введите код подтверждения</Text>
        <Box mb="md" style={{ display: 'flex', justifyContent: 'center' }}>
          <PinInput length={4} value={code} onChange={setCode} type="number" placeholder="○" size="lg" />
        </Box>
      </Card>

      <Button size="lg" color="red" onClick={handleSign} loading={loading} disabled={code.length !== 4} fullWidth>
        Подписать договор
      </Button>

      <Group justify="center" mt="md">
        <Button variant="subtle" onClick={() => navigate(`/client/applications/${id}`)}>
          К статусу заявки
        </Button>
      </Group>
    </Container>
  );
}
