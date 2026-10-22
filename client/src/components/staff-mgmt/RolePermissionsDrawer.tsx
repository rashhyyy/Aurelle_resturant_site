'use client';

import React from 'react';
import { X, Shield, Check, Lock, Info } from 'lucide-react';
import { StaffRole, ROLE_LABELS } from '../../types/staff';

interface RolePermissionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  permissionsMatrix: Record<StaffRole, string[]> | null;
  isDark: boolean;
}

const ALL_CAPABILITIES = [
  { id: 'staff.manage', label: 'Staff Management', desc: 'Invite, assign roles, configure venues, and revoke accounts' },
  { id: 'menu.manage', label: 'Menu Engineering', desc: 'Create, price, and curate culinary recipes and wine pairings' },
  { id: 'orders.view', label: 'View Dining Orders', desc: 'Observe active table checks, billing, and order histories' },
  { id: 'orders.manage', label: 'Modify Orders', desc: 'Fire courses, apply comps/discounts, and process payments' },
  { id: 'kitchen.orders.manage', label: 'Kitchen Expediting', desc: 'Acknowledge kitchen tickets, bump courses, and call pass' },
  { id: 'reservations.manage', label: 'Reservations & Bookings', desc: 'Accept table reservations, allocate salons, and seat parties' },
  { id: 'reception.checkin', label: 'Guest Reception', desc: 'Greet guests, manage door arrivals, and tag VIP profiles' },
  { id: 'floor.tables.manage', label: 'Floor Plan & Tables', desc: 'Modify table turns, mark cleaning, and hold floor sections' },
  { id: 'floor.tasks.manage', label: 'Floor Service Tasks', desc: 'Water service, cutlery clearing, and runner requests' },
  { id: 'reports.view', label: 'Executive Analytics', desc: 'Access revenue reports, covers throughput, and labor metrics' },
  { id: 'settings.manage', label: 'System Settings', desc: 'Configure payment gateways, printers, and integrations' },
];

export const RolePermissionsDrawer: React.FC<RolePermissionsDrawerProps> = ({
  isOpen,
  onClose,
  permissionsMatrix,
  isDark,
}) => {
  if (!isOpen) return null;

  const roles = [
    StaffRole.ADMIN,
    StaffRole.MANAGER,
    StaffRole.KITCHEN,
    StaffRole.RECEPTION,
    StaffRole.FLOOR,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/20 flex items-center justify-center text-[#B99A63]">
              <Shield size={16} />
            </div>
            <div>
              <h3 className={`text-base font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                Role-Based Access Control (RBAC) Matrix
              </h3>
              <p className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                Least-Privilege Security Governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${
              isDark ? 'text-[#A5A198] hover:text-[#F6F1E8]' : 'text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 p-3 rounded-lg bg-[#B99A63]/10 border border-[#B99A63]/25 flex items-start gap-2.5 text-xs text-[#B99A63]">
            <Info size={15} className="shrink-0 mt-0.5" />
            <span>
              Aurelle enforces role permissions server-side on every API request. Permissions are locked to predefined secure sets to prevent privilege escalation.
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-mono uppercase tracking-wider ${
                  isDark ? 'border-[#2C2C28] text-[#A5A198]' : 'border-[#E5DFD3] text-[#6B685F]'
                }`}
              >
                <th className="py-3 px-3 w-1/3">Platform Capability</th>
                {roles.map((r) => (
                  <th key={r} className="py-3 px-2 text-center">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2C2C28]' : 'divide-[#E5DFD3]'}`}>
              {ALL_CAPABILITIES.map((cap) => (
                <tr
                  key={cap.id}
                  className={`transition-colors ${isDark ? 'hover:bg-[#252522]' : 'hover:bg-[#FAF8F5]'}`}
                >
                  <td className="py-3 px-3">
                    <div className={`font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                      {cap.label}
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      {cap.desc}
                    </div>
                  </td>
                  {roles.map((r) => {
                    const hasPerm = permissionsMatrix?.[r]?.includes(cap.id);
                    return (
                      <td key={r} className="py-3 px-2 text-center">
                        {hasPerm ? (
                          <div className="w-5 h-5 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Check size={11} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 mx-auto rounded-full bg-transparent flex items-center justify-center text-current/20">
                            <Lock size={10} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-right ${
            isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54]"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
