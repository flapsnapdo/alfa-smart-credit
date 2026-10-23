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
  Badge,
  Divider,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';
import { apiClient } from '../../lib/apiClient';

const PURPOSE_LABELS: Record<string, string> = {
  'working-capital': 'Пополнение оборотных средств',
  'equipment': 'Покупка оборудования',
  'expansion': 'Расширение бизнеса',
  'refinancing': 'Рефинансирование',
  'inventory': 'Закупка товара',
  'other': 'Другое',
};

export function ReviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bkiConsent, setBkiConsent] = useState(false);

  const { purpose, amount, term, rate, monthlyPayment, company } = useApplicationStore();
  const setBkiConsentStore = useApplicationStore((s) => s.setBkiConsent);
  const setApplication = useApplicationStore((s) => s.setApplication);

  const handleSubmit = async () => {
    if (!bkiConsent) {
      setError('Необходимо дать согласие на запрос в БКИ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const application = await apiClient.applications.submit('app-1', bkiConsent);
      setBkiConsentStore(bkiConsent);
      setApplication(application.id || 'unknown-id', application.number || 'ЗК-2026-000000');
      navigate('/client/documents');
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  const purposeLabel = purpose ? PURPOSE_LABELS[purpose] || purpose : 'Не указана';
  const companyName = company?.name || 'Не указана';

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Проверка и отправка заявки</Title>
      <Text c="dimmed" ta="center" mb={40}>Проверьте данные и дайте согласие на обработку</Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>{error}</Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Сводка по заявке</Title>
        <Stack gap="sm">
          <div>
            <Text size="sm" c="dimmed">Компания</Text>
            <Text fw={500}>{companyName}</Text>
          </div>
          <Divider />
          <div>
            <Text size="sm" c="dimmed">Цель кредита</Text>
            <Text>{purposeLabel}</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Сумма</Text>
            <Text fw={700} color="red">{amount.toLocaleString('ru-RU')} ₽</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Срок</Text>
            <Text>{term} месяцев</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">Ставка</Text>
            <Badge color="green">{rate}% годовых</Badge>
          </div>
          <div>
            <Text size="sm" c="dimmed">Ежемесячный платёж</Text>
            <Text fw={700}>{monthlyPayment.toLocaleString('ru-RU')} ₽</Text>
          </div>
        </Stack>
      </Card>

      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Checkbox
          label={<Text size="sm">Я даю согласие на запрос информации в Бюро кредитных историй (БКИ)</Text>}
          checked={bkiConsent}
          onChange={(event) => setBkiConsent(event.currentTarget.checked)}
          required
        />
      </Paper>

      <Stack>
        <Button size="lg" onClick={handleSubmit} loading={loading} disabled={!bkiConsent}>
          Отправить заявку
        </Button>
        <Button variant="outline" onClick={() => navigate('/client/financials')}>Назад</Button>
      </Stack>
    </Container>
  );
}