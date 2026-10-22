import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Button,
  Stack,
  Alert,
  NumberInput,
  Group,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';

export function FinancialsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    avgMonthlyRevenue: '',
    revenueLast6m: '',
    revenuePrev6m: '',
    existingMonthlyPayments: '',
  });
  const setFinancials = useApplicationStore((s) => s.setFinancials);
 const handleSubmit = async () => {
  setLoading(true);
  setError(null);

  try {
    const financials = {
      avgMonthlyRevenue: Number(formData.avgMonthlyRevenue) * 100,
      revenueLast6m: Number(formData.revenueLast6m) * 100,
      revenuePrev6m: Number(formData.revenuePrev6m) * 100,
      existingMonthlyPayments: Number(formData.existingMonthlyPayments) * 100,
    };
    setFinancials(financials);
    navigate('/client/review');
  } catch (err: any) {
    setError(err.message || 'Ошибка при сохранении');
  } finally {
    setLoading(false);
  }
};
  const handleSaveDraft = () => {
    console.log('Черновик сохранён:', formData);
    alert('Черновик сохранён!');
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Финансовые показатели
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Укажите финансовые данные вашей компании за последний год
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Stack>
          <NumberInput
            label="Среднемесячная выручка (₽)"
            placeholder="500000"
            value={formData.avgMonthlyRevenue}
            onChange={(val) => setFormData({ ...formData, avgMonthlyRevenue: String(val || '') })}
            thousandSeparator=" "
            required
          />
          <NumberInput
            label="Выручка за последние 6 месяцев (₽)"
            placeholder="3000000"
            value={formData.revenueLast6m}
            onChange={(val) => setFormData({ ...formData, revenueLast6m: String(val || '') })}
            thousandSeparator=" "
            required
          />
          <NumberInput
            label="Выручка за предыдущие 6 месяцев (₽)"
            placeholder="2800000"
            value={formData.revenuePrev6m}
            onChange={(val) => setFormData({ ...formData, revenuePrev6m: String(val || '') })}
            thousandSeparator=" "
            required
          />
          <NumberInput
            label="Текущие ежемесячные платежи по кредитам (₽)"
            placeholder="100000"
            value={formData.existingMonthlyPayments}
            onChange={(val) => setFormData({ ...formData, existingMonthlyPayments: String(val || '') })}
            thousandSeparator=" "
          />
        </Stack>

        <Group mt="xl" grow>
          <Button variant="outline" onClick={handleSaveDraft}>
            Сохранить черновик
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Далее → Проверка
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}