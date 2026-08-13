const sendMail = jest.fn().mockResolvedValue({ messageId: 'message-id' });
const createTransport = jest.fn(() => ({ sendMail }));
const createTestAccount = jest.fn().mockResolvedValue({
  smtp: { host: 'smtp.test', port: 587, secure: false },
  user: 'test-user',
  pass: 'test-pass',
});
const getTestMessageUrl = jest.fn(() => 'https://preview.test/message-id');

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport,
    createTestAccount,
    getTestMessageUrl,
  },
  createTransport,
  createTestAccount,
  getTestMessageUrl,
}));

jest.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'development',
    APP_NAME: 'Matcha',
    SMTP_USER: 'hello@matcha.test',
    API_URL: 'https://api.matcha.test',
    FRONTEND_URL: 'https://app.matcha.test',
    SMTP_HOST: 'smtp.matcha.test',
    SMTP_PORT: 587,
    SMTP_PASS: 'smtp-password',
  },
}));

jest.unmock('@/services/notifications/email');

describe('email notification templates', () => {
  beforeEach(() => {
    sendMail.mockClear();
    createTransport.mockClear();
    createTestAccount.mockClear();
    getTestMessageUrl.mockClear();
  });

  it('sends a branded validation email with html and text fallback', async () => {
    const { sendValidationEmail } =
      await import('@/services/notifications/email');

    await sendValidationEmail('user@example.com', 'verify-token');

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Matcha" <hello@matcha.test>',
        to: 'user@example.com',
        subject: 'Confirme ton adresse email',
        html: expect.stringContaining('Confirme ton adresse email'),
        text: expect.stringContaining(
          'https://api.matcha.test/api/users/verify-email?token=verify-token'
        ),
      })
    );
    expect(sendMail.mock.calls[0][0].html).toContain('background:#2A7F68');
    expect(sendMail.mock.calls[0][0].html).toContain('Confirmer mon email');
  });

  it('sends a reset password email pointing to the mobile redirect page', async () => {
    const { sendResetPasswordEmail } =
      await import('@/services/notifications/email');

    await sendResetPasswordEmail('user@example.com', 'reset-token');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Réinitialise ton mot de passe',
        html: expect.stringContaining(
          'https://api.matcha.test/api/auth/password-reset/redirect?token=reset-token'
        ),
        text: expect.stringContaining(
          'Ce lien est valable pendant 15 minutes.'
        ),
      })
    );
  });

  it('sends an email change verification email', async () => {
    const { sendEmailChangeVerification } =
      await import('@/services/notifications/email');

    await sendEmailChangeVerification('new@example.com', 'change-token');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new@example.com',
        subject: 'Confirme ton nouvel email',
        html: expect.stringContaining('Confirmer mon nouvel email'),
      })
    );
  });
});
