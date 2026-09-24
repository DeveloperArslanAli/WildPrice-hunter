import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchEventsGateway } from './search.gateway';
import { SearchSessionStatus } from '@wildprice/shared-types';

describe('SearchEventsGateway', () => {
  let gateway: SearchEventsGateway;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(() => {
    gateway = new SearchEventsGateway();
    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    mockSocket = {
      id: 'socket-123',
      join: vi.fn(),
      leave: vi.fn(),
    };
    gateway.server = mockServer;
  });

  it('should allow client to join search session room', () => {
    const res = gateway.handleJoinSession(mockSocket, { sessionId: 'sess-abc' });
    expect(mockSocket.join).toHaveBeenCalledWith('session_sess-abc');
    expect(res).toEqual({ event: 'joined', room: 'session_sess-abc' });
  });

  it('should allow client to leave search session room', () => {
    const res = gateway.handleLeaveSession(mockSocket, { sessionId: 'sess-abc' });
    expect(mockSocket.leave).toHaveBeenCalledWith('session_sess-abc');
    expect(res).toEqual({ event: 'left', room: 'session_sess-abc' });
  });

  it('should broadcast progress event to the session room', () => {
    gateway.emitProgress({
      sessionId: 'sess-abc',
      status: SearchSessionStatus.PROCESSING,
      progress: 50,
      message: 'Scanning Walmart...',
    });

    expect(mockServer.to).toHaveBeenCalledWith('session_sess-abc');
    expect(mockServer.emit).toHaveBeenCalledWith('search:progress', {
      sessionId: 'sess-abc',
      status: SearchSessionStatus.PROCESSING,
      progress: 50,
      message: 'Scanning Walmart...',
    });
  });

  it('should broadcast listing_found event when a deal is discovered', () => {
    const mockListing = { id: 'list-1', platform: 'walmart', price: 19.99 };
    gateway.emitListingFound({
      sessionId: 'sess-abc',
      listing: mockListing,
      lowestPriceSoFar: 19.99,
    });

    expect(mockServer.to).toHaveBeenCalledWith('session_sess-abc');
    expect(mockServer.emit).toHaveBeenCalledWith('search:listing_found', {
      sessionId: 'sess-abc',
      listing: mockListing,
      lowestPriceSoFar: 19.99,
    });
  });

  it('should broadcast search:completed with totals', () => {
    gateway.emitSearchCompleted({
      sessionId: 'sess-abc',
      resultCount: 8,
      lowestPrice: 15.5,
      savingsVsOriginal: 24.5,
      completedAt: '2026-09-18T19:00:00Z',
    });

    expect(mockServer.to).toHaveBeenCalledWith('session_sess-abc');
    expect(mockServer.emit).toHaveBeenCalledWith('search:completed', {
      sessionId: 'sess-abc',
      resultCount: 8,
      lowestPrice: 15.5,
      savingsVsOriginal: 24.5,
      completedAt: '2026-09-18T19:00:00Z',
    });
  });
});
