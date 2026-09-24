import { localEventBus } from '../events/localEventBus';

describe('LocalEventBus (Real-time Pub/Sub Engine)', () => {
  it('should emit and receive progress events for subscribed session', () => {
    const targetSessionId = 'session-101';
    const progressSpy = jest.fn();

    const unsubscribe = localEventBus.subscribe(targetSessionId, {
      onProgress: progressSpy,
    });

    // Event for another session (should be filtered out)
    localEventBus.emit('search:progress', {
      sessionId: 'session-other',
      status: 'processing',
      progress: 20,
      message: 'Ignore me',
    });
    expect(progressSpy).not.toHaveBeenCalled();

    // Event for target session (should trigger callback)
    localEventBus.emit('search:progress', {
      sessionId: targetSessionId,
      status: 'processing',
      progress: 50,
      message: 'Scanning Amazon...',
    });
    expect(progressSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: targetSessionId,
        progress: 50,
      }),
    );

    unsubscribe();
  });

  it('should emit and receive listing_found and completed events', () => {
    const sessionId = 'session-202';
    const listingSpy = jest.fn();
    const completedSpy = jest.fn();

    const unsubscribe = localEventBus.subscribe(sessionId, {
      onListingFound: listingSpy,
      onCompleted: completedSpy,
    });

    localEventBus.emit('search:listing_found', {
      sessionId,
      listing: { id: 'listing-1', price: 49.99 },
      lowestPriceSoFar: 49.99,
    });
    expect(listingSpy).toHaveBeenCalledTimes(1);

    localEventBus.emit('search:completed', {
      sessionId,
      resultCount: 5,
      lowestPrice: 39.99,
      savingsVsOriginal: 20.0,
      completedAt: new Date().toISOString(),
    });
    expect(completedSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('should stop receiving events after unsubscribe() is called', () => {
    const sessionId = 'session-303';
    const progressSpy = jest.fn();

    const unsubscribe = localEventBus.subscribe(sessionId, {
      onProgress: progressSpy,
    });

    localEventBus.emit('search:progress', {
      sessionId,
      status: 'processing',
      progress: 25,
      message: 'Step 1',
    });
    expect(progressSpy).toHaveBeenCalledTimes(1);

    unsubscribe();

    localEventBus.emit('search:progress', {
      sessionId,
      status: 'processing',
      progress: 75,
      message: 'Step 2',
    });
    // Should NOT have incremented
    expect(progressSpy).toHaveBeenCalledTimes(1);
  });
});
