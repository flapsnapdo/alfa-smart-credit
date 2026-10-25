import { AppShell, Group, Text, Button, Avatar } from '@mantine/core';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getToken, getUser } from '../lib/apiClient';
import { useApplicationStore } from '../store/applicationStore';

function initials(fullName: string): string {
  return fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/** Шапка кабинета. role — кого пускаем: клиента или аналитика */
export function CabinetLayout({ role }: { role: 'CLIENT' | 'ANALYST' }) {
  const navigate = useNavigate();
  const resetDraft = useApplicationStore((s) => s.reset);
  const user = getUser();

  if (!getToken() || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'ANALYST' ? '/analyst/dashboard' : '/client/dashboard'} replace />;
  }

  const logout = () => {
    clearSession();
    resetDraft();
    navigate('/login');
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="lg">
            <Text
              size="xl" fw={700} c="red" style={{ cursor: 'pointer' }}
              onClick={() => navigate(role === 'ANALYST' ? '/analyst/dashboard' : '/client/dashboard')}
            >
              Альфа-Кредит
            </Text>
            <Text size="sm" c="dimmed">
              {role === 'ANALYST' ? 'Кабинет аналитика' : 'Кабинет предпринимателя'}
            </Text>
          </Group>
          <Group>
            {role === 'CLIENT' && (
              <Button variant="subtle" onClick={() => navigate('/client/dashboard')}>
                Мои заявки
              </Button>
            )}
            <Avatar color={role === 'ANALYST' ? 'green' : 'blue'} radius="xl">{initials(user.fullName)}</Avatar>
            <Text size="sm" fw={500}>{user.fullName}</Text>
            <Button variant="subtle" color="red" onClick={logout}>
              Выйти
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export function ClientLayout() {
  return <CabinetLayout role="CLIENT" />;
}

export function AnalystLayout() {
  return <CabinetLayout role="ANALYST" />;
}
