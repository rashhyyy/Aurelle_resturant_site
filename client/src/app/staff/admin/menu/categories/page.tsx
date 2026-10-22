'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../../components/staff/StaffLayout';
import { StaffRole } from '../../../../../types/staff';
import { ClientMenuCategory } from '../../../../../types/menu';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import {
  ArrowLeft,
  Plus,
  Edit,
  Archive,
  Layers,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';

export default function CategoryManagementPage() {
  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<ClientMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ClientMenuCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsVisible, setFormIsVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient<{ success: boolean; data: ClientMenuCategory[] }>(
        '/admin/menu/categories'
      );
      if (res?.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormDisplayOrder(categories.length + 1);
    setFormIsVisible(true);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: ClientMenuCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormDisplayOrder(cat.displayOrder);
    setFormIsVisible(cat.isVisible);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formName.trim()) {
      setModalError('Category Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await apiClient(`/admin/menu/categories/${editingCategory.id}`, {
          method: 'PATCH',
          data: {
            name: formName.trim(),
            description: formDescription.trim(),
            displayOrder: formDisplayOrder,
            isVisible: formIsVisible,
          },
        });
      } else {
        await apiClient('/admin/menu/categories', {
          method: 'POST',
          data: {
            name: formName.trim(),
            slug: formSlug.trim() || undefined,
            description: formDescription.trim(),
            displayOrder: formDisplayOrder,
            isVisible: formIsVisible,
          },
        });
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (cat: ClientMenuCategory) => {
    try {
      await apiClient(`/admin/menu/categories/${cat.id}`, {
        method: 'PATCH',
        data: { isVisible: !cat.isVisible },
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle category visibility.');
    }
  };

  const handleArchive = async (cat: ClientMenuCategory) => {
    if (
      !confirm(
        `Are you sure you want to archive category "${cat.name}"? It will be hidden from public guest menus. Dishes in this category will remain safely preserved in the database.`
      )
    ) {
      return;
    }

    try {
      await apiClient(`/admin/menu/categories/${cat.id}/archive`, { method: 'POST' });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to archive category.');
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* TOP BREADCRUMB */}
        <div className="flex items-center justify-between pb-3 border-b border-current/10">
          <Link
            href="/staff/admin/menu"
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors ${
              isDark ? 'text-[#A5A198] hover:text-[#B99A63]' : 'text-[#6B685F] hover:text-[#B99A63]'
            }`}
          >
            <ArrowLeft size={14} />
            Back to Menu Directory
          </Link>
        </div>

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#B99A63] font-semibold">
              AURELLE / ADMINISTRATION
            </span>
            <h1
              className={`text-2xl sm:text-3xl font-serif tracking-tight mt-1 ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Category Management
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
              Organize culinary sections, control guest navigation order, and manage section visibility.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            + ADD CATEGORY
          </button>
        </div>

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CATEGORIES TABLE */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-mono uppercase tracking-[0.2em] ${
                    isDark ? 'border-[#2C2C28] bg-[#171715] text-[#A5A198]' : 'border-[#E5DFD3] bg-[#F9F7F2] text-[#6B685F]'
                  }`}
                >
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-current/10 text-xs">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 w-6 bg-current/10 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-current/10 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-current/10 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-3 w-48 bg-current/10 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-16 bg-current/10 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-6 w-16 bg-current/10 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-mono text-gray-400">
                      No categories found. Click &quot;+ ADD CATEGORY&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#252522]' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#B99A63]">
                        #{cat.displayOrder}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-[#B99A63]" />
                          <span
                            className={`font-serif font-medium text-sm ${
                              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                            }`}
                          >
                            {cat.name}
                          </span>
                          {cat.isArchived && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#A5A198]">
                        {cat.slug}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-[11px] font-light">
                        {cat.description || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleVisibility(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                            cat.isVisible
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-stone-500/10 text-stone-400 border-stone-500/30 hover:bg-stone-500/20'
                          }`}
                        >
                          {cat.isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                          <span>{cat.isVisible ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isDark
                                ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                                : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
                            }`}
                            title="Edit Category"
                          >
                            <Edit size={13} className="text-[#B99A63]" />
                          </button>

                          {!cat.isArchived && (
                            <button
                              onClick={() => handleArchive(cat)}
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Archive Category"
                            >
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div
                className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
                }`}
              >
                <h3 className={`text-sm font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                  {editingCategory ? 'Edit Menu Category' : 'Create New Menu Category'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                    Category Name <span className="text-[#B99A63]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Seafood & Shellfish"
                    className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${
                      isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                    }`}
                  />
                </div>

                {!editingCategory && (
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                      Custom Slug (Optional)
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. seafood-shellfish"
                      className={`w-full px-3 py-2 rounded-lg text-xs font-mono border outline-none ${
                        isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description for menu highlights..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                      isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-mono border outline-none ${
                        isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F9F7F2] border-[#E5DFD3]'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="formIsVisible"
                      checked={formIsVisible}
                      onChange={(e) => setFormIsVisible(e.target.checked)}
                      className="w-4 h-4 rounded border-[#B99A63] text-[#B99A63]"
                    />
                    <label htmlFor="formIsVisible" className={`text-xs cursor-pointer ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                      Publicly Visible
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-current/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
