import { auth as _auth } from '@/auth';
import { logger } from './logger';

export async function auth() {
  try {
    return await _auth();
  } catch (error) {
    logger.error('Error getting session', error);
    return null;
  }
}
