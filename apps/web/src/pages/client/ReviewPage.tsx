import { useEffect, useState } from 'react';
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
  FileInput,
  Group,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { DOC_TYPES, PURPOSE_LABELS, months, rub } from '../../lib/format';
import type { DocType } from '../../lib/types';
import { useApplicationStore } from '../../store/applicationStore';

export function ReviewPage() {
  const navigate = useNavigate();
  const { purpose, amountRub, term, recommendation, companyId, companyName } = useApplicationStore();
  const [bkiConsent, setBkiConsent] = useState(false);
  const [files, setFiles] = useState<Partial<Record<DocType, File | null>>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purpose || !recommendation) navigate('/client/product-select', { replace: true });
    else if (!companyId) navigate('/client/company', { replace: true });
  }, [purpose, recommendation, companyId, navigate]);

  if (!purpose || !recommendation || !companyId) return null;

  const product = recommendation.recommended;
  const amount = Math.round(amountRub * 100);
  // Документы, обязательные для продукта при такой сумме: можно приложить сразу или дождаться запроса банка
  const docsForProduct = product.requiredDocs.filter((d) => amount >= d.fromAmount).map((d) => d.docType);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Черновик создаём один раз: при повторной попытке после ошибки используем тот же
      let id = createdId;
      if (!id) {
        const app = await api.createApplication({ companyId, productCode: product.code, purpose, amount, term });
        id = app.id;
        setCreatedId(id);
      }
      for (const [docType, file] of Object.entries(files)) {
        if (file) await api.uploadDocument(id, docType as DocType, file);
      }
      await api.submit(id);
      navigate(`/client/applications/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Проверка и отправка заявки</Title>
      <Text c="dimmed" ta="center" mb={40}>Проверьте данные и дайте согласие на запрос кредитной истории</Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>{error}</Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Сводка по заявке</Title>
        <Stack gap="sm">
          <div>
            <Text size="sm" c="dimmed">Компания</Text>
            <Text fw={500}>{companyName}</Text>
          </div>
          <Divider />
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">Цель</Text>
              <Text>{PURPOSE_LABELS[purpose]}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Продукт</Text>
              <Text>{product.name}</Text>
            </div>
          </Group>
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">Сумма</Text>
              <Text fw={700} c="red">{rub(amount)}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Срок</Text>
              <Text>{months(term)}</Text>
            </div>
          </Group>
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">Ставка</Text>
              <Badge color="green">от {recommendation.rate}% годовых</Badge>
            </div>
            <div>
              <Text size="sm" c="dimmed">{product.annuity ? 'Примерный платёж' : 'Проценты в месяц'}</Text>
              <Text fw={700}>{rub(recommendation.monthlyPayment)}</Text>
            </div>
          </Group>
          <Text size="xs" c="dimmed">Точные условия — после оценки заявки</Text>
        </Stack>
      </Card>

      {docsForProduct.length > 0 && (
        <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
          <Title order={5} mb={5}>Документы</Title>
          <Text size="sm" c="dimmed" mb="md">
            Для этого продукта банку нужен документ. Приложите его сейчас — или банк запросит его после отправки.
          </Text>
          <Stack>
            {docsForProduct.map((docType) => (
              <FileInput
                key={docType}
                label={DOC_TYPES.find((d) => d.value === docType)?.label}
                placeholder="PDF, JPG или PNG до 10 МБ"
                accept=".pdf,.jpg,.jpeg,.png"
                leftSection={<IconUpload size={16} />}
                value={files[docType] ?? null}
                onChange={(file) => setFiles((f) => ({ ...f, [docType]: file }))}
                clearable
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
        <Checkbox
          label={<Text size="sm">Даю согласие на запрос моей кредитной истории в Бюро кредитных историй (БКИ)</Text>}
          description="Это не влияет на кредитный рейтинг"
          checked={bkiConsent}
          onChange={(event) => setBkiConsent(event.currentTarget.checked)}
        />
      </Paper>

      <Stack>
        <Button size="lg" onClick={handleSubmit} loading={loading} disabled={!bkiConsent}>
          Отправить заявку
        </Button>
        <Button variant="outline" onClick={() => navigate('/client/company')}>Назад</Button>
      </Stack>
    </Container>
  );
}
