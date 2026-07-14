import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';

const storageKey = (key) => `amulet_pos_${key}`;

const seed = (key, value) => {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
};

describe('db', () => {
  beforeEach(() => {
    localStorage.clear();
    db._initialized = true;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('manages queue slots while enforcing protected and active-slot rules', () => {
    const slots = db.getSlots();
    expect(slots['Walk-In']).toMatchObject({ id: 'Walk-In', items: [] });

    const created = db.addSlot('VIP-1', 'VIP Customer');
    expect(created).toMatchObject({ id: 'VIP-1', label: 'VIP Customer' });
    expect(() => db.addSlot('VIP-1')).toThrow(/ມີໃນລະບົບແລ້ວ/);

    db.renameSlot('VIP-1', 'Renamed', 'Alice', '02011111111', 'CUST1', 'fixed', 0, 5000);
    expect(db.getSlots()['VIP-1']).toMatchObject({
      label: 'Renamed',
      customerName: 'Alice',
      customerPhone: '02011111111',
      customerId: 'CUST1',
      discountType: 'fixed',
      discountAmount: 5000,
    });

    const occupied = db.getSlots();
    occupied['VIP-1'].items = [{ productId: 'P001' }];
    db.saveSlots(occupied);
    expect(() => db.deleteSlot('VIP-1')).toThrow(/ລາຍການສິນຄ້າ/);
    expect(() => db.deleteSlot('Walk-In')).toThrow(/Walk-In/);

    db.clearSlot('VIP-1');
    expect(db.getSlots()['VIP-1']).toMatchObject({
      items: [],
      customerName: '',
      discountType: 'percent',
      discountAmount: 0,
    });

    db.deleteSlot('VIP-1');
    expect(db.getSlots()['VIP-1']).toBeUndefined();
  });

  it('normalizes product fields and timestamps changed inventory records', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T06:00:00.000Z'));
    seed('categories', [
      { id: 'physical', type: 'physical' },
      { id: 'services', type: 'service' },
    ]);
    seed('products', [
      {
        id: 'P009',
        category: 'physical',
        price: '100',
        stock: 2,
        minStock: 1,
        image: 'product.jpg',
        updatedAt: 100,
      },
      {
        id: 'S001',
        category: 'services',
        price: 500,
        stock: 99,
        minStock: 5,
      },
      null,
    ]);

    expect(db.getProducts()).toEqual([
      expect.objectContaining({
        id: 'P009',
        showOnline: true,
        priceOnline: 100,
        priceVip: 100,
        images: ['product.jpg'],
      }),
      expect.objectContaining({
        id: 'S001',
        showOnline: false,
        images: [],
      }),
    ]);

    const service = db.normalizeProductForCategory({
      category: 'services',
      price: '700',
      stock: '12',
      minStock: '2',
    });
    expect(service).toMatchObject({
      stock: 0,
      minStock: 0,
      showOnline: false,
      priceOnline: 700,
      priceVip: 700,
    });

    const added = db.addProduct({
      category: 'physical',
      price: '250',
      cost: '100',
      stock: '3',
      minStock: '1',
    });
    expect(added).toMatchObject({
      id: 'P010',
      price: 250,
      cost: 100,
      stock: 3,
      minStock: 1,
    });

    const saved = JSON.parse(localStorage.getItem(storageKey('products')));
    expect(saved.find((product) => product.id === 'P010').updatedAt).toBe(Date.now());
  });

  it('registers, authenticates, and upgrades online customers by spend', () => {
    seed('customers', []);

    const customer = db.registerOnlineCustomer(
      'Alice',
      '020 5555 1111',
      'secret',
      { village: 'Pakse' },
      'Alice@Example.com',
    );
    expect(customer).toMatchObject({
      id: 'CUST10001',
      name: 'Alice',
      password: 'secret',
      addresses: [{ village: 'Pakse', isDefault: true }],
    });

    expect(db.authenticateOnlineCustomer('alice@example.com', 'secret').id).toBe(customer.id);
    expect(db.authenticateOnlineCustomer('55551111', 'secret').id).toBe(customer.id);
    expect(() => db.authenticateOnlineCustomer('', '')).toThrow(/ກະລຸນາ/);
    expect(() => db.authenticateOnlineCustomer('alice@example.com', 'wrong')).toThrow(/ບໍ່ຖືກຕ້ອງ/);

    db.updateCustomerSpend(customer.id, 5_250_000);
    expect(db.getCustomers()[0]).toMatchObject({
      totalSpend: 5_250_000,
      points: 525,
      tier: 'Gold',
      discountValue: 8,
    });

    vi.spyOn(db, 'addAuditLog').mockReturnValue({});
    expect(db.redeemCustomerPoints(customer.id, 25, 25_000)).toBe(true);
    expect(db.getCustomers()[0].points).toBe(500);
    expect(db.redeemCustomerPoints(customer.id, 501, 501_000)).toBe(false);
  });

  it('deducts paid online-order stock once and restores it on cancellation', () => {
    seed('categories', [{ id: 'physical', type: 'physical' }]);
    seed('products', [{
      id: 'P001',
      name: 'Frame',
      category: 'physical',
      price: 100_000,
      stock: 5,
      minStock: 1,
    }]);
    seed('online_orders', [{
      id: 'ONL-010001',
      customerId: 'CUST10001',
      customerName: 'Alice',
      total: 200_000,
      paymentStatus: 'unpaid',
      shippingStatus: 'pending',
      items: [{ productId: 'P001', qty: 2 }],
      timeline: [],
    }]);
    seed('settings', { notifyOnlineOrderUpdate: false });
    const updateCustomerSpend = vi.spyOn(db, 'updateCustomerSpend').mockImplementation(() => {});

    const paid = db.updateOnlineOrderStatus(
      'ONL-010001',
      'paid',
      'preparing',
      { statusNote: 'Payment confirmed' },
    );
    expect(paid).toMatchObject({
      paymentStatus: 'paid',
      shippingStatus: 'preparing',
    });
    expect(db.getProducts()[0].stock).toBe(3);
    expect(updateCustomerSpend).toHaveBeenCalledWith('CUST10001', 200_000);

    db.updateOnlineOrderStatus('ONL-010001', 'paid', 'preparing');
    expect(db.getProducts()[0].stock).toBe(3);

    const cancelled = db.updateOnlineOrderStatus(
      'ONL-010001',
      'paid',
      'cancelled',
      { trackingNumber: 'TRACK-1' },
    );
    expect(cancelled.trackingNumber).toBe('TRACK-1');
    expect(db.getProducts()[0].stock).toBe(5);
    expect(cancelled.timeline).toHaveLength(3);
  });
});
