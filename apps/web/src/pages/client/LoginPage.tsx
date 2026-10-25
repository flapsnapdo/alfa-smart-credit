import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Group,
  Divider,
  Stack,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import { IconClockHour4, IconFileCheck, IconMessageCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, saveSession } from '../../lib/apiClient';
import { useApplicationStore } from '../../store/applicationStore';

const DEMO_PASSWORD = 'Demo2026!';

const DEMO_USERS = [
  { email: 'igor@demo.ru', label: 'Игорь', hint: 'одобрение', color: 'blue' },
  { email: 'olga@demo.ru', label: 'Ольга', hint: '3 компании', color: 'blue' },
  { email: 'anna@demo.ru', label: 'Анна', hint: 'дозапрос', color: 'blue' },
  { email: 'kozlov@demo.ru', label: 'Козлов', hint: 'отказ', color: 'blue' },
  { email: 'analyst@demo.ru', label: 'Аналитик', hint: 'кабинет банка', color: 'green' },
];

const FEATURES = [
  { icon: IconClockHour4, text: 'Решение за минуты — без визита в банк' },
  { icon: IconMessageCircle, text: 'Каждый этап и решение объясняем простыми словами' },
  { icon: IconFileCheck, text: 'Документы и подпись договора — прямо в кабинете' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const resetStore = useApplicationStore((s) => s.reset);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const login = async (loginEmail: string, loginPassword: string) => {
    setError(null);
    setLoading(loginEmail);
    try {
      const { token, user } = await api.login(loginEmail, loginPassword);
      saveSession(token, user);
      resetStore();
      navigate(user.role === 'ANALYST' ? '/analyst/dashboard' : '/client/dashboard');
    } catch (err) {
      // Ошибки проверки полей приходят от API на английском — для входа достаточно общего текста
      setError(err instanceof ApiError && err.code === 'VALIDATION_ERROR' ? 'Проверьте email и пароль' : (err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Левая часть — фото */}
      <div
        style={{
          flex: 1,
          background: `
            linear-gradient(135deg, rgba(239, 49, 36, 0.85) 0%, rgba(201, 42, 42, 0.9) 100%),
            url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')
          `,
          backgroundColor: '#c92a2a',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          color: 'white',
        }}
      >
        <Title order={1} size={48} mb={20} fw={700} style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          Альфа-Кредит
        </Title>
        <Text size="xl" mb={40} style={{ opacity: 0.9, maxWidth: 500 }}>
          Умный кредитный кабинет для бизнеса: подберём продукт под вашу задачу и покажем, что происходит с заявкой.
        </Text>
        <Stack gap="md">
          {FEATURES.map(({ icon: Icon, text }) => (
            <Group key={text} wrap="nowrap">
              <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} />
              </div>
              <Text>{text}</Text>
            </Group>
          ))}
        </Stack>
      </div>

      {/* Правая часть — форма */}
      <div
        style={{
          width: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          padding: 40,
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Title order={2} mb={5} ta="center">
            Вход в кабинет
          </Title>
          <Text c="dimmed" ta="center" mb={40}>
            Альфа-Банк • Хакатон 2026
          </Text>

          {error && (
            <Alert color="red" mb="lg" onClose={() => setError(null)} withCloseButton>
              {error}
            </Alert>
          )}

          <form onSubmit={(e) => { e.preventDefault(); login(email, password); }}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="igor@demo.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <PasswordInput
                label="Пароль"
                placeholder="Ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" size="lg" color="red" fullWidth mt="md" loading={loading === email && !!email}>
                Войти
              </Button>
            </Stack>
          </form>

          <Divider my="xl" label={`Быстрый вход для демо · пароль ${DEMO_PASSWORD}`} labelPosition="center" />

          <SimpleGrid cols={2} spacing="xs">
            {DEMO_USERS.map((u) => (
              <Button
                key={u.email}
                variant="light"
                color={u.color}
                loading={loading === u.email}
                onClick={() => login(u.email, DEMO_PASSWORD)}
                styles={{ label: { flexDirection: 'column', lineHeight: 1.2 } }}
                h={52}
              >
                <span>{u.label}</span>
                <Text span size="xs" c="dimmed">{u.hint}</Text>
              </Button>
            ))}
          </SimpleGrid>
        </div>
      </div>
    </div>
  );
}
