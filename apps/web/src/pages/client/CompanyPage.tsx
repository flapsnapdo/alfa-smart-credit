import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  TextInput,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  Divider,
  Select,
  Alert,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

export function CompanyPage() {
  const navigate = useNavigate();
  const [inn, setInn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registryData, setRegistryData] = useState<any>(null);
  const [manualMode, setManualMode] = useState(false);
  const [formData, setFormData] = useState<any>({
    inn: '',
    type: 'LLC',
    name: '',
  });

  const handleSearch = async () => {
    if (inn.length < 10) {
      setError('ИНН должен содержать 10 или 12 цифр');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.registry.lookup(inn);
      setRegistryData(data);
      setFormData({
        inn: data.inn,
        ogrn: data.ogrn,
        type: data.type,
        name: data.name,
        okved: data.okved,
        address: data.address,
        directorName: data.directorName,
      });
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске компании');
    } finally {
      setLoading(false);
    }
  };

  const handleUseRegistryData = async () => {
    try {
      await apiClient.companies.create(formData);
      navigate('/client/financials');
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении компании');
    }
  };

  const handleManualSubmit = async () => {
    try {
      await apiClient.companies.create(formData);
      navigate('/client/financials');
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении компании');
    }
  };

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>
        Данные компании
      </Title>
      <Text c="dimmed" ta="center" mb={40}>
        Введите ИНН, и мы найдём данные вашей компании в реестре ЕГРЮЛ
      </Text>

      {error && (
        <Alert color="red" mb="lg" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Поиск по ИНН */}
      {!registryData && !manualMode && (
        <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
          <Stack>
            <TextInput
              label="ИНН компании"
              placeholder="Введите 10 или 12 цифр"
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              maxLength={12}
              required
            />
            <Button onClick={handleSearch} loading={loading} disabled={inn.length < 10}>
              Найти компанию
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Карточка из реестра */}
      {registryData && !manualMode && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
          <Group justify="space-between" mb="md">
            <Title order={4}>Данные из реестра ЕГРЮЛ</Title>
            <Badge color="green">{registryData.status}</Badge>
          </Group>

          <Stack gap="sm">
            <div>
              <Text size="sm" c="dimmed">Название</Text>
              <Text fw={500}>{registryData.name}</Text>
            </div>
            <Divider />
            <div>
              <Text size="sm" c="dimmed">ИНН</Text>
              <Text>{registryData.inn}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">ОГРН</Text>
              <Text>{registryData.ogrn}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Юридический адрес</Text>
              <Text>{registryData.address}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">ОКВЭД</Text>
              <Text>{registryData.okved}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Руководитель</Text>
              <Text>{registryData.directorName}</Text>
            </div>
          </Stack>

          <Group mt="xl" grow>
            <Button variant="light" onClick={() => setManualMode(true)}>
              Ввести вручную
            </Button>
            <Button onClick={handleUseRegistryData}>
              Всё верно, использовать эти данные
            </Button>
          </Group>
        </Card>
      )}

      {/* Ручной ввод */}
      {manualMode && (
        <Paper shadow="sm" p="xl" radius="md" withBorder mb={40}>
          <Title order={4} mb="md">
            Введите данные компании вручную
          </Title>
          <Stack>
            <TextInput
              label="ИНН"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              required
            />
            <Select
              label="Тип компании"
              data={[
                { value: 'LLC', label: 'ООО' },
                { value: 'IE', label: 'ИП' },
              ]}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              required
            />
            <TextInput
              label="Название компании"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextInput
              label="ОГРН"
              value={formData.ogrn}
              onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })}
            />
            <TextInput
              label="ОКВЭД"
              value={formData.okved}
              onChange={(e) => setFormData({ ...formData, okved: e.target.value })}
            />
            <TextInput
              label="Юридический адрес"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <TextInput
              label="Руководитель"
              value={formData.directorName}
              onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
            />
          </Stack>

          <Group mt="xl" grow>
            <Button variant="light" onClick={() => setManualMode(false)}>
              Вернуться к поиску
            </Button>
            <Button onClick={handleManualSubmit}>
              Далее → Финансы
            </Button>
          </Group>
        </Paper>
      )}
    </Container>
  );
}