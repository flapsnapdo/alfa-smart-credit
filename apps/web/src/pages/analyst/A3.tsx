import { useEffect, useState } from 'react';
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
  Loader,
  Select,
  Paper,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { DOC_TYPES, GRADE_COLORS, months, rub } from '../../lib/format';
import type { AnalystCard, DocType, Product } from '../../lib/types';

type Choice = 'APPROVE' | 'COUNTER_OFFER' | 'REJECT' | 'REQUEST_INFO';

const CHOICES: { value: Choice; title: string; description: string; color: string; border: string; bg: string }[] = [
  { value: 'APPROVE', title: 'Одобрить', description: 'Клиент получает кредит на запрошенных условиях', color: 'green', border: '#2b8a3e', bg: '#f8fff9' },
  { value: 'COUNTER_OFFER', title: 'Изменить условия', description: 'Предложить другую сумму, срок или ставку', color: 'orange', border: '#f08c00', bg: '#fff9f0' },
  { value: 'REQUEST_INFO', title: 'Запросить документ', description: 'Заявка вернётся клиенту, после загрузки конвейер проверит её заново', color: 'blue', border: '#1971c2', bg: '#f3f8ff' },
  { value: 'REJECT', title: 'Отказать', description: 'Комментарий клиент увидит как причину отказа', color: 'red', border: '#c92a2a', bg: '#fff5f5' },
];

export function A3() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [card, setCard] = useState<AnalystCard | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [term, setTerm] = useState<number>(0);
  const [rate, setRate] = useState<number | ''>('');
  const [docType, setDocType] = useState<DocType>('FINANCIAL_STATEMENTS');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.analystCard(id), api.products()])
      .then(([c, products]) => {
        setCard(c);
        setProduct(products.find((p) => p.code === c.application.product.code) ?? null);
        setAmount(c.application.requested.amount / 100);
        setTerm(c.application.requested.term);
        const systemRate = c.decisions.at(-1)?.rate;
        if (systemRate) setRate(systemRate);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (!card) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const app = card.application;
  const commentOk = comment.trim().length >= 5;

  const handleSubmit = async () => {
    if (!choice || !commentOk) return;
    setSaving(true);
    setError(null);
    try {
      if (choice === 'REQUEST_INFO') {
        await api.analystRequestInfo(id, docType, comment.trim());
        setDone('Запрос отправлен клиенту. Когда он загрузит документ, заявка вернётся в очередь.');
      } else {
        await api.analystDecision(id, {
          type: choice,
          comment: comment.trim(),
          ...(choice === 'COUNTER_OFFER' && { amount: Math.round(amount * 100), term, ...(rate !== '' && { rate }) }),
        });
        setDone('Решение сохранено и уже видно клиенту в кабинете.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
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
          <Title order={3} mb={10} style={{ color: '#2b8a3e' }}>Готово</Title>
          <Text c="dimmed" mb="xl">{done}</Text>
          <Group justify="center">
            <Button variant="outline" onClick={() => navigate(`/analyst/application/${id}`)}>К карточке заявки</Button>
            <Button onClick={() => navigate('/analyst/dashboard')}>Вернуться к очереди</Button>
          </Group>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" py={40}>
      <Title mb={10}>Решение по заявке</Title>
      <Group mb={40} gap="xs">
        <Text c="dimmed">
          {app.number} · {app.company.name} · {app.product.name} · {rub(app.requested.amount)} на {months(app.requested.term)}
        </Text>
        {card.scoring && (
          <Badge color={GRADE_COLORS[card.scoring.grade]}>{card.scoring.score} · {card.scoring.grade}</Badge>
        )}
      </Group>

      {error && <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>{error}</Alert>}
      {app.status !== 'MANUAL_REVIEW' && (
        <Alert color="yellow" mb="lg">Заявка уже не у специалиста — решение сохранить не получится.</Alert>
      )}

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Title order={4} mb="md">Выберите решение</Title>
        <Radio.Group value={choice} onChange={(v) => setChoice(v as Choice)}>
          <Stack gap="md">
            {CHOICES.map((c) => (
              <Card
                key={c.value}
                padding="md"
                radius="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  border: choice === c.value ? `2px solid ${c.border}` : '1px solid #dee2e6',
                  background: choice === c.value ? c.bg : 'white',
                }}
                onClick={() => setChoice(c.value)}
              >
                <Group wrap="nowrap">
                  <Radio value={c.value} />
                  <div style={{ flex: 1 }}>
                    <Text fw={600}>{c.title}</Text>
                    <Text size="sm" c="dimmed">{c.description}</Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </Radio.Group>
      </Card>

      {choice === 'COUNTER_OFFER' && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">Новые условия</Title>
          <Group grow align="flex-start">
            <NumberInput
              label="Сумма"
              value={amount}
              onChange={(v) => setAmount(Number(v || 0))}
              thousandSeparator=" "
              suffix=" ₽"
              step={50_000}
              description={product ? `${rub(product.minAmount)} – ${rub(product.maxAmount)}` : undefined}
            />
            <NumberInput
              label="Срок"
              value={term}
              onChange={(v) => setTerm(Number(v || 0))}
              suffix=" мес"
              description={product ? `${product.minTerm}–${product.maxTerm} мес` : undefined}
            />
            <NumberInput
              label="Ставка"
              value={rate}
              onChange={(v) => setRate(v === '' ? '' : Number(v))}
              suffix=" %"
              decimalScale={1}
              description="Пусто — ставка системы"
            />
          </Group>
        </Card>
      )}

      {choice === 'REQUEST_INFO' && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">Какой документ нужен</Title>
          <Select
            data={DOC_TYPES}
            value={docType}
            onChange={(v) => v && setDocType(v as DocType)}
            allowDeselect={false}
          />
        </Card>
      )}

      {choice && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">Комментарий</Title>
          <Textarea
            placeholder={choice === 'REQUEST_INFO' ? 'Например: пришлите отчётность за 2025 год' : 'Почему такое решение'}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            minRows={3}
            autosize
            error={comment.length > 0 && !commentOk ? 'Не короче 5 символов' : undefined}
          />
          <Paper p="sm" bg="#f8f9fa" radius="md" mt="md">
            <Text size="xs" c="dimmed">
              {choice === 'REJECT'
                ? 'Клиент увидит этот текст как причину отказа.'
                : choice === 'REQUEST_INFO'
                  ? 'Клиент увидит комментарий рядом с запросом документа.'
                  : 'Комментарий сохранится в истории заявки — клиент тоже его увидит.'}
            </Text>
          </Paper>
        </Card>
      )}

      <Group>
        <Button
          size="lg"
          color="red"
          onClick={handleSubmit}
          loading={saving}
          disabled={!choice || !commentOk || app.status !== 'MANUAL_REVIEW'}
          style={{ flex: 1 }}
        >
          Сохранить решение
        </Button>
        <Button variant="outline" onClick={() => navigate(`/analyst/application/${id}`)}>
          Назад
        </Button>
      </Group>
    </Container>
  );
}
