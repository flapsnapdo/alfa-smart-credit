import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Button,
  Stack,
  Checkbox,
  Alert,
  Card,
  Group,
  Badge,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function ReviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bkiConsent, setBkiConsent] = useState(false);

  const handleSubmit = async () => {
    if (!bkiConsent) {
      setError('Необходимо дать согласие на запрос в БКИ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Заявка отправлена с согласием БКИ:', bkiConsent);
      setTimeout(() => {
        navigate('/client/status');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Проверка и отправка заявки
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Проверьте данные и дайте согласие на обработку
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Сводка по заявке</Title>
        
        <Stack gap="sm">
          <div>
            <Text size="sm" c="dimmed">Компания</Text>
            <Text fw={500}>ООО "Северный склад"</Text>
          </div>
          <Divider />
          <div>
            <Text size="sm" c="dimmed">Цель кредита</Text>
            <Text>Пополнение оборотных средств</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Сумма</Text>
            <Text fw={700} color="red">5 000 000 ₽</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Срок</Text>
            <Text>12 месяцев</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Ставка</Text>
            <Badge color="green">18% годовых</Badge>
          </div>
        </Stack>
      </Card>

      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Checkbox
          label={
            <Text size="sm">
              Я даю согласие на запрос информации в Бюро кредитных историй (БКИ)
            </Text>
          }
          checked={bkiConsent}
          onChange={(event) => setBkiConsent(event.currentTarget.checked)}
          required
        />
      </Paper>

      <Stack>
        <Button size="lg" onClick={handleSubmit} loading={loading} disabled={!bkiConsent}>
          Отправить заявку
        </Button>
        <Button variant="outline" onClick={() => navigate('/client/financials')}>
          Назад
        </Button>
      </Stack>
    </Container>
  );
}