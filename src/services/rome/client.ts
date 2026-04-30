import { env } from '@/config/env';
import {
  RomeAppellationApi,
  RomeFicheMetierApi,
  RomeMetierApi,
} from '@/services/rome/types';

interface TokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

class RomeApiError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, status?: number, retryable = false) {
    super(message);
    this.name = 'RomeApiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export class RomeClient {
  private accessToken?: string;
  private expiresAt = 0;

  async listAppellations(): Promise<RomeAppellationApi[]> {
    return this.get<RomeAppellationApi[]>(
      env.ROME_METIERS_API_URL,
      '/v1/metiers/appellation',
      {
        champs:
          'code,libelle,libellecourt,classification,metier(code,libelle,riasecmajeur,riasecmineur,domaineprofessionnel(libelle,code,granddomaine(libelle,code)),emploicadre,emploireglemente,transitionnumerique,transitionecologique,transitiondemographique,transitionecologiquedetaillee,codeisco)',
      }
    );
  }

  async getMetier(code: string): Promise<RomeMetierApi> {
    return this.get<RomeMetierApi>(
      env.ROME_METIERS_API_URL,
      `/v1/metiers/metier/${encodeURIComponent(code)}`
    );
  }

  async getFicheMetier(code: string): Promise<RomeFicheMetierApi | undefined> {
    if (!env.ROME_FETCH_FICHES) return undefined;

    try {
      return await this.get<RomeFicheMetierApi>(
        env.ROME_FICHES_METIERS_API_URL,
        `/v1/fiches-rome/fiche-metier/${encodeURIComponent(code)}`
      );
    } catch (error) {
      if (
        error instanceof RomeApiError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return undefined;
      }
      throw error;
    }
  }

  private async get<T>(
    baseUrl: string,
    path: string,
    query?: Record<string, string>
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${baseUrl}${path}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new RomeApiError(
        `ROME API request failed (${response.status}) on ${path}`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.expiresAt - now > 30_000) {
      return this.accessToken;
    }

    if (!env.ROME_CLIENT_ID || !env.ROME_CLIENT_SECRET) {
      throw new RomeApiError(
        'ROME_CLIENT_ID and ROME_CLIENT_SECRET are required to sync ROME data',
        undefined,
        false
      );
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.ROME_CLIENT_ID,
      client_secret: env.ROME_CLIENT_SECRET,
      scope: env.ROME_SCOPES,
    });

    const response = await fetch(env.ROME_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new RomeApiError(
        `ROME OAuth token request failed (${response.status})`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    const payload = (await response.json()) as TokenResponse;
    const ttlMs = Math.max((payload.expires_in ?? 120) - 30, 30) * 1000;

    this.accessToken = payload.access_token;
    this.expiresAt = now + ttlMs;

    return this.accessToken;
  }
}

export { RomeApiError };
