'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  FloorTableDetailItem,
  TableShape,
  TableSection,
} from '../../../../types/floor';
import {
  Settings,
  Armchair,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
  MapPin,
} from 'lucide-react';

export default function FloorLayoutEditorPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [tables, setTables] = useState<FloorTableDetailItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/api/floor/tables?locationId=${locationId}`);
      if (res.data?.success) {
        setTables(res.data.data);
        if (res.data.data.length > 0 && !selectedTableId) {
          setSelectedTableId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [locationId, selectedTableId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const updateTableLayout = (field: string, value: any) => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTable.id) return t;
        const currentLayout = t.layout || {
          floorId: 'floor-main',
          positionX: 10,
          positionY: 10,
          width: 12,
          height: 14,
          rotation: 0,
          shape: 'RECTANGLE' as TableShape,
        };
        return {
          ...t,
          layout: {
            ...currentLayout,
            [field]: value,
          },
        };
      })
    );
  };

  // Applies balanced, architect-designed default grid coordinates across sections
  const applyRecommendedLayout = () => {
    if (!confirm('Apply the recommended architectural layout for all tables in this venue?')) return;
    setTables((prev) =>
      prev.map((t, idx) => {
        let posX = 10;
        let posY = 10;
        let width = 12;
        let height = 12;
        let shape: TableShape = 'RECTANGLE';

        if (t.section === TableSection.MAIN_DINING) {
          // Main dining hall: 3 rows of 4 tables
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          posX = 8 + col * 18;
          posY = 12 + row * 22;
          width = t.capacity >= 6 ? 16 : 12;
          height = t.capacity >= 8 ? 16 : 12;
          shape = t.capacity === 2 ? 'ROUND' : 'RECTANGLE';
        } else if (t.section === TableSection.CHEFS_COUNTER) {
          // High top counter along the top right
          posX = 65 + (idx % 3) * 11;
          posY = 8;
          width = 9;
          height = 9;
          shape = 'ROUND';
        } else if (t.section === TableSection.OUTDOOR_TERRACE) {
          // Bottom right veranda
          posX = 65 + (idx % 3) * 11;
          posY = 65;
          width = 11;
          height = 11;
          shape = 'SQUARE';
        } else if (t.section === TableSection.PRIVATE_DINING) {
          // Top left executive salon
          posX = 8;
          posY = 70;
          width = 22;
          height = 18;
          shape = 'BOOTH';
        }

        return {
          ...t,
          layout: {
            floorId: 'floor-main',
            sectionId: t.section,
            positionX: Math.min(85, Math.max(5, posX)),
            positionY: Math.min(80, Math.max(5, posY)),
            width,
            height,
            rotation: 0,
            shape,
          },
        };
      })
    );
  };

  const handleSaveLayout = async () => {
    try {
      setSaving(true);
      setError(null);
      setSavedSuccess(false);

      const payload = {
        locationId,
        layout: tables.map((t) => ({
          tableId: t.id,
          positionX: t.layout?.positionX ?? 10,
          positionY: t.layout?.positionY ?? 10,
          width: t.layout?.width ?? 12,
          height: t.layout?.height ?? 12,
          rotation: t.layout?.rotation ?? 0,
          shape: t.layout?.shape ?? 'RECTANGLE',
          sectionId: t.section,
        })),
      };

      const res = await apiClient.put('/api/floor/layout', payload);
      if (res.data?.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save floor layout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                ADMINISTRATION / FLOOR CONFIGURATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Floor Layout Editor
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Position dining tables on the restaurant floor canvas, adjust geometry, and configure seating shapes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={applyRecommendedLayout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition"
              title="Apply balanced grid coordinates automatically"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Recommended Layout</span>
            </button>

            <button
              onClick={handleSaveLayout}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black shadow-xs transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Layout</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Floor layout successfully persisted to database. All staff dashboards updated in real-time.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN WORKSPACE: CANVAS & CONFIGURATION FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INTERACTIVE PREVIEW CANVAS */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Interactive Canvas Preview (Click a table to edit)</span>
              <span>{tables.length} tables registered</span>
            </div>

            <div
              className={`w-full h-[520px] rounded-2xl border relative overflow-hidden select-none p-4 ${
                isDark ? 'bg-[#121210] border-zinc-800' : 'bg-[#F9F7F2] border-zinc-200'
              }`}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle, ${isDark ? '#555' : '#bbb'} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const posX = table.layout?.positionX ?? 10;
                const posY = table.layout?.positionY ?? 10;
                const width = table.layout?.width ?? 12;
                const height = table.layout?.height ?? 12;
                const shape = table.layout?.shape || 'RECTANGLE';

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`absolute cursor-pointer border-2 transition-all p-2 flex flex-col justify-between items-center text-center ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-500/20 z-20 scale-105'
                        : isDark
                        ? 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-500'
                        : 'border-zinc-300 bg-white hover:border-zinc-400 shadow-sm'
                    } ${shape === 'ROUND' ? 'rounded-full' : shape === 'BOOTH' ? 'rounded-2xl border-dashed' : 'rounded-xl'}`}
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                      width: `${Math.max(65, width * 6.5)}px`,
                      height: `${Math.max(55, height * 5.5)}px`,
                    }}
                  >
                    <span className="text-xs font-mono font-bold text-amber-500">
                      {table.tableNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {table.capacity}p
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE COORDINATE & GEOMETRY INSPECTOR */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              Table Geometry Inspector
            </h3>

            {selectedTable ? (
              <div className={`p-5 rounded-2xl border space-y-4 text-xs ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div>
                    <span className="font-mono font-bold text-base text-amber-500">
                      Table {selectedTable.tableNumber}
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      {selectedTable.name} &bull; {selectedTable.capacity} Seats
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    {selectedTable.section}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      X Position ({selectedTable.layout?.positionX ?? 10}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="85"
                      value={selectedTable.layout?.positionX ?? 10}
                      onChange={(e) => updateTableLayout('positionX', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Y Position ({selectedTable.layout?.positionY ?? 10}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={selectedTable.layout?.positionY ?? 10}
                      onChange={(e) => updateTableLayout('positionY', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Width ({selectedTable.layout?.width ?? 12})
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="30"
                      value={selectedTable.layout?.width ?? 12}
                      onChange={(e) => updateTableLayout('width', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Height ({selectedTable.layout?.height ?? 12})
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="30"
                      value={selectedTable.layout?.height ?? 12}
                      onChange={(e) => updateTableLayout('height', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Visual Shape
                  </label>
                  <select
                    value={selectedTable.layout?.shape || 'RECTANGLE'}
                    onChange={(e) => updateTableLayout('shape', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground"
                  >
                    <option value="RECTANGLE">Rectangle (Standard Dining)</option>
                    <option value="ROUND">Round (Two-Top / High-Top)</option>
                    <option value="SQUARE">Square (Veranda / Terrace)</option>
                    <option value="BOOTH">Booth (Alcove / VIP)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground italic">
                    Coordinates update live in the canvas preview. Remember to click "Save Layout" to persist all changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 border rounded-2xl text-center text-xs text-muted-foreground">
                Select a table from the canvas to edit its layout
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
