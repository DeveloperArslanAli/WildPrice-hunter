import {
  authApi,
  searchApi,
  productsApi,
  watchlistApi,
  historyApi,
  usersApi,
} from '../../api/endpoints';

describe('Endpoints Facade (API Compatibility Layer)', () => {
  describe('authApi', () => {
    it('should register and return user profile and tokens', async () => {
      const res = await authApi.register({
        email: 'tester@wildprice.app',
        password: 'password123',
        displayName: 'Test Hunter',
      });
      expect(res.user.email).toBe('tester@wildprice.app');
      expect(res.user.displayName).toBe('Test Hunter');
      expect(res.tokens.accessToken).toBeDefined();
    });

    it('should login and return user profile and tokens', async () => {
      const res = await authApi.login({
        email: 'tester@wildprice.app',
        password: 'password123',
      });
      expect(res.user).toBeDefined();
      expect(res.tokens.accessToken).toBeDefined();
    });

    it('should return current user with getMe', async () => {
      const user = await authApi.getMe();
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    });
  });

  describe('searchApi', () => {
    it('should initiate searchByText and return session ID', async () => {
      const res = await searchApi.searchByText('Logitech MX Master 3S');
      expect(res.sessionId).toBeDefined();
      expect(res.status).toBe('processing');

      // Check status
      const status = await searchApi.getStatus(res.sessionId);
      expect(status).not.toBeNull();
      expect(status?.id).toBe(res.sessionId);
    });
  });

  describe('watchlistApi', () => {
    it('should manage watchlist items seamlessly', async () => {
      const item = await watchlistApi.create('prod-12345', 89.99);
      expect(item.id).toBeDefined();
      expect(item.targetPrice).toBe(89.99);

      const all = await watchlistApi.getAll();
      expect(all.some((w) => w.id === item.id)).toBe(true);

      const updated = await watchlistApi.updateTargetPrice(item.id, 79.99);
      expect(updated.targetPrice).toBe(79.99);

      await watchlistApi.remove(item.id);
      const afterDelete = await watchlistApi.getAll();
      expect(afterDelete.some((w) => w.id === item.id)).toBe(false);
    });
  });

  describe('historyApi', () => {
    it('should retrieve and clear history', async () => {
      const history = await historyApi.getAll();
      expect(Array.isArray(history)).toBe(true);

      await historyApi.clearAll();
      const cleared = await historyApi.getAll();
      expect(cleared.length).toBe(0);
    });
  });

  describe('usersApi', () => {
    it('should get and update user profile settings', async () => {
      const initial = await usersApi.getProfile();
      expect(initial).toBeDefined();

      const updated = await usersApi.updateProfile({
        displayName: 'Elite Hunter',
        dropshippingMode: true,
      });
      expect(updated.displayName).toBe('Elite Hunter');
      expect(updated.dropshippingMode).toBe(true);
    });
  });
});
