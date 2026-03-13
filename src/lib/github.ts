import axios from 'axios';
import CryptoJS from 'crypto-js';

export interface AuthData {
  passwordHash: string;
  email: string;
  isInitialized: boolean;
}

export interface SyncStats {
  lastUpdate: number;
  monthlyStats: { [month: string]: number };
}

export class GitHubService {
  private token: string;
  private owner: string;
  private repo: string;
  private branch: string = 'main';

  constructor(owner: string, repo: string, token: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  private get baseUrl() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}`;
  }

  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/contents/${path}`, {
        headers: this.headers,
      });
      return {
        content: decodeURIComponent(escape(atob(response.data.content.replace(/\n/g, '')))),
        sha: response.data.sha,
      };
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async putFile(path: string, content: string, sha?: string): Promise<string> {
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const response = await axios.put(`${this.baseUrl}/contents/${path}`, {
      message: `dashboard: update ${path}`,
      content: base64Content,
      sha,
      branch: this.branch,
    }, {
      headers: this.headers,
    });
    return response.data.content.sha;
  }

  async checkAuth(): Promise<AuthData | null> {
    const data = await this.getFile('.obsidian/auth.json');
    if (!data) return null;
    return JSON.parse(data.content) as AuthData;
  }

  async initializeAuth(password: string, email: string): Promise<void> {
    const authData: AuthData = {
      passwordHash: CryptoJS.SHA256(password).toString(),
      email: email,
      isInitialized: true,
    };
    await this.putFile('.obsidian/auth.json', JSON.stringify(authData, null, 2));
  }

  async verifyLogin(password: string): Promise<boolean> {
    const auth = await this.checkAuth();
    if (!auth) return false;
    return auth.passwordHash === CryptoJS.SHA256(password).toString();
  }

  async getStats(): Promise<SyncStats | null> {
    const data = await this.getFile('.obsidian/sync-stats.json');
    if (!data) return null;
    return JSON.parse(data.content) as SyncStats;
  }
}

export const hashPassword = (password: string) => CryptoJS.SHA256(password).toString();
