import { AppShell, Group, Text, Button, Avatar } from '@mantine/core';
import { Outlet, useNavigate } from 'react-router-dom';

export function ClientLayout() {
  const navigate = useNavigate();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      {/* Шапка кабинета */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text size="xl" fw={700} color="red">
              🚀 Альфа-Кредит
            </Text>
          </Group>
          <Group>
            <Avatar color="blue" radius="xl">ИИ</Avatar>
            <Text size="sm" fw={500}>Иван Иванов (Тестовый клиент)</Text>
            <Button variant="subtle" color="red" onClick={() => navigate('/login')}>
              Выйти
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Сюда будут подставляться страницы К1-К9 */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}