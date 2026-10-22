'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Armchair,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
  GlassWater,
  Users,
  UserCheck,
  TrendingUp,
  Bell,
  Settings,
  User,
  Clock,
  Flame,
  CheckCircle2,
  History,
  Crown,
  MapPin,
  CheckSquare,
  BellRing,
  AlertTriangle,
  Send,
  BarChart3,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Armchair,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
  GlassWater,
  Users,
  UserCheck,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Settings,
  User,
  Clock,
  Flame,
  CheckCircle2,
  History,
  Crown,
  MapPin,
  CheckSquare,
  BellRing,
  AlertTriangle,
  Send,
};

interface NavIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const NavIcon = ({ name, size = 18, className = '' }: NavIconProps) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent size={size} className={className} />;
};
