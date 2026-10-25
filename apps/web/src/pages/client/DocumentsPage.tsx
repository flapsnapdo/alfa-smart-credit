import { useCallback, useEffect, useState } from 'react';
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
  Loader,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { IconUpload, IconFileCheck, IconFile } from '@tabler/icons-react';
import { api } from '../../lib/apiClient';
import { DOC_TYPES, dateTime } from '../../lib/format';
import type { Application, DocType, DocumentsInfo } from '../../lib/types';

function docLabel(docType: DocType): string {
  return DOC_TYPES.find((d) => d.value === docType)?.label ?? docType;
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [app, setApp] = useState<Application | null>(null);
  const [info, setInfo] = useState<DocumentsInfo | null>(null);
  const [files, setFiles] = useState<Partial<Record<DocType, File | null>>>({});
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, i] = await Promise.all([api.application(id), api.documents(id)]);
      setApp(a);
      setInfo(i);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const upload = async (docType: DocType) => {
    const file = files[docType];
    if (!file) return;
    setUploading(docType);
    setError(null);
    try {
      const { missing } = await api.uploadDocument(id, docType, file);
      setFiles((f) => ({ ...f, [docType]: null }));
      // Загружено всё, что просил банк, — заявка продолжается сама, возвращаемся к статусу
      if (missing.length === 0 && app?.status === 'INFO_REQUESTED') {
        navigate(`/client/applications/${id}`);
        return;
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  if (!info || !app) {
    return (
      <Container size="md" py={40}>
        {error ? <Alert color="red">{error}</Alert> : <Group justify="center"><Loader /></Group>}
      </Container>
    );
  }

  const canUpload = app.status === 'DRAFT' || app.status === 'INFO_REQUESTED';

  return (
    <Container size="md" py={40}>
      <Title ta="center" mb={10}>Документы</Title>
      <Text c="dimmed" ta="center" mb={40}>
        Заявка {app.number} · {app.company.name}
      </Text>

      {error && <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>{error}</Alert>}

      {info.missing.length > 0 ? (
        <Stack gap="md" mb={40}>
          <Text fw={600}>Банк просит загрузить</Text>
          {info.missing.map((m) => (
            <Card key={m.docType} shadow="sm" padding="lg" radius="md" withBorder>
              <Group align="flex-start" wrap="nowrap">
                <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 8, background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFile size={24} color="#868e96" />
                </div>
                <div style={{ flex: 1 }}>
                  <Group mb={5}>
                    <Title order={5}>{m.title}</Title>
                    <Badge color="red">Обязательно</Badge>
                  </Group>
                  {m.comment && <Text size="sm" c="dimmed" mb="md">{m.comment}</Text>}
                  {canUpload && (
                    <Group align="flex-end">
                      <FileInput
                        style={{ flex: 1 }}
                        placeholder="PDF, JPG или PNG до 10 МБ"
                        value={files[m.docType] ?? null}
                        onChange={(file) => setFiles((f) => ({ ...f, [m.docType]: file }))}
                        accept=".pdf,.jpg,.jpeg,.png"
                        leftSection={<IconUpload size={16} />}
                        clearable
                      />
                      <Button
                        color="red"
                        disabled={!files[m.docType]}
                        loading={uploading === m.docType}
                        onClick={() => upload(m.docType)}
                      >
                        Загрузить
                      </Button>
                    </Group>
                  )}
                </div>
              </Group>
            </Card>
          ))}
        </Stack>
      ) : (
        <Alert color="green" mb={40} title="Все нужные документы загружены">
          {app.status === 'INFO_REQUESTED' ? 'Заявка продолжает обработку.' : 'Банку больше ничего не нужно.'}
        </Alert>
      )}

      {info.documents.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb={40}>
          <Text fw={600} mb="md">Загруженные документы</Text>
          <Stack gap="sm">
            {info.documents.map((doc) => (
              <Group key={doc.id} justify="space-between">
                <Group gap="sm">
                  <IconFileCheck size={20} color="#2b8a3e" />
                  <div>
                    <Text size="sm" fw={500}>{docLabel(doc.docType)}</Text>
                    <Text size="xs" c="dimmed">{doc.fileName} · {Math.ceil(doc.sizeBytes / 1024)} КБ · {dateTime(doc.createdAt)}</Text>
                  </div>
                </Group>
                <Button size="xs" variant="subtle" onClick={() => api.openDocument(id, doc.id).catch((e) => setError(e.message))}>
                  Открыть
                </Button>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      <Group justify="center">
        <Button variant="outline" onClick={() => navigate(`/client/applications/${id}`)}>
          К статусу заявки
        </Button>
      </Group>
    </Container>
  );
}
