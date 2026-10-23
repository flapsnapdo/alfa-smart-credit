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
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useApplicationStore } from '../../store/applicationStore';

export function LoginPage() {
  const navigate = useNavigate();
  const resetStore = useApplicationStore((s) => s.reset);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

const handleLogin = (role: 'CLIENT' | 'ANALYST') => {
  resetStore();
  setError(null);
  
  // Сохраняем тестовый токен
  localStorage.setItem('auth_token', 'demo-token-' + role.toLowerCase());
  
  if (role === 'CLIENT') {
    navigate('/client/product-select');
  } else {
    navigate('/analyst/dashboard');
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
          Умный кредитный кабинет для бизнеса. Подберём лучшие условия за 5 минут.
        </Text>
        <Stack gap="md">
          <Group>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              
            </div>
            <Text>Решение за 1 рабочий день</Text>
          </Group>
          <Group>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📊
            </div>
            <Text>Ставки от 14% годовых</Text>
          </Group>
          <Group>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              
            </div>
            <Text>До 5 млрд ₽ на любые цели</Text>
          </Group>
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
            <Alert color="red" mb="lg" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="hello@alfa.ru"
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
            <Button size="lg" color="red" fullWidth mt="md">
              Войти
            </Button>
          </Stack>

          <Divider my="xl" label="Быстрый вход для демо" labelPosition="center" />

          <Group grow>
            <Button variant="light" color="blue" onClick={() => handleLogin('CLIENT')}>
              Я Клиент
            </Button>
            <Button variant="light" color="green" onClick={() => handleLogin('ANALYST')}>
              Я Аналитик
            </Button>
          </Group>
        </div>
      </div>
    </div>
  );
}