import 'server-only';

import ky from 'ky';
import { cookies } from 'next/headers';
import { env } from '@/env';
import { logger } from '@/lib/logger';

const COOKIE_NAME = 'registration_session';
const REQUEST_TIMEOUT = 10_000;

export const backendApi = ky.create({
  baseUrl: env.BACKEND_URL,
  timeout: REQUEST_TIMEOUT,
  cache: 'no-store',
  retry: 0,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        try {
          const cookieStore = await cookies();
          const token = cookieStore.get(COOKIE_NAME)?.value;
          if (token) {
            request.headers.set('Cookie', `${COOKIE_NAME}=${token}`);
          }
        } catch (error) {
          logger.debug({ error }, 'No session cookie attached (rendering outside request scope)');
        }
      },
    ],
    afterResponse: [
      async ({ response }) => {
        const setCookie = response.headers.get('set-cookie');
        if (!setCookie) return;
        try {
          await propagateSetCookie(setCookie);
        } catch (error) {
          logger.error({ error }, 'Failed to propagate Set-Cookie from backend');
        }
      },
    ],
  },
});

async function propagateSetCookie(setCookieHeader: string) {
  const valueMatch = setCookieHeader.match(new RegExp(`^${COOKIE_NAME}=([^;]+)`));
  if (!valueMatch) return;
  const maxAgeMatch = setCookieHeader.match(/Max-Age=(\d+)/i);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, valueMatch[1], {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : undefined,
  });
}
