import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PlatformBadge, TrustBadge, SavingsBadge } from './Badges';

describe('Badges UI Components (QA Visual & Logic Tests)', () => {
  describe('PlatformBadge', () => {
    it('should render Amazon platform badge', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<PlatformBadge platform="amazon" />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('AMAZON');
    });

    it('should render Walmart platform badge', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<PlatformBadge platform="walmart" />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('WALMART');
    });

    it('should render eBay and AliExpress badges', async () => {
      let ebayRenderer: any;
      let aliRenderer: any;
      await ReactTestRenderer.act(() => {
        ebayRenderer = ReactTestRenderer.create(<PlatformBadge platform="ebay" />);
        aliRenderer = ReactTestRenderer.create(<PlatformBadge platform="aliexpress" />);
      });
      expect(JSON.stringify(ebayRenderer.toJSON())).toContain('EBAY');
      expect(JSON.stringify(aliRenderer.toJSON())).toContain('ALIEXPRESS');
    });
  });

  describe('TrustBadge', () => {
    it('should render HIGH TRUST for score 85', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TrustBadge score={85} />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('85');
      expect(str).toContain('HIGH TRUST');
    });

    it('should render MODERATE for score 50', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TrustBadge score={50} />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('50');
      expect(str).toContain('MODERATE');
    });

    it('should render RISKY for score 10', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TrustBadge score={10} />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('10');
      expect(str).toContain('RISKY');
    });
  });

  describe('SavingsBadge', () => {
    it('should render dollar savings and percentage when amount > 0', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<SavingsBadge amount={14.5} percent={35} />);
      });
      const str = JSON.stringify(renderer.toJSON());
      expect(str).toContain('SAVE $');
      expect(str).toContain('14.50');
      expect(str).toContain('(35%)');
    });

    it('should return null when amount is 0 or negative', async () => {
      let renderer: any;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<SavingsBadge amount={0} />);
      });
      expect(renderer.toJSON()).toBeNull();
    });
  });
});
