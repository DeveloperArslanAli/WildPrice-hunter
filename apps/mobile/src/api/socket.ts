import {
  localEventBus,
  SearchProgressData,
  ListingFoundData,
  SearchCompletedData,
} from '../embedded/events/localEventBus';

export type { SearchProgressData, ListingFoundData, SearchCompletedData };

/**
 * Socket compatibility facade for embedded backend.
 * Provides real-time event subscription via in-memory LocalEventBus.
 */
export const getSearchSocket = (): any => {
  return {
    connected: true,
    connect: () => {},
    disconnect: () => {},
    emit: () => {},
    on: () => {},
    off: () => {},
  };
};

/**
 * Subscribes to real-time search events (progress, listings found, completion)
 * emitted by the embedded SearchOrchestrator.
 */
export const subscribeToSearchSession = (
  sessionId: string,
  callbacks: {
    onProgress?: (data: SearchProgressData) => void;
    onListingFound?: (data: ListingFoundData) => void;
    onCompleted?: (data: SearchCompletedData) => void;
  },
): (() => void) => {
  return localEventBus.subscribe(sessionId, callbacks);
};
