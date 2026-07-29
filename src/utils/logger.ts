/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

type LogContext = Record<string, unknown>;

const LOG_LEVELS: Record<Exclude<LogLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === 'test'
    ? 'silent'
    : process.env.NODE_ENV === 'production'
      ? 'info'
      : 'debug');

const currentLevel =
  configuredLevel in LOG_LEVELS || configuredLevel === 'silent'
    ? configuredLevel
    : 'debug';

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'password',
  'passwordHash',
  'token',
  'resetToken',
  'jwt',
  'secret',
  'smtp_pass',
  'client_secret',
];

function shouldLog(level: Exclude<LogLevel, 'silent'>) {
  if (currentLevel === 'silent') return false;
  return (
    LOG_LEVELS[level] >= LOG_LEVELS[currentLevel as Exclude<LogLevel, 'silent'>]
  );
}

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : value.stack,
    };
  }

  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      const normalizedKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
        normalizedKey.includes(sensitiveKey)
      );

      return [key, isSensitive ? '[redacted]' : redact(item)];
    })
  );
}

function write(
  level: Exclude<LogLevel, 'silent'>,
  message: string,
  context?: LogContext
) {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
    ...(context ? { context: redact(context) } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    write('debug', message, context),
  info: (message: string, context?: LogContext) =>
    write('info', message, context),
  warn: (message: string, context?: LogContext) =>
    write('warn', message, context),
  error: (message: string, context?: LogContext) =>
    write('error', message, context),
  startup: ({
    name,
    port,
    url,
  }: {
    name: string;
    port: number;
    url: string;
  }) => {
    if (!shouldLog('info')) return;

    if (process.env.NODE_ENV === 'production') {
      write('info', 'server_started', { name, port, url });
      return;
    }

    console.log('');
    console.log(`✅ ${name} is running`);
    console.log(`   Local: ${url}`);
    console.log(`   Port:  ${port}`);
    console.log('');
  },
};
