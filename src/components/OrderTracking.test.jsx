import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getFramingJobs: vi.fn(),
  getSettings: vi.fn(),
  getLabel: vi.fn((key, fallback) => fallback),
}));

vi.mock('../utils/db', () => ({ db: dbMock }));

import OrderTracking from './OrderTracking';

const pendingJob = {
  id: 'JOB10001',
  status: 'pending',
  createdDate: '2026-07-10T10:00:00.000Z',
  customerName: 'Alice',
  totalPrice: 300000,
  deposit: 100000,
  balance: 200000,
  amulets: [{
    description: 'Buddha amulet',
    frameTypeName: 'Gold frame',
    frameStyle: 'Classic',
    specialNotes: 'Handle carefully',
  }],
};

describe('OrderTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getSettings.mockReturnValue({
      shopName: 'KP Pakse',
      shopSubtitle: 'Tracking',
      trackingShowQueue: true,
      trackingShowPricing: true,
    });
  });

  it('renders a not-found state and invokes the close action', () => {
    dbMock.getFramingJobs.mockReturnValue([]);
    const onClose = vi.fn();
    render(<OrderTracking jobId="MISSING" onClose={onClose} />);

    expect(screen.getByText('ບໍ່ພົບຂໍ້ມູນງານອັດກອບພຣະນີ້')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Close/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows mobile queue, job details, timeline, and pricing', () => {
    dbMock.getFramingJobs.mockReturnValue([
      { id: 'ACTIVE', status: 'framing', createdDate: '2026-07-09T10:00:00.000Z' },
      pendingJob,
      { id: 'LATER', status: 'pending', createdDate: '2026-07-11T10:00:00.000Z' },
    ]);

    render(
      <OrderTracking
        jobId={pendingJob.id}
        mockJobData={pendingJob}
        isInline
      />,
    );

    expect(screen.getByText('ຮັບຝາກພຣະແລ້ວ (Order Received)')).not.toBeNull();
    expect(screen.getByText(/1 ຄິວ/)).not.toBeNull();
    expect(screen.getByText(pendingJob.id)).not.toBeNull();
    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.getByText(/Buddha amulet/)).not.toBeNull();
    expect(screen.getByText('300,000 ₭')).not.toBeNull();
    expect(screen.getByText('-100,000 ₭')).not.toBeNull();
    expect(screen.getByText('200,000 ₭')).not.toBeNull();
  });

  it('renders ready jobs in the desktop layout', () => {
    const readyJob = { ...pendingJob, status: 'ready' };
    dbMock.getFramingJobs.mockReturnValue([readyJob]);
    dbMock.getSettings.mockReturnValue({
      shopName: 'KP Pakse',
      receiptLogoUrl: 'logo.png',
      trackingShowPricing: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });

    render(<OrderTracking jobId={readyJob.id} mockJobData={readyJob} />);

    expect(screen.getByAltText('Logo').getAttribute('src')).toBe('logo.png');
    expect(screen.getByText('ສຳເລັດແລ້ວ ພ້ອມຮັບພຣະ (Ready to Pick Up)')).not.toBeNull();
    expect(screen.getByText('Alice')).not.toBeNull();
  });
});
