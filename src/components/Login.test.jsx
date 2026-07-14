import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getSettings: vi.fn(),
  getLabel: vi.fn((key, fallback) => fallback),
  setActiveUser: vi.fn(),
  saveUsers: vi.fn(),
  addAuditLog: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtpAndReset: vi.fn(),
}));

vi.mock('../utils/db', () => ({ db: dbMock }));

import Login from './Login';

const user = {
  id: 'owner',
  email: 'owner@example.com',
  password: 'secret123',
  name: 'Owner',
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getUsers.mockReturnValue([user]);
    dbMock.getSettings.mockReturnValue({
      shopName: 'KP Pakse',
      shopSubtitle: 'POS',
    });
    dbMock.sendOtp.mockReturnValue('123456');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    }));
  });

  it('authenticates a matching local user', async () => {
    const onLoginSuccess = vi.fn();
    render(<Login onLoginSuccess={onLoginSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('example@gmail.com'), {
      target: { value: ' OWNER@example.com ' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ເຂົ້າສູ່ລະບົບ/ }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(user));
    expect(dbMock.setActiveUser).toHaveBeenCalledWith(user);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refreshes users from the server before showing an invalid-login error', async () => {
    dbMock.getUsers
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);
    fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        users: { data: [], updatedAt: 42 },
      }),
    });

    render(<Login onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('example@gmail.com'), {
      target: { value: 'missing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ເຂົ້າສູ່ລະບົບ/ }));

    await screen.findByText('ອີເມລ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/db/sync?users=0');
    expect(localStorage.getItem('amulet_pos_ts_users')).toBe('42');
  });

  it('completes the OTP password-reset flow', async () => {
    render(<Login onLoginSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Forgot Password/ }));
    fireEvent.change(screen.getByPlaceholderText('example@gmail.com'), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ສົ່ງລະຫັດ OTP/ }));

    expect(dbMock.sendOtp).toHaveBeenCalledWith('owner@example.com');
    expect(await screen.findByText(/123456/)).not.toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'new-secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ຢືນຢັນ ແລະ ປ່ຽນ/ }));

    expect(dbMock.verifyOtpAndReset).toHaveBeenCalledWith(
      'owner@example.com',
      '123456',
      'new-secret',
    );
    expect(await screen.findByRole('button', { name: /ເຂົ້າສູ່ລະບົບ/ })).not.toBeNull();
  });

  it('forces first-time users to choose a valid replacement password', async () => {
    const forcedUser = { ...user, forcePasswordChange: true };
    dbMock.getUsers.mockReturnValue([forcedUser]);
    render(<Login onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('example@gmail.com'), {
      target: { value: forcedUser.email },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: forcedUser.password },
    });
    fireEvent.click(screen.getByRole('button', { name: /ເຂົ້າສູ່ລະບົບ/ }));

    expect(await screen.findByText('🔒 ບັງຄັບປ່ຽນລະຫັດຜ່ານ')).not.toBeNull();
    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordFields[0], { target: { value: 'new-secret' } });
    fireEvent.change(passwordFields[1], { target: { value: 'new-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /ຢືນຢັນການປ່ຽນ/ }));

    await waitFor(() => expect(dbMock.saveUsers).toHaveBeenCalledOnce());
    const savedUser = dbMock.saveUsers.mock.calls[0][0][0];
    expect(savedUser).toMatchObject({
      password: 'new-secret',
      forcePasswordChange: false,
    });
    expect(savedUser.passwordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(dbMock.addAuditLog).toHaveBeenCalledWith(
      'user_update',
      expect.stringContaining(forcedUser.email),
      'info',
    );
  });
});
