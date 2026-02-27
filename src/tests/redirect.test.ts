import request from 'supertest';

import app from '@/app';

describe('GET /api/auth/password-reset/redirect', () => {
  it('should return 400 HTML if token is missing', async () => {
    const res = await request(app).get('/api/auth/password-reset/redirect');

    expect(res.status).toBe(400);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('Token manquant');
  });

  it('should return 200 HTML with redirect page when token is provided', async () => {
    const token = 'abc123testtoken';

    const res = await request(app).get(
      `/api/auth/password-reset/redirect?token=${token}`,
    );

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain(token);
  });

  it('should embed the token in the deep link', async () => {
    const token = 'myresettoken42';

    const res = await request(app).get(
      `/api/auth/password-reset/redirect?token=${token}`,
    );

    expect(res.status).toBe(200);
    expect(res.text).toContain(`matcha://reset-password?token=${token}`);
  });
});
