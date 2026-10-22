'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StaffLayout } from '../../../../../../components/staff/StaffLayout';
import { StaffRole } from '../../../../../../types/staff';
import {
  ClientMenuItem,
  ClientMenuCategory,
  PublicationStatus,
  DIETARY_TAGS,
  ALLERGENS,
  SPICE_LEVELS,
} from '../../../../../../types/menu';
import { useStaffAuth } from '../../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../../lib/api';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Archive,
  EyeOff,
} from 'lucide-react';

function EditDishContent() {
  const params = useParams();
  const router = useRouter();
  const dishId = params?.id as string;

  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('LKR');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>('None');
  const [prepTime, setPrepTime] = useState<number>(15);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<PublicationStatus>(PublicationStatus.DRAFT);

  // Metadata & upload states
  const [categories, setCategories] = useState<ClientMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load Categories & Dish Details
  const loadData = useCallback(async () => {
    if (!dishId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [catRes, dishRes] = await Promise.all([
        apiClient<{ success: boolean; data: ClientMenuCategory[] }>('/admin/menu/categories'),
        apiClient<{ success: boolean; data: ClientMenuItem }>(`/admin/menu/${dishId}`),
      ]);

      if (catRes?.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }

      if (dishRes?.success && dishRes.data) {
        const d = dishRes.data;
        setName(d.name);
        setCategoryId(d.categoryId);
        setShortDescription(d.shortDescription || '');
        setDescription(d.description || '');
        setPrice(Math.round(d.priceMinor / 100));
        setCurrency(d.currency || 'LKR');
        setImageUrl(d.images?.[0] || '');
        setIngredientsStr(d.ingredients?.join(', ') || '');
        setSelectedAllergens(d.allergens || []);
        setSelectedDietaryTags(d.dietaryTags || []);
        setSpiceLevel(d.spiceLevel || 'None');
        setPrepTime(d.preparationTimeMinutes || 15);
        setIsAvailable(d.isAvailable);
        setIsFeatured(d.isFeatured);
        setDisplayOrder(d.displayOrder || 0);
        setStatus(d.publicationStatus);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load dish details.');
    } finally {
      setLoading(false);
    }
  }, [dishId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter((item) => item !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image exceeds maximum permitted size of 5 MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await apiClient<{ success: boolean; data: { url: string } }>('/admin/menu/images', {
          method: 'POST',
          data: { image: base64Data, filename: file.name },
        });

        if (res?.success && res.data?.url) {
          setImageUrl(res.data.url);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Image upload failed.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async (overrideStatus?: PublicationStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Dish Name is required.');
      return;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMessage('Please specify a valid positive price.');
      return;
    }

    setSubmitting(true);
    try {
      const ingredients = ingredientsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const images = imageUrl.trim() ? [imageUrl.trim()] : [];

      const targetStatus = overrideStatus || status;

      await apiClient(`/admin/menu/${dishId}`, {
        method: 'PATCH',
        data: {
          name: name.trim(),
          categoryId,
          shortDescription: shortDescription.trim(),
          description: description.trim() || shortDescription.trim(),
          price: Number(price),
          images,
          ingredients,
          allergens: selectedAllergens,
          dietaryTags: selectedDietaryTags,
          spiceLevel,
          preparationTimeMinutes: prepTime,
          isAvailable,
          isFeatured,
          displayOrder,
          publicationStatus: targetStatus,
        },
      });

      setStatus(targetStatus);
      setSuccessMessage('Dish updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${name}"? It will be removed from public guest menus.`)) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient(`/admin/menu/${dishId}/archive`, { method: 'POST' });
      router.push('/staff/admin/menu');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to archive dish.');
      setSubmitting(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6 max-w-4xl mx-auto">
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

          <span
            className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider border ${
              status === PublicationStatus.PUBLISHED
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : status === PublicationStatus.DRAFT
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {status}
          </span>
        </div>

        {/* PAGE HEADER */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#B99A63] font-semibold">
            AURELLE / ADMINISTRATION
          </span>
          <h1
            className={`text-2xl sm:text-3xl font-serif tracking-tight mt-1 ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            Edit Dish: {name || 'Loading...'}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
            Update culinary ingredients, price adjustments, allergens, and publication state.
          </p>
        </div>

        {/* FEEDBACK BANNERS */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div
            className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <RefreshCw size={24} className="animate-spin text-[#B99A63] mx-auto mb-3" />
            <p className="text-xs font-mono text-gray-400">Loading dish dossier...</p>
          </div>
        ) : (
          <div
            className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            {/* NAME & CATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Dish Name <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Menu Category <span className="text-[#B99A63]">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider outline-none border cursor-pointer ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SHORT & FULL DESCRIPTIONS */}
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Short Tagline <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Full Culinary Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>
            </div>

            {/* PRICE, CURRENCY, PREPARATION TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Price (LKR) <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Currency
                </label>
                <input
                  type="text"
                  readOnly
                  value={currency}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase border outline-none opacity-80 ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#A5A198]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#6B685F]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Prep Time (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>
            </div>

            {/* IMAGE MANAGEMENT */}
            <div className="space-y-3">
              <label className={`block text-xs font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Food Photo
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste direct HTTPS image URL..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />

                <label
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed cursor-pointer text-xs transition-colors ${
                    uploadingImage
                      ? 'opacity-50 pointer-events-none'
                      : isDark
                      ? 'border-[#B99A63]/40 hover:bg-[#252522] text-[#B99A63]'
                      : 'border-[#B99A63]/50 hover:bg-[#FAF8F5] text-[#8C6D37]'
                  }`}
                >
                  <Upload size={14} />
                  <span>{uploadingImage ? 'Uploading...' : 'Replace Image File'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>

              {imageUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-current/10">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border bg-black">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs truncate flex-1 font-mono text-[#B99A63]">{imageUrl}</div>
                </div>
              )}
            </div>

            {/* INGREDIENTS */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Ingredients (Comma-separated)
              </label>
              <input
                type="text"
                value={ingredientsStr}
                onChange={(e) => setIngredientsStr(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                    : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                }`}
              />
            </div>

            {/* DIETARY TAGS */}
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Dietary Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TAGS.map((tag) => {
                  const active = selectedDietaryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag, selectedDietaryTags, setSelectedDietaryTags)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                        active
                          ? isDark
                            ? 'bg-[#B99A63]/15 border-[#B99A63] text-[#F6F1E8]'
                            : 'bg-[#B99A63]/20 border-[#B99A63] text-[#171715]'
                          : isDark
                          ? 'border-[#2C2C28] text-[#7A766D]'
                          : 'border-[#E5DFD3] text-[#8E8A80]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ALLERGENS */}
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Allergens Present
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((allergen) => {
                  const active = selectedAllergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => handleToggleTag(allergen, selectedAllergens, setSelectedAllergens)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                        active
                          ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                          : isDark
                          ? 'border-[#2C2C28] text-[#7A766D]'
                          : 'border-[#E5DFD3] text-[#8E8A80]'
                      }`}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SPICE LEVEL, AVAILABILITY, FEATURED */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-current/10">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Spice Intensity
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono outline-none border cursor-pointer ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  {SPICE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="editIsAvailableCheck"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
                />
                <label htmlFor="editIsAvailableCheck" className={`text-xs cursor-pointer font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  In Stock & Available
                </label>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="editIsFeaturedCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
                />
                <label htmlFor="editIsFeaturedCheck" className={`text-xs cursor-pointer font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Featured Signature Dish
                </label>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-current/10">
              <button
                type="button"
                onClick={handleArchive}
                className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Archive size={13} />
                Archive Dish
              </button>

              <div className="flex items-center gap-2.5">
                {status === PublicationStatus.PUBLISHED ? (
                  <button
                    type="button"
                    onClick={() => handleSaveChanges(PublicationStatus.DRAFT)}
                    className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <EyeOff size={13} />
                    Unpublish to Draft
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveChanges(PublicationStatus.PUBLISHED)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle size={13} />
                    Publish to Guests
                  </button>
                )}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveChanges()}
                  className="px-6 py-2.5 rounded-xl bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

export default function EditDishPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#171715] flex items-center justify-center text-[#B99A63] font-mono text-xs">
          Loading dish editor...
        </div>
      }
    >
      <EditDishContent />
    </React.Suspense>
  );
}
