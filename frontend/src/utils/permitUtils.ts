import { Permit, PermitFilter } from '../types/permit';

export function calculateStatus(permit: Permit): 'active' | 'expiring' | 'expired' | 'superseded' {
  if (!permit.isActive || permit.status === 'superseded') {
    return 'superseded';
  }

  const today = new Date();
  const expiryDate = new Date(permit.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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
