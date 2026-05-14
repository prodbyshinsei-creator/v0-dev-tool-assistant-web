// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==================== Types ====================

export interface TokenMetadata {
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  market_cap?: number;
}

export interface LaunchedToken {
  ca: string;
  name: string;
  marketCap: number;
  launchedAt: Date;
}

export interface Wallet {
  id: number;
  name: string;
  address: string;
  wallet_type: 'dev' | 'volume';
  balance: number;
}

export interface VolumeSession {
  session_id: string;
  status: 'idle' | 'running' | 'paused';
  txs: number;
  fees_sol: number;
  ca: string;
  wallets_count: number;
}

// ==================== API Client Class ====================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== VAMP Endpoints ====================

  async fetchTokenMetadata(ca: string): Promise<TokenMetadata> {
    const response = await this.request<{
      success: boolean;
      data?: TokenMetadata;
      error?: string;
    }>('/vamp/metadata', {
      method: 'POST',
      body: JSON.stringify({ ca }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch metadata');
    }

    return response.data;
  }

  async launchTokens(params: {
    ca: string;
    dev_wallet_address: string;
    dev_wallet_privkey: string;
    dev_buy_sol: number;
    launch_count: number;
  }): Promise<string[]> {
    const response = await this.request<{
      success: boolean;
      launched_tokens?: string[];
      error?: string;
    }>('/vamp/launch', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.success || !response.launched_tokens) {
      throw new Error(response.error || 'Failed to launch tokens');
    }

    return response.launched_tokens;
  }

  async sellToken(params: {
    ca: string;
    wallet_address: string;
    wallet_privkey: string;
    slippage?: number;
  }): Promise<void> {
    const response = await this.request<{
      success: boolean;
      error?: string;
    }>('/vamp/sell', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to sell token');
    }
  }

  // ==================== Volume Bot Endpoints ====================

  async startVolumeSession(params: {
    ca: string;
    wallet_addresses: string[];
    min_sol?: number;
    max_sol?: number;
    user_id?: number;
  }): Promise<string> {
    const response = await this.request<{
      success: boolean;
      session_id?: string;
      error?: string;
    }>('/volume/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.success || !response.session_id) {
      throw new Error(response.error || 'Failed to start volume session');
    }

    return response.session_id;
  }

  async pauseVolumeSession(sessionId: string): Promise<boolean> {
    const response = await this.request<{
      success: boolean;
      paused: boolean;
    }>(`/volume/pause/${sessionId}`, {
      method: 'POST',
    });

    return response.paused;
  }

  async stopVolumeSession(sessionId: string): Promise<{
    txs: number;
    fees_sol: number;
    sold: number;
  }> {
    const response = await this.request<{
      success: boolean;
      stats: {
        txs: number;
        fees_sol: number;
        sold: number;
      };
    }>(`/volume/stop/${sessionId}`, {
      method: 'POST',
    });

    return response.stats;
  }

  async getVolumeStatus(sessionId: string): Promise<VolumeSession> {
    const response = await this.request<{
      success: boolean;
      session_id: string;
      status: 'idle' | 'running' | 'paused';
      txs: number;
      fees_sol: number;
      ca: string;
      wallets_count: number;
    }>(`/volume/status/${sessionId}`, {
      method: 'GET',
    });

    return {
      session_id: response.session_id,
      status: response.status,
      txs: response.txs,
      fees_sol: response.fees_sol,
      ca: response.ca,
      wallets_count: response.wallets_count,
    };
  }

  // ==================== Wallet Management ====================

  async createWallet(params: {
    name: string;
    address: string;
    privkey: string;
    wallet_type: 'dev' | 'volume';
    user_id?: number;
  }): Promise<Wallet> {
    const response = await this.request<Wallet>('/wallets', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return response;
  }

  async listWallets(
    user_id: number = 1,
    wallet_type?: 'dev' | 'volume'
  ): Promise<Wallet[]> {
    const params = new URLSearchParams({ user_id: user_id.toString() });
    if (wallet_type) params.append('wallet_type', wallet_type);

    const response = await this.request<{
      success: boolean;
      wallets: Wallet[];
    }>(`/wallets?${params.toString()}`, {
      method: 'GET',
    });

    return response.wallets || [];
  }

  async deleteWallet(walletId: number, user_id: number = 1): Promise<void> {
    await this.request(`/wallets/${walletId}?user_id=${user_id}`, {
      method: 'DELETE',
    });
  }

  async getWallet(walletId: number, user_id: number = 1): Promise<Wallet> {
    const response = await this.request<{
      success: boolean;
      wallet: Wallet;
    }>(`/wallets/${walletId}?user_id=${user_id}`, {
      method: 'GET',
    });

    return response.wallet;
  }

  // ==================== Health Check ====================

  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
