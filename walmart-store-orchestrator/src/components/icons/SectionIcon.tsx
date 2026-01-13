'use client';

import {
  Apple,
  ShoppingBasket,
  Heart,
  Package,
  Tv,
  DollarSign,
  ShoppingCart,
  Truck,
  Warehouse,
  Shield,
  Users,
  LucideIcon,
} from 'lucide-react';
import { SectionKey } from '@/data/stores';

const iconMap: Record<string, LucideIcon> = {
  Apple,
  ShoppingBasket,
  Heart,
  Package,
  Tv,
  DollarSign,
  ShoppingCart,
  Truck,
  Warehouse,
  Shield,
  Users,
};

// Map section keys to icon names
const sectionIconMap: Record<SectionKey, string> = {
  A: 'Apple',
  B: 'ShoppingBasket',
  C: 'Heart',
  D: 'Package',
  E: 'Tv',
  F: 'DollarSign',
  G: 'ShoppingCart',
  H: 'Truck',
  I: 'Warehouse',
  J: 'Shield',
  K: 'Users',
};

interface SectionIconProps {
  section: SectionKey;
  className?: string;
  size?: number;
}

export function SectionIcon({ section, className = '', size = 20 }: SectionIconProps) {
  const iconName = sectionIconMap[section];
  const Icon = iconMap[iconName];

  if (!Icon) {
    return null;
  }

  return <Icon className={className} size={size} />;
}

export function getIconByName(name: string): LucideIcon | null {
  return iconMap[name] || null;
}
