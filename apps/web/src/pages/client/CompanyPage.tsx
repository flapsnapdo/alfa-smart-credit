import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  Divider,
  Alert,
  Loader,
  Radio,
  SimpleGrid,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import type { Company, RegistryRecord } from '../../lib/types';
import { useApplicationStore } from '../../store/applicationStore';

const STATUS: Record<Company['status'], { label: string; color: string }> = {
  ACTIVE: { label: 'Действующая', color: 'green' },
  LIQUIDATING: { label: 'В процессе ликвидации', color: 'orange' },
  LIQUIDATED: { label: 'Ликвидирована', color: 'red' },
  BANKRUPT: { label: 'Банкротство', color: 'red' },
};

const POSITION: Record<Company['position'], string> = {
  OWNER: 'владелец', CEO: 'руководитель', CFO: 'финансовый директор', ACCOUNTANT: 'бухгалтер', OTHER: 'сотрудник',
};

export function CompanyPage() {
  const navigate = useNavigate();
  const { purpose, companyId, setCompany } = useApplicationStore();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selected, setSelected] = useState<string | null>(companyId);
  const [registry, setRegistry] = useState<{ data?: RegistryRecord; error?: string; loading: boolean }>({ loading: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purpose) {
      navigate('/client/product-select', { replace: true });
      return;
    }
    api.me()
      .then(({ companies }) => {
        setCompanies(companies);
        if (!selected && companies.length === 1) setSelected(companies[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const company = companies?.find((c) => c.id === selected) ?? null;

  // Сверяем выбранную компанию с реестром ЕГРЮЛ/ЕГРИП (через заглушку)
  useEffect(() => {
    if (!company) return;
    setRegistry({ loading: true });
    api.registryLookup(company.inn)
      .then((data) => setRegistry({ data, loading: false }))
      .catch((e) => setRegistry({ error: e.message, loading: false }));
  }, [company?.inn]);

  const handleContinue = () => {
    if (!company) return;
    setCompany(company.id, company.name);
    navigate('/client/review');
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Компания
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        {companies && companies.length > 1
          ? 'Выберите компанию, для которой оформляете кредит'
          : 'Проверьте данные компании'}
      </Text>

      {error && <Alert color="red" mb="lg">{error}</Alert>}
      {!companies && !error && <Group justify="center"><Loader /></Group>}

      {companies && (
        <Radio.Group value={selected} onChange={setSelected}>
          <Stack gap="md" mb={40}>
            {companies.map((c) => (
              <Card
                key={c.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  border: selected === c.id ? '2px solid #EF3124' : '1px solid #dee2e6',
                  background: selected === c.id ? '#fff5f5' : 'white',
                }}
                onClick={() => setSelected(c.id)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <Radio value={c.id} />
                    <div>
                      <Text fw={600}>{c.name}</Text>
                      <Text size="sm" c="dimmed">ИНН {c.inn} · вы — {POSITION[c.position]}</Text>
                    </div>
                  </Group>
                  <Badge color={STATUS[c.status].color}>{STATUS[c.status].label}</Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        </Radio.Group>
      )}

      {company && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Group justify="space-between" mb="md">
            <Title order={4}>Данные из реестра</Title>
            {registry.loading && <Loader size="sm" />}
            {registry.data && (
              <Badge color="green" leftSection={<IconCircleCheck size={14} />}>Сверено с ЕГРЮЛ/ЕГРИП</Badge>
            )}
          </Group>
          {registry.error && (
            <Alert color="yellow" mb="md">
              {registry.error}. Показываем данные, которые уже есть у банка.
            </Alert>
          )}
          <Stack gap="sm">
            <div>
              <Text size="sm" c="dimmed">Название</Text>
              <Text fw={500}>{company.name}</Text>
            </div>
            <Divider />
            <SimpleGrid cols={2}>
              <div>
                <Text size="sm" c="dimmed">ИНН</Text>
                <Text>{company.inn}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">ОГРН</Text>
                <Text>{company.ogrn ?? '—'}</Text>
              </div>
            </SimpleGrid>
            <div>
              <Text size="sm" c="dimmed">Вид деятельности (ОКВЭД)</Text>
              <Text>{company.okved} {company.okvedName}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Адрес</Text>
              <Text>{company.address ?? '—'}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Руководитель</Text>
              <Text>{company.directorName ?? '—'}</Text>
            </div>
          </Stack>
          <Text size="xs" c="dimmed" mt="lg">
            Выручку и платежи по кредитам банк возьмёт из своих данных и кредитной истории — вводить их не нужно.
          </Text>
        </Card>
      )}

      <Group>
        <Button variant="outline" onClick={() => navigate('/client/product-select')}>
          Назад
        </Button>
        <Button size="lg" color="red" style={{ flex: 1 }} disabled={!selected} onClick={handleContinue}>
          Всё верно, продолжить
        </Button>
      </Group>
    </Container>
  );
}
