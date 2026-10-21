import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return { status: 'ok' };
});

const port = Number(process.env.PORT ?? 4001);
app.listen({ port, host: '0.0.0.0' });
