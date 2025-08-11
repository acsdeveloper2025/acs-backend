import type { Role } from '@/types/auth';
import {
  LayoutDashboard,
  FileText,
  Building2,
  MapPin,
  Receipt,
  BarChart3,
  UserCog,
  CheckSquare,
  Settings,
  Wifi,
  Shield,
  Plus,
  CheckCircle
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  roles: Role[];
  children?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'BACKEND', 'BANK'],
  },
  {
    id: 'cases',
    label: 'Case Management',
    href: '/cases',
    icon: FileText,
    roles: ['ADMIN', 'BACKEND'],
    children: [
      {
        id: 'cases-list',
        label: 'All Cases',
        href: '/cases',
        icon: FileText,
        roles: ['ADMIN', 'BACKEND'],
      },
      {
        id: 'cases-new',
        label: 'Create New Case',
        href: '/cases/new',
        icon: Plus,
        roles: ['ADMIN', 'BACKEND'],
      },
      {
        id: 'cases-completed',
        label: 'Completed Cases',
        href: '/cases/completed',
        icon: CheckCircle,
        roles: ['ADMIN', 'BACKEND'],
      },
      {
        id: 'cases-pending',
        label: 'Pending Review',
        href: '/cases/pending',
        icon: CheckSquare,
        roles: ['ADMIN', 'BACKEND'],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Client Management',
    href: '/clients',
    icon: Building2,
    roles: ['ADMIN'],
    children: [
      {
        id: 'clients-list',
        label: 'Clients',
        href: '/clients',
        icon: Building2,
        roles: ['ADMIN'],
      },
      {
        id: 'products',
        label: 'Products',
        href: '/products',
        icon: Settings,
        roles: ['ADMIN'],
      },
      {
        id: 'verification-types',
        label: 'Verification Types',
        href: '/verification-types',
        icon: CheckSquare,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'locations',
    label: 'Location Management',
    href: '/locations',
    icon: MapPin,
    roles: ['ADMIN'],
    children: [
      {
        id: 'cities',
        label: 'Cities',
        href: '/cities',
        icon: MapPin,
        roles: ['ADMIN'],
      },
      {
        id: 'pincodes',
        label: 'Pincodes',
        href: '/pincodes',
        icon: MapPin,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Commission',
    href: '/billing',
    icon: Receipt,
    roles: ['ADMIN', 'BACKEND'],
    children: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/invoices',
        icon: Receipt,
        roles: ['ADMIN', 'BACKEND'],
      },
      {
        id: 'commissions',
        label: 'Commissions',
        href: '/commissions',
        icon: BarChart3,
        roles: ['ADMIN', 'BACKEND'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & MIS',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'BACKEND', 'BANK'],
    children: [
      {
        id: 'bank-bills',
        label: 'Bank Bills',
        href: '/reports/bank-bills',
        icon: Receipt,
        roles: ['BANK'],
      },
      {
        id: 'mis-dashboard',
        label: 'MIS Dashboard',
        href: '/reports/mis',
        icon: BarChart3,
        roles: ['ADMIN', 'BACKEND'],
      },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/users',
    icon: UserCog,
    roles: ['ADMIN'],
  },
  {
    id: 'realtime',
    label: 'Real-time Features',
    href: '/realtime',
    icon: Wifi,
    roles: ['ADMIN', 'BACKEND'],
  },
  {
    id: 'forms',
    label: 'Form Viewer',
    href: '/forms',
    icon: FileText,
    roles: ['ADMIN', 'BACKEND'],
  },
  {
    id: 'security-ux',
    label: 'Security & UX',
    href: '/security-ux',
    icon: Shield,
    roles: ['ADMIN'],
  },
];
