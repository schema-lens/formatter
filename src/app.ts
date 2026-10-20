import Fastify from 'fastify';
import { formatOracleSql } from './format.ts';

export const buildApp = ({ logger = false } = {}) => {
  const app = Fastify({ logger, exposeHeadRoutes: false });

  app.addContentTypeParser('application/sql', { parseAs: 'string' }, (_request, body, done) => {
    done(null, body);
  });

  app.all(
    '/health',
    {
      onRequest: async (request, reply) => {
        if (request.method !== 'GET') {
          return reply.code(405).send();
        }
      },
    },
    async (_request, reply) => {
      return reply.type('application/json').send({ status: 'UP' });
    }
  );

  app.all<{ Body: string }>(
    '/oracle',
    {
      onRequest: async (request, reply) => {
        if (request.method !== 'POST') {
          return reply.code(405).send();
        }
        const contentType = request.headers['content-type'];
        if (contentType !== 'application/sql' && !contentType?.startsWith('application/sql;')) {
          return reply.code(400).send();
        }
      },
    },
    async (request, reply) => {
      try {
        const sql = formatOracleSql(request.body ?? '');
        return reply.type('application/sql').send(Buffer.from(sql));
      } catch {
        return reply.code(400).send();
      }
    }
  );

  app.setNotFoundHandler((_request, reply) => reply.code(404).send());
  return app;
};
