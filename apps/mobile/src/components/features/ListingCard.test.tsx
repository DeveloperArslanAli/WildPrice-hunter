import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ListingCard } from './ListingCard';

describe('ListingCard Component (QA Visual & Business Logic Tests)', () => {
  const mockListing = {
    id: 'listing-1',
    platform: 'walmart',
    title: 'Sony Noise Cancelling Headphones WH-1000XM5',
    price: 249.99,
    shippingCost: 0,
    totalCost: 249.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 320,
    trustScore: 92,
    productUrl: 'https://walmart.com/ip/sony/123',
    inStock: true,
    similarityScore: 0.95,
  };

  it('should render listing card with platform, title, and formatted price', async () => {
    let renderer: any;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ListingCard listing={mockListing} rank={1} />);
    });

    const str = JSON.stringify(renderer.toJSON());
    expect(str).toContain('Sony Noise Cancelling Headphones WH-1000XM5');
    expect(str).toContain('249.99');
    expect(str).toContain('WALMART');
  });

  it('should render savings badge when originalPrice is higher than totalCost', async () => {
    let renderer: any;
    // Original was $399.99, this listing is $249.99 (saves $150.00)
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ListingCard listing={mockListing} originalPrice={399.99} rank={1} />,
      );
    });

    const str = JSON.stringify(renderer.toJSON());
    expect(str).toContain('SAVE $');
    expect(str).toContain('150.00');
  });

  it('should render WHERE YOU FOUND IT badge when isOriginal is true', async () => {
    let renderer: any;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ListingCard listing={mockListing} isOriginal={true} />);
    });

    const str = JSON.stringify(renderer.toJSON());
    expect(str).toContain('YOUR PRODUCT');
  });

  it('should render out of stock warning when inStock is false', async () => {
    let renderer: any;
    const outOfStockListing = { ...mockListing, inStock: false };
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ListingCard listing={outOfStockListing} />);
    });

    const str = JSON.stringify(renderer.toJSON());
    expect(str).toContain('OUT OF STOCK');
  });
});
