import { HTTPError } from 'ky';
import { type NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/http/backend-api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(
      new URL('/signup/identification?error=invalid_token', request.url),
    );
  }

  try {
    const data = await backendApi
      .get('registration/resume', { searchParams: { token } })
      .json<{ redirectTo: string }>();
    return NextResponse.redirect(new URL(data.redirectTo, request.url));
  } catch (error) {
    if (error instanceof HTTPError) {
      const status = error.response.status;
      if (status === 410) {
        return NextResponse.redirect(
          new URL('/signup/identification?error=expired_token', request.url),
        );
      }
      if (status === 404) {
        return NextResponse.redirect(
          new URL('/signup/identification?error=invalid_token', request.url),
        );
      }
    }
    logger.error({ error }, 'Resume token lookup failed');
    return NextResponse.redirect(
      new URL('/signup/identification?error=invalid_token', request.url),
    );
  }
}
