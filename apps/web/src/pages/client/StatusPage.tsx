import { useCallback, useEffect, useState } from 'react';
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
  Loader,
  List,
  Timeline,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExplanationCard } from '../../components/ExplanationCard';
import { api } from '../../lib/apiClient';
import { CANCELLABLE, IN_PROGRESS, STATUS_LABELS, dateTime, months, rub, statusColor } from '../../lib/format';
import type { Application, ApplicationStatus, DocumentsInfo, Offer, StatusHistoryEntry } from '../../lib/types';
import { useApplicationStore } from '../../store/applicationStore';

/** На каком шаге конвейера заявка: индекс для Stepper */
function stepOf(status: ApplicationStatus): number {
  switch (status) {
    case 'DRAFT': return 0;
    case 'SUBMITTED': return 1;
    case 'VALIDATION':
    case 'INFO_REQUESTED': return 1;
    case 'ENRICHMENT': return 2;
    case 'SCORING':
    case 'MANUAL_REVIEW': return 3;
    case 'APPROVED':
    case 'COUNTER_OFFER': return 5;
    case 'SIGNING': return 5;
    case 'ISSUED': return 7;
    default: return 5;   // отказ, отзыв, истёк срок — решение принято
  }
}

const CLOSED: ApplicationStatus[] = ['REJECTED', 'CANCELLED', 'EXPIRED'];

function OfferLine({ offer }: { offer: Offer }) {
  return (
    <SimpleGrid cols={4} spacing="xs">
      <div><Text size="xs" c="dimmed">Сумма</Text><Text fw={700}>{rub(offer.amount)}</Text></div>
      <div><Text size="xs" c="dimmed">Срок</Text><Text fw={600}>{months(offer.term)}</Text></div>
      <div><Text size="xs" c="dimmed">Ставка</Text><Text fw={600}>{offer.rate}% годовых</Text></div>
      <div><Text size="xs" c="dimmed">Платёж</Text><Text fw={600}>{rub(offer.monthlyPayment)}/мес</Text></div>
    </SimpleGrid>
  );
}

export function StatusPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const resetDraft = useApplicationStore((s) => s.reset);
  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [docs, setDocs] = useState<DocumentsInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([api.application(id), api.timeline(id)]);
      setApp(a);
      setHistory(h);
      setError(null);
      if (a.status === 'INFO_REQUESTED') setDocs(await api.documents(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Пока банк работает — опрашиваем: конвейер быстро, специалиста реже
  const status = app?.status;
  useEffect(() => {
    if (!status || app?.clientView.nextAction !== 'WAIT') return;
    const timer = setInterval(load, status === 'MANUAL_REVIEW' ? 5000 : 1500);
    return () => clearInterval(timer);
  }, [status, app?.clientView.nextAction, load]);

  const cancel = async () => {
    setBusy(true);
    try {
      setApp(await api.cancel(id));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!app) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const d = app.decision;
  const working = IN_PROGRESS.includes(app.status);
  const closed = CLOSED.includes(app.status);
  const decisionLabel = closed ? STATUS_LABELS[app.status] : app.status === 'MANUAL_REVIEW' ? 'Решение специалиста' : 'Решение';

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb={10} align="flex-start">
        <div>
          <Title order={2}>Заявка {app.number}</Title>
          <Text c="dimmed">
            {app.company.name} · {app.product.name} · {rub(app.requested.amount)} на {months(app.requested.term)}
          </Text>
        </div>
        <Badge color={statusColor(app.status)} size="xl">{app.clientView.title}</Badge>
      </Group>

      {error && <Alert color="red" my="lg" onClose={() => setError(null)} withCloseButton>{error}</Alert>}

      <Card shadow="sm" padding="xl" radius="md" withBorder my={30}>
        <Group mb="lg" gap="xs">
          {working && <Loader size="sm" />}
          <Text fw={600}>{app.clientView.text}</Text>
        </Group>

        <Stepper active={stepOf(app.status)} orientation="vertical" size="sm">
          <Stepper.Step label="Заявка отправлена" description={app.submittedAt ? dateTime(app.submittedAt) : 'Черновик'} />
          <Stepper.Step
            label="Проверка данных"
            description={app.status === 'INFO_REQUESTED' ? 'Нужны документы' : 'Полнота анкеты и документы'}
            color={app.status === 'INFO_REQUESTED' ? 'orange' : undefined}
          />
          <Stepper.Step label="Проверка компании" description="Реестр, ФНС, кредитная история" />
          <Stepper.Step
            label="Оценка"
            description={app.status === 'MANUAL_REVIEW' ? 'Заявку изучает специалист' : 'Скоринг и условия'}
          />
          <Stepper.Step
            label={decisionLabel}
            description={closed ? '' : d?.type === 'COUNTER_OFFER' ? 'Другие условия' : d?.type === 'APPROVE' ? 'Одобрено' : ''}
            color={app.status === 'REJECTED' ? 'red' : undefined}
            completedIcon={app.status === 'REJECTED' || app.status === 'CANCELLED' ? <IconX size={16} /> : undefined}
          />
          {!closed && <Stepper.Step label="Подписание договора" description="Кодом прямо в кабинете" />}
          {!closed && <Stepper.Step label="Деньги на счёте" />}
        </Stepper>
      </Card>

      {/* ── Что делать дальше ─────────────────────────────── */}
      {app.status === 'APPROVED' && d?.offer && (
        <Alert color="green" title="Заявка одобрена" mb={30}>
          <OfferLine offer={d.offer} />
          <Button mt="md" onClick={() => navigate(`/client/applications/${id}/offer`)}>Перейти к условиям</Button>
        </Alert>
      )}

      {app.status === 'COUNTER_OFFER' && d?.offer && (
        <Alert color="orange" title="Предлагаем другие условия" mb={30}>
          {d.reasons[0] && <Text mb="md">{d.reasons[0]}</Text>}
          <Stack gap="sm">
            {[d.offer, ...d.alternatives].map((o, i) => (
              <Paper key={i} p="sm" radius="md" withBorder>
                <Text size="sm" fw={600} mb={4}>Вариант {i + 1}</Text>
                <OfferLine offer={o} />
              </Paper>
            ))}
          </Stack>
          <Group mt="md">
            <Button color="orange" onClick={() => navigate(`/client/applications/${id}/offer`)}>Выбрать вариант</Button>
            <Button variant="outline" color="gray" loading={busy} onClick={cancel}>Отказаться</Button>
          </Group>
        </Alert>
      )}

      {app.status === 'INFO_REQUESTED' && (
        <Alert color="orange" title="Нужны документы" mb={30}>
          {docs && docs.missing.length > 0 && (
            <List mb="md" size="sm">
              {docs.missing.map((m) => (
                <List.Item key={m.docType}>
                  {m.title}{m.comment ? <Text span c="dimmed"> — {m.comment}</Text> : null}
                </List.Item>
              ))}
            </List>
          )}
          <Button color="orange" onClick={() => navigate(`/client/applications/${id}/documents`)}>Загрузить документы</Button>
        </Alert>
      )}

      {app.status === 'MANUAL_REVIEW' && (
        <Alert color="blue" title="Заявку рассматривает специалист" mb={30}>
          Обычно это занимает до 1 рабочего дня. Если что-то понадобится, мы попросим здесь же — страница обновится сама.
        </Alert>
      )}

      {app.status === 'SIGNING' && (
        <Alert color="blue" title="Осталось подписать договор" mb={30}>
          <Button onClick={() => navigate(`/client/applications/${id}/signing`)}>Подписать договор</Button>
        </Alert>
      )}

      {app.status === 'ISSUED' && (
        <Alert color="green" title="Средства выданы" mb={30}>
          Деньги зачислены на счёт компании. Договор — на странице подписания.
          <Group mt="md">
            <Button variant="light" color="green" onClick={() => navigate(`/client/applications/${id}/signing`)}>Договор</Button>
          </Group>
        </Alert>
      )}

      {app.status === 'REJECTED' && (
        <Alert color="red" title="Основные причины отказа" mb={30}>
          {d && d.reasons.length > 0 && (
            <>
              <List size="sm" mb="md">
                {d.reasons.map((r) => <List.Item key={r}>{r}</List.Item>)}
              </List>
            </>
          )}
          <Button variant="outline" color="red" onClick={() => { resetDraft(); navigate('/client/product-select'); }}>
            Подать новую заявку
          </Button>
        </Alert>
      )}

      {app.status === 'CANCELLED' && (
        <Alert color="gray" title="Заявка отозвана" mb={30}>Заявка закрыта по вашему решению.</Alert>
      )}

      {d && !working && <ExplanationCard application={app} />}

      {history.length > 0 && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={30}>
          <Title order={5} mb="md">История заявки</Title>
          <Timeline active={history.length - 1} bulletSize={14} lineWidth={2}>
            {history.map((h) => (
              <Timeline.Item key={h.id} title={STATUS_LABELS[h.toStatus]}>
                <Text size="xs" c="dimmed">
                  {dateTime(h.createdAt)} · {h.actorType === 'CLIENT' ? 'вы' : h.actorType === 'ANALYST' ? 'специалист банка' : 'система'}
                </Text>
                {h.reason && <Text size="sm">{h.reason}</Text>}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      <Group justify="center">
        <Button variant="outline" onClick={() => navigate('/client/dashboard')}>
          К моим заявкам
        </Button>
        {CANCELLABLE.includes(app.status) && app.status !== 'COUNTER_OFFER' && (
          <Button variant="subtle" color="gray" loading={busy} onClick={cancel}>Отозвать заявку</Button>
        )}
      </Group>
    </Container>
  );
}
