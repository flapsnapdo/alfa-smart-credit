import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Badge,
  Group,
  Button,
  Paper,
  TextInput,
  Select,
  Alert,
  Loader,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { GRADE_COLORS, STATUS_LABELS, dateTime, months, rub, statusColor } from '../../lib/format';
import type { ApplicationStatus, QueueItem } from '../../lib/types';

const FILTERS: { value: ApplicationStatus; label: string }[] = [
  { value: 'MANUAL_REVIEW', label: 'Ждут решения специалиста' },
  { value: 'INFO_REQUESTED', label: 'Ждут документов от клиента' },
  { value: 'APPROVED', label: 'Одобрены' },
  { value: 'COUNTER_OFFER', label: 'Контрпредложение' },
  { value: 'SIGNING', label: 'Подписание' },
  { value: 'ISSUED', label: 'Выданы' },
  { value: 'REJECTED', label: 'Отказы' },
  { value: 'CANCELLED', label: 'Отозваны клиентом' },
];

/** Сколько заявка ждёт: «12 мин», «3 ч», «2 дн» */
function waiting(since: string | null): string {
  if (!since) return '—';
  const min = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60_000));
  if (min < 60) return `${min} мин`;
  if (min < 24 * 60) return `${Math.round(min / 60)} ч`;
  return `${Math.round(min / (24 * 60))} дн`;
}

export function A1() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<QueueItem[] | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus>('MANUAL_REVIEW');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApplications(null);
    api.analystQueue(filter)
      .then((items) => { setApplications(items); setError(null); })
      .catch((e) => setError(e.message));
  }, [filter]);

  const q = search.trim().toLowerCase();
  const filtered = (applications ?? []).filter((app) =>
    !q || app.company.name.toLowerCase().includes(q) || app.number.toLowerCase().includes(q) || app.company.inn.includes(q));

  return (
    <Container size="xl" py={40}>
      <Title mb={10}>Очередь заявок</Title>
      <Text c="dimmed" mb={40}>
        {FILTERS.find((f) => f.value === filter)?.label}: {applications?.length ?? '…'} · самые давние сверху
      </Text>

      {error && <Alert color="red" mb="lg">{error}</Alert>}

      <Paper shadow="sm" p="md" radius="md" withBorder mb={40}>
        <Group>
          <TextInput
            placeholder="Поиск по компании, ИНН или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            value={filter}
            onChange={(val) => val && setFilter(val as ApplicationStatus)}
            data={FILTERS}
            allowDeselect={false}
            style={{ width: 280 }}
          />
        </Group>
      </Paper>

      <Card shadow="sm" padding="md" radius="md" withBorder>
        {!applications && !error ? (
          <Group justify="center" py="xl"><Loader /></Group>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Номер</Table.Th>
                <Table.Th>Компания</Table.Th>
                <Table.Th>Продукт</Table.Th>
                <Table.Th>Сумма</Table.Th>
                <Table.Th>Срок</Table.Th>
                <Table.Th>Скоринг</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Ждёт</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((app) => (
                <Table.Tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/analyst/application/${app.id}`)}>
                  <Table.Td><Text fw={600} size="sm">{app.number}</Text></Table.Td>
                  <Table.Td>
                    <Text size="sm">{app.company.name}</Text>
                    <Text size="xs" c="dimmed">ИНН {app.company.inn}</Text>
                  </Table.Td>
                  <Table.Td>{app.product.name}</Table.Td>
                  <Table.Td>{rub(app.requested.amount)}</Table.Td>
                  <Table.Td>{months(app.requested.term)}</Table.Td>
                  <Table.Td>
                    {app.grade ? (
                      <Badge color={GRADE_COLORS[app.grade]}>{app.score} · {app.grade}</Badge>
                    ) : (
                      <Text size="sm" c="dimmed">нет данных</Text>
                    )}
                  </Table.Td>
                  <Table.Td><Badge color={statusColor(app.status)}>{STATUS_LABELS[app.status]}</Badge></Table.Td>
                  <Table.Td>
                    <Text size="sm" title={app.submittedAt ? dateTime(app.submittedAt) : undefined}>{waiting(app.submittedAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" color="red">Открыть</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {applications && filtered.length === 0 && (
          <Text ta="center" c="dimmed" py="xl">
            Заявок нет
          </Text>
        )}
      </Card>
    </Container>
  );
}
