// Capability names only. Role-to-permission assignments come from /api/me.
export const ADMIN_MENU_PERMISSIONS = {
  dashboard: 'dashboard.view',
  categories: 'categories.manage',
  brokers: 'brokers.manage',
  customers: 'customers.manage',
  demands: 'demands.manage',
  notifications: 'notifications.view',
  approvals: 'approvals.menu',
  'listing-status': 'listing-status.menu',
  'property-types': 'property-types.menu',
  properties: 'properties.menu',
  appointments: 'appointments.menu',
  contracts: 'contracts.menu',
  'contract-documents': 'contract-documents.menu',
  invoices: 'invoices.menu',
  'rent-management': 'rent-management.menu',
  deposits: 'deposits.menu',
  payments: 'payments.menu',
  users: 'users.manage',
  roles: 'roles.manage',
  settings: 'settings.menu',
  reports: 'reports.view',
};

export const hasPermission = (user, permission) => user?.is_active !== false
  && Array.isArray(user?.permissions) && user.permissions.includes(permission);

export const canOpenAdminMenu = (user, menu) => hasPermission(user, 'admin.access')
  && hasPermission(user, ADMIN_MENU_PERMISSIONS[menu]);

export const firstAdminMenu = (user) => Object.keys(ADMIN_MENU_PERMISSIONS)
  .find(menu => canOpenAdminMenu(user, menu)) || null;
