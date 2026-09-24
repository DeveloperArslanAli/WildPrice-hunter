export interface SearchProgressData {
  sessionId: string;
  status: string;
  progress: number;
  message: string;
}

export interface ListingFoundData {
  sessionId: string;
  listing: any;
  lowestPriceSoFar?: number;
}

export interface SearchCompletedData {
  sessionId: string;
  resultCount: number;
  lowestPrice?: number;
  savingsVsOriginal?: number;
  completedAt: string;
}

type EventMap = {
  'search:progress': SearchProgressData;
  'search:listing_found': ListingFoundData;
  'search:completed': SearchCompletedData;
};

class LocalEventBus {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.warn(`[LocalEventBus] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void {
    const list = this.listeners.get(event) || [];
    list.push(handler as (data: any) => void);
    this.listeners.set(event, list);
  }

  off<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(
        event,
        list.filter((h) => h !== handler),
      );
    }
  }

  subscribe(
    sessionId: string,
    callbacks: {
      onProgress?: (data: SearchProgressData) => void;
      onListingFound?: (data: ListingFoundData) => void;
      onCompleted?: (data: SearchCompletedData) => void;
    },
  ): () => void {
    const progressHandler = (data: SearchProgressData) => {
      if (data.sessionId === sessionId && callbacks.onProgress) {
        callbacks.onProgress(data);
      }
    };

    const listingHandler = (data: ListingFoundData) => {
      if (data.sessionId === sessionId && callbacks.onListingFound) {
        callbacks.onListingFound(data);
      }
    };

    const completedHandler = (data: SearchCompletedData) => {
      if (data.sessionId === sessionId && callbacks.onCompleted) {
        callbacks.onCompleted(data);
      }
    };

    if (callbacks.onProgress) this.on('search:progress', progressHandler);
    if (callbacks.onListingFound) this.on('search:listing_found', listingHandler);
    if (callbacks.onCompleted) this.on('search:completed', completedHandler);

    return () => {
      if (callbacks.onProgress) this.off('search:progress', progressHandler);
      if (callbacks.onListingFound) this.off('search:listing_found', listingHandler);
      if (callbacks.onCompleted) this.off('search:completed', completedHandler);
    };
  }
}

export const localEventBus = new LocalEventBus();
