import { buildApp } from './app.ts';

const port = Number(process.env.PORT ?? 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const app = buildApp({ logger: true });

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    const timeout = setTimeout(() => process.exit(1), 25_000).unref();

    try {
      await app.close();
    } catch (error) {
      app.log.error(error);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  });
}

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
