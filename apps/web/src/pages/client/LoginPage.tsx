import {
  Button,
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  // Форма с валидацией
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Некорректный email'),
      password: (value) => (value.length >= 6 ? null : 'Пароль должен быть не менее 6 символов'),
    },
  });

  // Обработчик входа (пока имитация)
  const handleLogin = (values: typeof form.values, role?: 'client' | 'analyst') => {
    console.log('Вход:', values, role ? `Роль: ${role}` : '');
    
    // Имитация задержки сети
    setTimeout(() => {
      if (role === 'analyst') {
        navigate('/analyst/dashboard');
      } else {
        navigate('/client/product-select');
      }
    }, 500);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" style={{ fontSize: '2rem', fontWeight: 700 }}>
        Умный кредитный кабинет 🚀
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Альфа-Хакатон 2026
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {/* Основная форма входа */}
        <form onSubmit={form.onSubmit((values) => handleLogin(values))}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="hello@alfa.ru"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Пароль"
              placeholder="Ваш пароль"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" fullWidth mt="xl">
              Войти
            </Button>
          </Stack>
        </form>

        {/* Кнопки быстрого входа для демо */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <Text size="xs" c="dimmed" ta="center" mb="xs">
            Быстрый вход для демонстрации (без пароля):
          </Text>
          <Group grow>
            <Button
              variant="light"
              color="blue"
              onClick={() => handleLogin({ email: 'client@test.ru', password: '123456' }, 'client')}
            >
              Я Клиент
            </Button>
            <Button
              variant="light"
              color="green"
              onClick={() => handleLogin({ email: 'analyst@test.ru', password: '123456' }, 'analyst')}
            >
              Я Аналитик
            </Button>
          </Group>
        </div>
      </Paper>
    </Container>
  );
}