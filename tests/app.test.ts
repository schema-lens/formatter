import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('formatter API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 404 for unknown paths', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(404);
  });

  it.each(['POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'] as const)('rejects %s /health', async (method) => {
    const response = await app.inject({ method, url: '/health' });
    expect(response.statusCode).toBe(405);
  });

  it('reports health, including query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health?probe=1',
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.json()).toEqual({ status: 'UP' });
  });

  it.each(['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'] as const)('rejects %s /oracle', async (method) => {
    const response = await app.inject({ method, url: '/oracle' });
    expect(response.statusCode).toBe(405);
  });

  it.each([undefined, 'text/plain', 'application/json', 'application/sql-invalid'])(
    'rejects unsupported content type %s',
    async (contentType) => {
      const response = await app.inject({
        method: 'POST',
        url: '/oracle',
        payload: 'SELECT 1 FROM dual;',
        headers: contentType ? { 'content-type': contentType } : {},
      });
      expect(response.statusCode).toBe(400);
    }
  );

  it('rejects unparseable SQL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/oracle',
      headers: { 'content-type': 'application/sql' },
      payload: "SELECT 'unterminated",
    });
    expect(response.statusCode).toBe(400);
  });

  it.each(['application/sql', 'application/sql; charset=utf-8'])('formats UTF-8 SQL with %s', async (contentType) => {
    const response = await app.inject({
      method: 'POST',
      url: '/oracle',
      headers: { 'content-type': contentType },
      payload: "SELECT 'Ísland' FROM dual;",
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/sql');
    expect(response.body).toBe("SELECT\n  'Ísland'\nFROM\n  dual;");
  });

  it('preserves the original Oracle DDL formatting', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/oracle',
      headers: { 'content-type': 'application/sql' },
      payload: fixture('oracle.input.sql'),
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(fixture('oracle.expected.sql').trim());
  });
});
