'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffLayout } from '../../../../../components/staff/StaffLayout';
import { StaffRole } from '../../../../../types/staff';
import {
  ClientMenuCategory,
  PublicationStatus,
  DIETARY_TAGS,
  ALLERGENS,
  SPICE_LEVELS,
} from '../../../../../types/menu';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import {
  ArrowLeft,
  Upload,
  Plus,
  CheckCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export default function AddNewDishPage() {
  const router = useRouter();
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

  // Metadata & upload states
  const [categories, setCategories] = useState<ClientMenuCategory[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient<{ success: boolean; data: ClientMenuCategory[] }>('/admin/menu/categories')
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0) {
            setCategoryId(res.data[0].id);
          }
        }
      })
      .catch((err) => console.warn('[NewDish] Could not load categories:', err));
  }, []);

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
        setErrorMessage(err.message || 'Image upload failed. You may also paste a direct image URL.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (status: PublicationStatus) => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Dish Name is required.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please assign a menu category.');
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMessage('Short description is required.');
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

      const images = imageUrl.trim()
        ? [imageUrl.trim()]
        : ['https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000'];

      await apiClient('/admin/menu', {
        method: 'POST',
        data: {
          name: name.trim(),
          categoryId,
          shortDescription: shortDescription.trim(),
          description: description.trim() || shortDescription.trim(),
          price: Number(price),
          currency,
          images,
          ingredients,
          allergens: selectedAllergens,
          dietaryTags: selectedDietaryTags,
          spiceLevel,
          preparationTimeMinutes: prepTime,
          isAvailable,
          isFeatured,
          publicationStatus: status,
          displayOrder,
          locationIds: ['loc-colombo-main'],
        },
      });

      router.push('/staff/admin/menu');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create dish.');
    } finally {
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
            Add New Dish
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
            Introduce a new culinary creation with pricing, dietary information, allergens, and photos.
          </p>
        </div>

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM CONTAINER */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          {/* DISH NAME & CATEGORY */}
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
                placeholder="e.g. Ceylon Pepper Beef"
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
                Short Description (Menu Tagline) <span className="text-[#B99A63]">*</span>
              </label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Charred tenderloin with Tellicherry pepper crackling"
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
                placeholder="Detailed description of flavors, preparations, and culinary inspiration..."
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
                step={10}
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="6850"
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

          {/* IMAGE UPLOAD & PREVIEW */}
          <div className="space-y-3">
            <label className={`block text-xs font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
              Primary Food Image
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
                <span className={`text-[10px] font-mono mt-1 block ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                  Or upload directly from your device below:
                </span>
              </div>

              <div>
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
                  <span>{uploadingImage ? 'Uploading image...' : 'Upload Image File (Max 5MB)'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-current/10">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border bg-black">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs truncate flex-1 font-mono text-[#B99A63]">{imageUrl}</div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs font-mono text-rose-400 hover:underline"
                >
                  Remove
                </button>
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
              placeholder="Prime Beef Tenderloin, Tellicherry Black Pepper, Smoked Aubergine..."
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
                        ? 'border-[#2C2C28] text-[#7A766D] hover:text-[#D1CDC7]'
                        : 'border-[#E5DFD3] text-[#8E8A80] hover:text-[#4A4740]'
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
                        ? 'border-[#2C2C28] text-[#7A766D] hover:text-[#D1CDC7]'
                        : 'border-[#E5DFD3] text-[#8E8A80] hover:text-[#4A4740]'
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPICE LEVEL, FEATURED, AVAILABILITY */}
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
                id="isAvailableCheck"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
              />
              <label htmlFor="isAvailableCheck" className={`text-xs cursor-pointer font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Dish In Stock & Available
              </label>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isFeaturedCheck"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
              />
              <label htmlFor="isFeaturedCheck" className={`text-xs cursor-pointer font-medium ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Featured Signature Dish
              </label>
            </div>
          </div>

          {/* FORM BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-current/10">
            <Link
              href="/staff/admin/menu"
              className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors ${
                isDark ? 'text-[#A5A198] hover:text-[#F6F1E8]' : 'text-[#6B685F] hover:text-[#171715]'
              }`}
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(PublicationStatus.DRAFT)}
              className={`px-5 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                isDark
                  ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                  : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
              }`}
            >
              <FileText size={14} className="text-[#B99A63]" />
              SAVE AS DRAFT
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(PublicationStatus.PUBLISHED)}
              className="px-6 py-2.5 rounded-xl bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  PUBLISH DISH
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
