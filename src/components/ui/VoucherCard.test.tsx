import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VoucherCard } from './VoucherCard';
import type { VoucherWithDetails } from '../../types';

const baseVoucher: VoucherWithDetails = {
  id: 'v1',
  business_id: 'b1',
  title: 'Half-price flat white before 10am',
  description: null,
  discount_text: '50% off',
  original_price: 4,
  discounted_price: 2,
  redemption_code: null,
  redemption_limit: 100,
  redemption_count: 25,
  terms: null,
  cover_image_url: 'https://example.com/cover.jpg',
  venue_name: 'Brick Lane Coffee',
  venue_address: '123 Brick Lane',
  venue_lat: 51.5,
  venue_lng: -0.07,
  expires_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  status: 'active',
  created_at: new Date().toISOString(),
  business: {
    id: 'b1',
    owner_id: null,
    name: 'Brick Lane Coffee',
    slug: 'brick-lane-coffee',
    logo_url: null,
    category: 'Cafe',
    description: null,
    address: null,
    opening_hours: null,
    social_links: null,
    status: 'approved',
    verified: false,
    verified_at: null,
    rejection_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const renderCard = (voucher: VoucherWithDetails) =>
  render(
    <MemoryRouter>
      <VoucherCard voucher={voucher} />
    </MemoryRouter>,
  );

describe('VoucherCard', () => {
  it('renders the title and links to the voucher detail page', () => {
    renderCard(baseVoucher);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/voucher/v1');
    expect(screen.getByText(baseVoucher.title)).toBeInTheDocument();
  });

  it('shows the savings percentage when both prices are set', () => {
    renderCard(baseVoucher);
    // 4 → 2 = 50% off
    expect(screen.getByText(/Save 50%/i)).toBeInTheDocument();
    expect(screen.getByText('£2')).toBeInTheDocument();
    expect(screen.getByText('£4')).toBeInTheDocument();
  });

  it('renders "Free" when discounted_price is zero', () => {
    renderCard({ ...baseVoucher, original_price: 5, discounted_price: 0 });
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('flags an "Ending soon" chip when the voucher expires within 24h', () => {
    // 6.5h gives the floor-rounded renderer a stable "6h left" output even
    // if the test takes a few hundred ms to reach the assertion.
    const soon = { ...baseVoucher, expires_at: new Date(Date.now() + 6.5 * 3_600_000).toISOString() };
    renderCard(soon);
    expect(screen.getByText(/Ending soon/i)).toBeInTheDocument();
    expect(screen.getByText(/6h left/i)).toBeInTheDocument();
  });

  it('shows the "almost gone" stock chip when claim ratio is at least 80%', () => {
    renderCard({ ...baseVoucher, redemption_count: 90, redemption_limit: 100 });
    expect(screen.getByText(/90% claimed/i)).toBeInTheDocument();
  });

  it('falls back to the discount text when no cover image is provided', () => {
    const noImage = { ...baseVoucher, cover_image_url: null };
    renderCard(noImage);
    expect(screen.getAllByText('50% off').length).toBeGreaterThan(0);
  });
});
