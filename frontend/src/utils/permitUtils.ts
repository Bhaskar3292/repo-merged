import { Permit, PermitFilter } from '../types/permit';

/**
 * Calculate permit status based on expiry date
 * Uses UTC dates to prevent timezone offset issues
 */
export function calculateStatus(permit: Permit): 'active' | 'expiring' | 'expired' | 'superseded' {
  if (!permit.isActive || permit.status === 'superseded') {
    return 'superseded';
  }

  // Get today's date at midnight UTC
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse expiry date as UTC to match database format
  const dateOnly = permit.expiryDate.split('T')[0];
  const expiryDate = new Date(dateOnly + 'T00:00:00Z');

  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  console.log('[calculateStatus] Today:', today);
  console.log('[calculateStatus] Expiry:', expiryDate);
  console.log('[calculateStatus] Days until expiry:', daysUntilExpiry);

  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring';
  } else {
    return 'active';
  }
}

export function getStatusBadge(status: string): { text: string; className: string } {
  const badges = {
    active: { text: 'Active', className: 'bg-green-100 text-green-800' },
    expiring: { text: 'Expiring Soon', className: 'bg-yellow-100 text-yellow-800' },
    expired: { text: 'Expired', className: 'bg-red-100 text-red-800' },
    superseded: { text: 'Superseded', className: 'bg-gray-100 text-gray-800' }
  };

  return badges[status as keyof typeof badges] || badges.active;
}

export function getBorderColor(status: string): string {
  const colors = {
    active: 'border-green-500',
    expiring: 'border-yellow-500',
    expired: 'border-red-500',
    superseded: 'border-gray-400'
  };

  return colors[status as keyof typeof colors] || colors.active;
}

/**
 * Format date string for display
 * Handles timezone issues by treating date as UTC to prevent day offset
 *
 * Database stores: "2021-10-01"
 * Without UTC fix: "Sep 30, 2021" (timezone converts to previous day)
 * With UTC fix: "Oct 1, 2021" (correct display)
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';

  console.log('[formatDate] Input:', dateString);

  // Remove any time component if present (e.g., "2021-10-01T00:00:00Z" -> "2021-10-01")
  const dateOnly = dateString.split('T')[0];

  // Parse as UTC by appending 'T00:00:00Z' to prevent timezone conversion
  // This ensures "2021-10-01" stays as Oct 1, not Sep 30
  const date = new Date(dateOnly + 'T00:00:00Z');

  console.log('[formatDate] Parsed date:', date);
  console.log('[formatDate] UTC string:', date.toUTCString());

  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC' // Force UTC to prevent local timezone offset
  });

  console.log('[formatDate] Formatted:', formatted);

  return formatted;
}

export function filterPermits(permits: Permit[], filter: PermitFilter): Permit[] {
  if (filter === 'all') {
    return permits;
  }

  return permits.filter(permit => {
    const status = calculateStatus(permit);
    return status === filter;
  });
}
