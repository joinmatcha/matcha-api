import app from '@/app';
import { connectDB } from '@/config/db';
import { env } from '@/config/env';
import { ensureInitialAdmin } from '@/services/admin/bootstrap';
import { logger } from '@/utils/logger';

const PORT = env.PORT;

(async () => {
  try {
    await connectDB();
    await ensureInitialAdmin();
    const server = app.listen(PORT, () => {
      logger.startup({
        name: env.APP_NAME,
        port: PORT,
        url: `http://localhost:${PORT}`,
      });
    });

    process.on('SIGINT', () => {
      logger.info('server_shutdown_started');
      server.close(() => {
        logger.info('server_shutdown_completed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (err) => {
      logger.error('unhandled_rejection', { error: err });
      process.exit(1);
    });
  } catch (err) {
    logger.error('server_start_failed', { error: err });
    process.exit(1);
  }
})();
