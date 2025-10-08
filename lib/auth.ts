import { auth as _auth } from '@/auth';

export async function auth() {
  try {
    return await _auth();
  } catch {
    return null;
  }
}
