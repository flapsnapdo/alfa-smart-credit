import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  FileInput,
  Alert,
  Badge,
  Progress,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconUpload, IconFileCheck, IconFile } from '@tabler/icons-react';

interface Document {
  id: string;
  name: string;
  description: string;
  required: boolean;
  file: File | null;
  uploaded: boolean;
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'passport',
      name: 'Паспорт директора',
      description: 'Скан главной страницы и страницы с пропиской',
      required: true,
      file: null,
      uploaded: false,
    },
    {
      id: 'egrul',
      name: 'Выписка из ЕГРЮЛ',
      description: 'Актуальная выписка (не старше 30 дней)',
      required: true,
      file: null,
      uploaded: false,
    },
    {
      id: 'financials',
      name: 'Финансовая отчётность',
      description: 'Бухгалтерский баланс за последний год',
      required: true,
      file: null,
      uploaded: false,
    },
    {
      id: 'contracts',
      name: 'Договоры с контрагентами',
      description: 'Основные действующие договоры (опционально)',
      required: false,
      file: null,
      uploaded: false,
    },
  ]);

  const handleFileUpload = (id: string, file: File | null) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === id ? { ...doc, file, uploaded: !!file } : doc
      )
    );
  };

  const allRequiredUploaded = documents
    .filter((d) => d.required)
    .every((d) => d.uploaded);

  const uploadedCount = documents.filter((d) => d.uploaded).length;
  const progress = (uploadedCount / documents.length) * 100;

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Загрузка документов</Title>
      <Text c="dimmed" ta="center" mb={40}>
        Загрузите необходимые документы для рассмотрения заявки
      </Text>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb={40}>
        <Group justify="space-between" mb="md">
          <Text fw={600}>Прогресс загрузки</Text>
          <Badge color="blue">
            {uploadedCount} / {documents.length}
          </Badge>
        </Group>
        <Progress value={progress} color="red" size="lg" />
      </Card>

      <Stack gap="md" mb={40}>
        {documents.map((doc) => (
          <Card
            key={doc.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              border: doc.uploaded ? '2px solid #2b8a3e' : '1px solid #dee2e6',
              background: doc.uploaded ? '#f8f9fa' : 'white',
            }}
          >
            <Group align="flex-start">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: doc.uploaded ? '#d3f9d8' : '#f1f3f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {doc.uploaded ? (
                  <IconFileCheck size={24} color="#2b8a3e" />
                ) : (
                  <IconFile size={24} color="#868e96" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Group mb={5}>
                  <Title order={5}>{doc.name}</Title>
                  {doc.required && <Badge color="red">Обязательно</Badge>}
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                  {doc.description}
                </Text>
                <FileInput
                  placeholder={doc.uploaded ? doc.file?.name : 'Выберите файл'}
                  value={doc.file}
                  onChange={(file) => handleFileUpload(doc.id, file)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  leftSection={<IconUpload size={16} />}
                  size="sm"
                />
              </div>
            </Group>
          </Card>
        ))}
      </Stack>

      {allRequiredUploaded && (
        <Alert color="green" mb="lg" title="Все обязательные документы загружены">
          Можете переходить к следующему шагу
        </Alert>
      )}

      <Group>
        <Button
          size="lg"
          color="red"
          onClick={() => navigate('/client/offer')}
          disabled={!allRequiredUploaded}
          style={{ flex: 1 }}
        >
          Перейти к оферте
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/client/status')}
        >
          Назад
        </Button>
      </Group>
    </Container>
  );
}