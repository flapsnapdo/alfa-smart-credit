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
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';


export function A1() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

const fetchApplications = async () => {
  try {
    const res = await fetch('/api/v1/analyst/applications');
    const data = await res.json();
    setApplications(data);
  } catch (err) {
    console.error(err);
  }
};

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return 'blue';
      case 'UNDER_REVIEW': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return 'Новая';
      case 'UNDER_REVIEW': return 'На проверке';
      case 'APPROVED': return 'Одобрена';
      case 'REJECTED': return 'Отклонена';
      default: return s;
    }
  };

  const filtered = applications.filter((app) => {
    const matchFilter = filter === 'all' || app.status === filter;
    const matchSearch = app.companyName.toLowerCase().includes(search.toLowerCase()) ||
                       app.number.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <Container size="xl" py={40}>
      <Title mb={10}>Очередь заявок</Title>
      <Text c="dimmed" mb={40}>
        Всего заявок: {applications.length} • На рассмотрении: {applications.filter(a => a.status === 'SUBMITTED').length}
      </Text>

      <Paper shadow="sm" p="md" radius="md" withBorder mb={40}>
        <Group>
          <TextInput
            placeholder="Поиск по компании или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            value={filter}
            onChange={(val) => val && setFilter(val)}
            data={[
              { value: 'all', label: 'Все статусы' },
              { value: 'SUBMITTED', label: 'Новые' },
              { value: 'UNDER_REVIEW', label: 'На проверке' },
              { value: 'APPROVED', label: 'Одобрены' },
              { value: 'REJECTED', label: 'Отклонены' },
            ]}
            style={{ width: 200 }}
          />
        </Group>
      </Paper>

      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Номер</Table.Th>
              <Table.Th>Компания</Table.Th>
              <Table.Th>ИНН</Table.Th>
              <Table.Th>Сумма</Table.Th>
              <Table.Th>Срок</Table.Th>
              <Table.Th>Скоринг</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Действие</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((app) => (
              <Table.Tr key={app.id}>
                <Table.Td>
                  <Text fw={600} size="sm">{app.number}</Text>
                </Table.Td>
                <Table.Td>{app.companyName}</Table.Td>
                <Table.Td>{app.inn}</Table.Td>
                <Table.Td>{app.amount.toLocaleString('ru-RU')} ₽</Table.Td>
                <Table.Td>{app.term} мес</Table.Td>
                <Table.Td>
                  <Badge
                    color={app.score >= 70 ? 'green' : app.score >= 50 ? 'yellow' : 'red'}
                  >
                    {app.score}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    color="red"
                    onClick={() => navigate(`/analyst/application/${app.id}`)}
                  >
                    Открыть
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filtered.length === 0 && (
          <Text ta="center" c="dimmed" py="xl">
            Заявки не найдены
          </Text>
        )}
      </Card>
    </Container>
  );
}
