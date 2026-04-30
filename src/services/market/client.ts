import { env } from '@/config/env';
import {
  MarketIndicatorCriteria,
  MarketIndicatorResponse,
  MarketTokenResponse,
} from '@/services/market/types';

class MarketStatsApiError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, status?: number, retryable = false) {
    super(message);
    this.name = 'MarketStatsApiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export class MarketStatsClient {
  private accessToken?: string;
  private expiresAt = 0;

  async getSalaryByRome(
    codeRome: string,
    territoryType = env.MARKET_STATS_TERRITORY_TYPE,
    territoryCode = env.MARKET_STATS_TERRITORY_CODE
  ): Promise<MarketIndicatorResponse> {
    return this.get<MarketIndicatorResponse>(
      `/v1/indicateur/salaire-rome-fap/${encodeURIComponent(territoryType)}/${encodeURIComponent(territoryCode)}`,
      { codeRome }
    );
  }

  async getOffers(codeRome: string): Promise<MarketIndicatorResponse> {
    return this.postIndicator('/v1/indicateur/stat-offres', {
      codeRome,
      codeTypePeriode: 'TRIMESTRE',
      codeTypeNomenclature: 'ORIGINEOFF',
    });
  }

  async getHires(codeRome: string): Promise<MarketIndicatorResponse> {
    return this.postIndicator('/v1/indicateur/stat-embauches', {
      codeRome,
      codeTypePeriode: 'TRIMESTRE',
      codeTypeNomenclature: 'CATCANDxDUREEEMP',
    });
  }

  async getDemanders(codeRome: string): Promise<MarketIndicatorResponse> {
    return this.postIndicator('/v1/indicateur/stat-demandeurs', {
      codeRome,
      codeTypePeriode: 'TRIMESTRE',
      codeTypeNomenclature: 'CATCAND',
    });
  }

  async getTension(codeRome: string): Promise<MarketIndicatorResponse> {
    return this.postIndicator('/v1/indicateur/stat-perspective-employeur', {
      codeRome,
      codeTypePeriode: 'ANNEE',
      codeTypeNomenclature: 'TYPE_TENSION',
    });
  }

  private async postIndicator(
    path: string,
    options: {
      codeRome: string;
      codeTypePeriode: 'TRIMESTRE' | 'ANNEE';
      codeTypeNomenclature: string;
    }
  ): Promise<MarketIndicatorResponse> {
    const criteria: MarketIndicatorCriteria = {
      codeTypeTerritoire: env.MARKET_STATS_TERRITORY_TYPE,
      codeTerritoire: env.MARKET_STATS_TERRITORY_CODE,
      codeTypeActivite: 'ROME',
      codeActivite: options.codeRome,
      codeTypePeriode: options.codeTypePeriode,
      codeTypeNomenclature: options.codeTypeNomenclature,
      dernierePeriode: true,
      sansCaracteristiques: true,
    };

    return this.post<MarketIndicatorResponse>(path, criteria);
  }

  private async get<T>(
    path: string,
    query?: Record<string, string>
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${env.MARKET_STATS_API_URL}${path}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return this.parseResponse<T>(response, path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${env.MARKET_STATS_API_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return this.parseResponse<T>(response, path);
  }

  private async parseResponse<T>(response: Response, path: string): Promise<T> {
    if (!response.ok) {
      throw new MarketStatsApiError(
        `Market stats API request failed (${response.status}) on ${path}`,
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
      throw new MarketStatsApiError(
        'ROME_CLIENT_ID and ROME_CLIENT_SECRET are required to sync market stats',
        undefined,
        false
      );
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.ROME_CLIENT_ID,
      client_secret: env.ROME_CLIENT_SECRET,
      scope: env.MARKET_STATS_SCOPES,
    });

    const response = await fetch(env.ROME_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new MarketStatsApiError(
        `Market stats OAuth token request failed (${response.status})`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    const payload = (await response.json()) as MarketTokenResponse;
    const ttlMs = Math.max((payload.expires_in ?? 120) - 30, 30) * 1000;

    this.accessToken = payload.access_token;
    this.expiresAt = now + ttlMs;

    return this.accessToken;
  }
}

export { MarketStatsApiError };
