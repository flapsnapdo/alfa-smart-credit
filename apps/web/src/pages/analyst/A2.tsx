import { useEffect, useState, type ReactNode } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Group,
  Button,
  Stack,
  Paper,
  Grid,
  Alert,
  Loader,
  Table,
  Timeline,
  SimpleGrid,
} from '@mantine/core';
import { IconFileCheck } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import {
  DOC_TYPES, GRADE_RISK, PURPOSE_LABELS, STATUS_LABELS, dateTime, months, rub, statusColor,
} from '../../lib/format';
import type { AnalystCard, ExternalCheck } from '../../lib/types';

const SOURCE_LABELS: Record<ExternalCheck['source'], string> = {
  REGISTRY: 'Реестр ЕГРЮЛ/ЕГРИП',
  TAX: 'ФНС «Прозрачный бизнес»',
  BKI: 'Бюро кредитных историй',
};

const COMPANY_STATUS: Record<string, string> = {
  ACTIVE: 'действующая', LIQUIDATING: 'в процессе ликвидации', LIQUIDATED: 'ликвидирована', BANKRUPT: 'банкротство',
};

const FACTOR_VALUES: Record<string, string> = { LOW: 'низкий', MEDIUM: 'средний', HIGH: 'высокий' };

const DECISION_LABELS: Record<string, string> = {
  APPROVE: 'Одобрение', COUNTER_OFFER: 'Контрпредложение', MANUAL_REVIEW: 'К специалисту', REJECT: 'Отказ',
};

const GRADE_BG: Record<string, [string, string]> = {
  A: ['#d3f9d8', '#2b8a3e'], B: ['#c3fae8', '#087f5b'], C: ['#fff3bf', '#f08c00'], D: ['#ffc9c9', '#c92a2a'],
};

function pct(x: number): string {
  return `${Math.round(x * 1000) / 10}%`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <Text c="dimmed" size="sm">{label}</Text>
      <Text size="sm" fw={500} ta="right">{value}</Text>
    </Group>
  );
}

export function A2() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [card, setCard] = useState<AnalystCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analystCard(id).then(setCard).catch((e) => setError(e.message));
  }, [id]);

  if (!card) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const { application: app, scoring } = card;
  // Последний ответ каждого внешнего сервиса (после повторной проверки их может быть несколько)
  const latest = new Map<ExternalCheck['source'], ExternalCheck>();
  for (const c of card.checks) {
    const prev = latest.get(c.source);
    if (!prev || prev.createdAt <= c.createdAt) latest.set(c.source, c);
  }
  const registry = latest.get('REGISTRY')?.payload as Record<string, string> | undefined;
  const bki = latest.get('BKI')?.payload as { activeLoans?: { bank: string; amount: number; monthlyPayment: number }[] } | undefined;
  const input = scoring?.input;
  const [bg, fg] = scoring ? GRADE_BG[scoring.grade] : ['#f1f3f5', '#868e96'];

  return (
    <Container size="xl" py={40}>
      <Group mb="md" justify="space-between">
        <div>
          <Title order={2}>Заявка {app.number}</Title>
          <Text c="dimmed">{app.company.name} · ИНН {app.company.inn}</Text>
        </div>
        <Button variant="outline" onClick={() => navigate('/analyst/dashboard')}>
          ← Назад к очереди
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Параметры заявки</Title>
            <Stack gap="xs">
              <Row label="Продукт" value={app.product.name} />
              <Row label="Цель" value={PURPOSE_LABELS[app.purpose]} />
              <Row label="Сумма" value={<Text fw={700} span>{rub(app.requested.amount)}</Text>} />
              <Row label="Срок" value={months(app.requested.term)} />
              <Row label="Подана" value={app.submittedAt ? dateTime(app.submittedAt) : '—'} />
              {app.decision && app.decision.reasons.length > 0 && (
                <Row label="Почему у специалиста" value={app.decision.reasons.join('; ')} />
              )}
            </Stack>
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Данные компании</Title>
            {registry ? (
              <Stack gap="xs">
                <Row label="Название" value={registry.name} />
                <Row label="ОГРН" value={registry.ogrn} />
                <Row label="Статус" value={COMPANY_STATUS[registry.status] ?? registry.status} />
                <Row label="Зарегистрирована" value={registry.registeredAt} />
                <Row label="ОКВЭД" value={`${registry.okved} ${registry.okvedName ?? ''}`} />
                <Row label="Руководитель" value={registry.directorName} />
                <Row label="Адрес" value={registry.address} />
              </Stack>
            ) : (
              <Text c="dimmed" size="sm">Реестр не ответил — данных нет</Text>
            )}
          </Card>

          {input && (
            <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
              <Title order={4} mb="md">Финансовые показатели</Title>
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Выручка в месяц</Text>
                  <Text fw={700} size="lg">{rub(input.avgMonthlyRevenue)}</Text>
                </Paper>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Динамика за полгода</Text>
                  <Text fw={700} size="lg">
                    {input.revenuePrev6m > 0 ? pct(input.revenueLast6m / input.revenuePrev6m - 1) : '—'}
                  </Text>
                </Paper>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Платежи по кредитам</Text>
                  <Text fw={700} size="lg">{rub(input.currentMonthlyPayments)}</Text>
                  <Text size="xs" c="dimmed">
                    {input.avgMonthlyRevenue > 0 ? `${pct(input.currentMonthlyPayments / input.avgMonthlyRevenue)} выручки` : ''}
                  </Text>
                </Paper>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Возраст бизнеса</Text>
                  <Text fw={700} size="lg">{months(input.businessAgeMonths)}</Text>
                </Paper>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Просрочки за 12 мес</Text>
                  <Text fw={700} size="lg">{input.maxDelinquencyDays12m ? `до ${input.maxDelinquencyDays12m} дн` : 'нет'}</Text>
                </Paper>
                <Paper p="md" bg="#f8f9fa" radius="md">
                  <Text size="sm" c="dimmed">Налоговый долг</Text>
                  <Text fw={700} size="lg">{input.hasTaxDebt ? 'есть' : 'нет'}</Text>
                </Paper>
              </SimpleGrid>
              {bki?.activeLoans && bki.activeLoans.length > 0 && (
                <Text size="sm" c="dimmed" mt="md">
                  Действующие кредиты: {bki.activeLoans.map((l) => `${l.bank} — ${rub(l.amount)}, ${rub(l.monthlyPayment)}/мес`).join('; ')}
                </Text>
              )}
            </Card>
          )}

          {scoring && (
            <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
              <Title order={4} mb="md">Скоринг по факторам</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Фактор</Table.Th>
                    <Table.Th>Значение</Table.Th>
                    <Table.Th>Правило</Table.Th>
                    <Table.Th ta="right">Баллы</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Стартовый балл</Table.Td>
                    <Table.Td />
                    <Table.Td />
                    <Table.Td ta="right"><Text fw={600}>600</Text></Table.Td>
                  </Table.Tr>
                  {scoring.factors.map((f) => (
                    <Table.Tr key={f.code}>
                      <Table.Td><Text size="sm">{f.clientText}</Text></Table.Td>
                      <Table.Td><Text size="sm">{FACTOR_VALUES[f.value] ?? f.value}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="dimmed">{f.analystText}</Text></Table.Td>
                      <Table.Td ta="right">
                        <Text fw={600} c={f.points > 0 ? 'green' : f.points < 0 ? 'red' : 'dimmed'}>
                          {f.points > 0 ? `+${f.points}` : f.points}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Внешние проверки</Title>
            <Stack gap="xs">
              {(['REGISTRY', 'TAX', 'BKI'] as const).map((source) => {
                const c = latest.get(source);
                return (
                  <Group key={source} justify="space-between">
                    <Text size="sm">{SOURCE_LABELS[source]}</Text>
                    {c ? (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">{c.durationMs} мс</Text>
                        <Badge color={c.ok ? 'green' : 'red'}>{c.ok ? 'ответил' : `ошибка${c.httpStatus ? ` ${c.httpStatus}` : ''}`}</Badge>
                      </Group>
                    ) : (
                      <Badge color="gray">не запрашивали</Badge>
                    )}
                  </Group>
                );
              })}
            </Stack>
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md">Документы</Title>
            {card.documents.length === 0 && <Text size="sm" c="dimmed">Документов нет</Text>}
            <Stack gap="sm">
              {card.documents.map((doc) => (
                <Group key={doc.id} justify="space-between">
                  <Group gap="sm">
                    <IconFileCheck size={20} color="#2b8a3e" />
                    <div>
                      <Text size="sm" fw={500}>{DOC_TYPES.find((d) => d.value === doc.docType)?.label}</Text>
                      <Text size="xs" c="dimmed">{doc.fileName} · {dateTime(doc.createdAt)}</Text>
                    </div>
                  </Group>
                  <Button size="xs" variant="light" onClick={() => api.openDocument(app.id, doc.id).catch((e) => setError(e.message))}>
                    Открыть
                  </Button>
                </Group>
              ))}
            </Stack>
            {card.documentRequests.filter((r) => !r.fulfilledAt).map((r) => (
              <Alert key={r.docType} color="orange" mt="md" p="xs">
                Ждём от клиента: {r.title}{r.comment ? ` — ${r.comment}` : ''}
              </Alert>
            ))}
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Title order={4} mb="md">История</Title>
            <Timeline active={card.history.length - 1} bulletSize={14} lineWidth={2}>
              {card.history.map((h) => (
                <Timeline.Item key={h.id} title={STATUS_LABELS[h.toStatus]}>
                  <Text size="xs" c="dimmed">{dateTime(h.createdAt)} · {h.actorType === 'CLIENT' ? 'клиент' : h.actorType === 'ANALYST' ? 'аналитик' : 'система'}</Text>
                  {h.reason && <Text size="sm">{h.reason}</Text>}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={4} mb="md" ta="center">Скоринг</Title>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Text fw={700} size="xl" style={{ color: fg }}>{scoring ? scoring.score : '—'}</Text>
              {scoring && <Text size="sm" fw={600} style={{ color: fg }}>рейтинг {scoring.grade}</Text>}
            </div>
            <Text ta="center" size="sm" c="dimmed">
              {scoring ? `${GRADE_RISK[scoring.grade]} · шкала 0–1000` : 'Скоринг не считали: нет данных внешних сервисов'}
            </Text>
            {scoring?.stopFactors.map((s) => (
              <Alert key={s.code} color="red" mt="md" p="xs">Стоп-фактор: {s.clientText}</Alert>
            ))}
            {scoring && <Text ta="center" size="xs" c="dimmed" mt="sm">Правила {scoring.rulesVersion}</Text>}
          </Card>

          <Card shadow="sm" padding="xl" radius="md" withBorder mb="md">
            <Title order={5} mb="md">Статус</Title>
            <Badge color={statusColor(app.status)} size="lg" fullWidth>{STATUS_LABELS[app.status]}</Badge>
          </Card>

          {app.status === 'MANUAL_REVIEW' ? (
            <Button fullWidth size="lg" color="red" mb="md" onClick={() => navigate(`/analyst/application/${id}/decision`)}>
              Принять решение
            </Button>
          ) : (
            <Alert color="gray" mb="md">Решение принимают только по заявкам в статусе «У специалиста»</Alert>
          )}

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Title order={5} mb="md">Решения</Title>
            <Stack gap="sm">
              {card.decisions.map((dec, i) => (
                <Paper key={i} p="sm" withBorder radius="md">
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={600}>{DECISION_LABELS[dec.type]}</Text>
                    <Badge size="sm" color={dec.actorType === 'ANALYST' ? 'grape' : 'gray'}>
                      {dec.actorType === 'ANALYST' ? 'аналитик' : 'система'}
                    </Badge>
                  </Group>
                  {dec.offer && <Text size="xs">{rub(dec.offer.amount)} · {months(dec.offer.term)} · {dec.offer.rate}%</Text>}
                  {dec.reasons.map((r) => <Text key={r} size="xs" c="dimmed">{r}</Text>)}
                  <Text size="xs" c="dimmed">{dateTime(dec.createdAt)}</Text>
                </Paper>
              ))}
              {card.decisions.length === 0 && <Text size="sm" c="dimmed">Решений пока нет</Text>}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
