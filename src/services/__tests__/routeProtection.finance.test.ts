import { describe, expect, it } from 'vitest';
import { RouteProtectionService, User } from '../routeProtection';

describe('RouteProtectionService finance navigation', () => {
  const treasurerUser: User = {
    id: 'treasurer-1',
    name: 'Test Treasurer',
    role: 'Treasurer',
    phone: '+254700000000'
  };

  const adminUser: User = {
    id: 'admin-1',
    name: 'Admin User',
    role: 'Admin',
    phone: '+254700000001'
  };

  it('authorizes treasurer access to the finance dashboard route', () => {
    const result = RouteProtectionService.isAuthorized(treasurerUser, 'staff/treasurer');
    expect(result.authorized).toBe(true);
  });

  it('exposes the Finance Module entry for treasurer navigation', () => {
    const navItems = RouteProtectionService.getNavigationItems(treasurerUser);
    const operations = navItems.find((item) => item.label === 'Operations');
    const financeChild = operations?.children?.find((child) => child.route === 'staff/treasurer');
    expect(financeChild).toBeTruthy();
  });

  it('includes the Treasury module shortcut within the admin section', () => {
    const navItems = RouteProtectionService.getNavigationItems(adminUser);
    const adminSection = navItems.find((item) => item.label === 'Administration');
    const treasuryLink = adminSection?.children?.find((child) => child.route === 'staff/treasurer');
    expect(treasuryLink).toBeTruthy();
  });
});
