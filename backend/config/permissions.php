<?php

use App\Enums\Role;

// Authority for Giang's 16 features. Other modules retain their existing Policies.
$member = ['account.view', 'profile.update', 'password.update', 'notifications.view'];
$crm = ['customers.manage', 'demands.manage'];

// These menu capabilities preserve navigation to modules outside this review.
// They do not grant API access; those modules continue to enforce their Policies.
$externalMenus = ['properties.menu', 'approvals.menu', 'listing-status.menu', 'property-types.menu',
    'appointments.menu', 'contracts.menu', 'contract-documents.menu', 'invoices.menu',
    'rent-management.menu', 'deposits.menu', 'payments.menu'];

return [
    'roles' => [
        Role::Admin->value => [...$member, ...$crm, ...$externalMenus,
            'admin.access', 'dashboard.view', 'categories.manage', 'brokers.manage', 'assignments.manage',
            'users.manage', 'roles.manage', 'reports.view', 'customers.view_all', 'customers.assign',
            'logs.view_all', 'notifications.view_all', 'settings.menu', 'portal.contracts.menu', 'portal.invoices.menu'],
        Role::Broker->value => [...$member, ...$crm, ...$externalMenus, 'admin.access'],
        Role::Owner->value => $member,
        Role::Staff->value => $member,
        Role::Customer->value => [...$member, 'portal.contracts.menu', 'portal.invoices.menu'],
    ],
];
