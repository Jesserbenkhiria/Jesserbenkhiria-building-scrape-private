import fetch from 'node-fetch';
import pRetry from 'p-retry';
import pLimit from 'p-limit';

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 2;

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Effectue une requête HTTP avec retry et timeout
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, headers = {} } = options;
  
  const operation = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TunisiaConstructionFinder/1.0)',
          ...headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  return pRetry(operation, {
    retries,
    onFailedAttempt: (error) => {
      console.warn(
        `Tentative ${error.attemptNumber} échouée pour ${url}: ${error.message}`
      );
    },
  });
}

/**
 * Crée un limiteur de concurrence
 */
export function createRateLimiter(concurrency: number) {
  return pLimit(concurrency);
}

/**
 * Délai
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Throttle - limite le nombre d'appels par seconde
 */
export class Throttle {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  private interval: number;
  private maxPerInterval: number;
  private lastReset: number;
  
  constructor(requestsPerSecond: number) {
    this.maxPerInterval = requestsPerSecond;
    this.interval = 1000;
    this.lastReset = Date.now();
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    
    try {
      return await fn();
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
  
  private async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const now = Date.now();
      
      // Réinitialiser le compteur si l'intervalle est écoulé
      if (now - this.lastReset >= this.interval) {
        this.activeCount = 0;
        this.lastReset = now;
      }
      
      if (this.activeCount < this.maxPerInterval) {
        this.activeCount++;
        resolve();
      } else {
        this.queue.push(() => {
          this.activeCount++;
          resolve();
        });
      }
    });
  }
  
  private processQueue(): void {
    if (this.queue.length > 0 && this.activeCount < this.maxPerInterval) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

