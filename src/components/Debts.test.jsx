import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getSettings: vi.fn(),
  getDebts: vi.fn(),
  getLabel: vi.fn((key, fallback) => fallback),
  getPaperPrintWidths: vi.fn(),
  payDebt: vi.fn(),
  addOrder: vi.fn(),
}));

vi.mock('../utils/db', () => ({ db: dbMock }));

import Debts from './Debts';

const debts = [
  {
    id: 'DBT10001',
    date: '2026-07-10T10:00:00.000Z',
    customerName: 'Alice',
    customerPhone: '02011111111',
    status: 'unpaid',
    total: 150000,
    items: [{ name: 'Frame', qty: 1, price: 150000 }],
  },
  {
    id: 'DBT10002',
    date: '2026-07-11T10:00:00.000Z',
    customerName: 'Bob',
    customerPhone: '02022222222',
    status: 'unpaid',
    total: 200000,
    items: [{ name: 'Amulet', qty: 2, price: 100000 }],
  },
  {
    id: 'DBT10003',
    date: '2026-07-12T10:00:00.000Z',
    customerName: 'Paid Customer',
    customerPhone: '02033333333',
    status: 'paid',
    total: 300000,
    items: [{ name: 'Service', qty: 1, price: 300000 }],
  },
];

describe('Debts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDebts.mockReturnValue(debts);
    dbMock.getSettings.mockReturnValue({
      exchangeRateThb: 750,
      exchangeRateUsd: 26000,
    });
  });

  it('shows only unpaid debts and filters by customer details', async () => {
    render(
      <Debts
        activeUser={{ role: 'owner', name: 'Owner', id: 'owner' }}
        isMobile={false}
      />,
    );

    expect(await screen.findByText('Alice')).not.toBeNull();
    expect(screen.getByText('Bob')).not.toBeNull();
    expect(screen.queryByText('Paid Customer')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(/ຄົ້ນຫາ/), {
      target: { value: '02022222222' },
    });

    await waitFor(() => expect(screen.queryByText('Alice')).toBeNull());
    expect(screen.getByText('Bob')).not.toBeNull();
  });

  it('hides collection actions when the user lacks collection permission', async () => {
    render(
      <Debts
        activeUser={{
          role: 'cashier',
          permissions: { debtsCollect: false },
        }}
        isMobile
      />,
    );

    expect(await screen.findAllByText('🔒 ຊຳລະໜີ້')).toHaveLength(2);
    expect(screen.getAllByText('🔒 ຊຳລະ')).toHaveLength(2);
    expect(screen.queryByText('💵 ຊຳລະໜີ້')).toBeNull();
  });

  it('opens debt collection in a portal and closes it without changing data', async () => {
    render(
      <Debts
        activeUser={{ role: 'owner', name: 'Owner', id: 'owner' }}
        isMobile={false}
      />,
    );

    const aliceRow = (await screen.findByText('Alice')).closest('tr');
    fireEvent.click(within(aliceRow).getByText('💵 ຊຳລະໜີ້'));

    const portal = document.body.querySelector('[data-portal="true"]');
    expect(portal).not.toBeNull();
    expect(within(portal).getByText(/ລູກຄ້າ: Alice/)).not.toBeNull();
    expect(within(portal).getByText('150,000 ກີບ')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    await waitFor(() => {
      expect(document.body.querySelector('[data-portal="true"]')).toBeNull();
    });
    expect(dbMock.payDebt).not.toHaveBeenCalled();
    expect(dbMock.addOrder).not.toHaveBeenCalled();
  });
});
