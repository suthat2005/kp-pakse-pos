import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OnlineShopSettings from './OnlineShopSettings';

const categories = [
  { id: 'frames', name: 'Frames' },
  { id: 'amulets', name: 'Amulets' },
];

function SettingsHarness({ initialSettings = {}, onSettingsChange, handleSave }) {
  const [settings, setSettingsState] = useState(initialSettings);
  const setSettings = (value) => {
    setSettingsState((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      onSettingsChange(next);
      return next;
    });
  };

  return (
    <OnlineShopSettings
      settings={settings}
      setSettings={setSettings}
      categories={categories}
      handleSave={handleSave}
    />
  );
}

describe('OnlineShopSettings', () => {
  it('updates shop information and delegates saves', () => {
    const onSettingsChange = vi.fn();
    const handleSave = vi.fn();
    render(
      <SettingsHarness
        initialSettings={{ onlineShopTitle: 'Old title' }}
        onSettingsChange={onSettingsChange}
        handleSave={handleSave}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('ຂອບພຣະຣັທເກຊ Online'), {
      target: { value: 'KP Online' },
    });
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ onlineShopTitle: 'KP Online' }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    expect(handleSave).toHaveBeenCalledOnce();
  });

  it('manages category visibility and shipping methods', () => {
    const onSettingsChange = vi.fn();
    render(
      <SettingsHarness
        initialSettings={{
          onlineShopDisabledCategories: ['amulets'],
          onlineShopShippingMethods: [],
        }}
        onSettingsChange={onSettingsChange}
        handleSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Sales & Shipping/ }));

    const frames = screen.getByLabelText('Frames');
    const amulets = screen.getByLabelText('Amulets');
    expect(frames.checked).toBe(true);
    expect(amulets.checked).toBe(false);

    fireEvent.click(frames);
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onlineShopDisabledCategories: ['amulets', 'frames'],
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /\+ ເພີ່ມຊ່ອງທາງ/ }));
    const nameInput = screen.getByPlaceholderText('ຊື່ວິທີການຈັດສົ່ງ');
    const rateInput = screen.getByPlaceholderText('ຄ່າຈັດສົ່ງ (LAK)');
    expect(nameInput.value).toContain('Express');
    expect(rateInput.value).toBe('20000');

    fireEvent.change(nameInput, { target: { value: 'Pakse Delivery' } });
    fireEvent.change(rateInput, { target: { value: '35000' } });
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onlineShopShippingMethods: [
          expect.objectContaining({
            name: 'Pakse Delivery',
            baseRate: 35000,
          }),
        ],
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'ລຶບ' }));
    expect(screen.queryByPlaceholderText('ຊື່ວິທີການຈັດສົ່ງ')).toBeNull();
  });

  it('manages bank accounts and translation overrides', () => {
    const onSettingsChange = vi.fn();
    render(
      <SettingsHarness
        initialSettings={{
          onlineShopBankAccounts: [],
          onlineShopTranslations: {
            en: { home: 'Store' },
          },
        }}
        onSettingsChange={onSettingsChange}
        handleSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Payment & POS/ }));
    fireEvent.click(screen.getByRole('button', { name: /\+ ເພີ່ມບັນຊີ/ }));
    fireEvent.change(screen.getByPlaceholderText('ຊື່ທະນາຄານ (e.g. BCEL)'), {
      target: { value: 'LDB' },
    });
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onlineShopBankAccounts: [
          expect.objectContaining({ bankName: 'LDB' }),
        ],
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'ລຶບ' }));
    expect(screen.queryByPlaceholderText('ຊື່ທະນາຄານ (e.g. BCEL)')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Translations Override/ }));
    const homeRow = screen.getByText('home').closest('tr');
    const fields = within(homeRow).getAllByRole('textbox');
    expect(fields[2].value).toBe('Store');

    fireEvent.change(fields[2], { target: { value: 'Shop Home' } });
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onlineShopTranslations: expect.objectContaining({
          en: expect.objectContaining({ home: 'Shop Home' }),
        }),
      }),
    );
  });
});
