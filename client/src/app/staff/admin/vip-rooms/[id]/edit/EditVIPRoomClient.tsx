'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StaffLayout } from '../../../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../../../types/staff';
import { IVIPRoomSafeJSON } from '../../../../../../types/vip';
import { apiClient } from '../../../../../../lib/api';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface EditVIPRoomClientProps {
  id: string;
}

export default function EditVIPRoomClient({ id }: EditVIPRoomClientProps) {
  const router = useRouter();
  const { selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tag, setTag] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [capacityMin, setCapacityMin] = useState(2);
  const [capacityMax, setCapacityMax] = useState(12);
  const [squareMeters, setSquareMeters] = useState('');
  const [basePriceMajor, setBasePriceMajor] = useState(0);
  const [minimumSpendMajor, setMinimumSpendMajor] = useState(0);
  const [currency, setCurrency] = useState('LKR');
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(120);
  const [bufferMinutes, setBufferMinutes] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Lists
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [amenityLabel, setAmenityLabel] = useState('');
  const [amenityDetail, setAmenityDetail] = useState('');
  const [amenities, setAmenities] = useState<{ label: string; detail: string }[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient<any>(`/api/vip/rooms/${id}`);
        const room: IVIPRoomSafeJSON = res.data;
        setName(room.name);
        setSlug(room.slug);
        setTag(room.tag || '');
        setSubtitle(room.subtitle || '');
        setDescription(room.description || '');
        setShortDescription(room.shortDescription || '');
        setCapacityMin(room.capacityMin);
        setCapacityMax(room.capacityMax);
        setSquareMeters(room.squareMeters || '');
        setBasePriceMajor(room.basePriceMinor / 100);
        setMinimumSpendMajor(room.minimumSpendMinor / 100);
        setCurrency(room.currency || 'LKR');
        setBookingDurationMinutes(room.bookingDurationMinutes || 120);
        setBufferMinutes(room.bufferMinutes || 60);
        setIsActive(room.isActive);
        setIsPublished(room.isPublished);
        setImages(room.images || []);
        setAmenities(room.amenities || []);
        setFeatures(room.features || []);
        setSelectedCategories(room.categories || []);
      } catch (err: any) {
        console.error('Failed to load room for editing:', err);
        setError(err?.message || 'VIP room not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [id]);

  const addImage = () => {
    if (!imageUrl.trim()) return;
    setImages((prev) => [...prev, imageUrl.trim()]);
    setImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addAmenity = () => {
    if (!amenityLabel.trim() || !amenityDetail.trim()) return;
    setAmenities((prev) => [...prev, { label: amenityLabel.trim(), detail: amenityDetail.trim() }]);
    setAmenityLabel('');
    setAmenityDetail('');
  };

  const removeAmenity = (index: number) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures((prev) => [...prev, featureInput.trim()]);
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Please provide a room name.');
      return;
    }
    if (capacityMin < 1 || capacityMax < capacityMin) {
      setError('Minimum capacity must be at least 1, and maximum capacity must be >= minimum.');
      return;
    }
    if (basePriceMajor < 0 || minimumSpendMajor < 0) {
      setError('Pricing values must be non-negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        tag: tag.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        capacityMin: Number(capacityMin),
        capacityMax: Number(capacityMax),
        squareMeters: squareMeters.trim() || undefined,
        images,
        amenities,
        features,
        categories: selectedCategories,
        basePriceMinor: Math.round(Number(basePriceMajor) * 100),
        currency: currency.trim() || 'LKR',
        minimumSpendMinor: Math.round(Number(minimumSpendMajor) * 100),
        bookingDurationMinutes: Number(bookingDurationMinutes) || 120,
        bufferMinutes: Number(bufferMinutes) || 60,
        isActive,
        isPublished,
      };

      await apiClient<any>(`/api/admin/vip/rooms/${id}`, {
        method: 'PATCH',
        data: payload,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/staff/admin/vip-rooms');
      }, 1200);
    } catch (err: any) {
      console.error('Update VIP room error:', err);
      setError(err?.message || 'Failed to update VIP room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
        <div className="p-24 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 size={32} className="animate-spin text-[#B99A63]" />
          <p className="text-xs uppercase tracking-wider">Loading room configuration...</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Top Header */}
        <StaffPageHeader
          title={`Edit ${name || 'VIP Room'}`}
          subtitle="Update capacity thresholds, exclusivity pricing, concierge amenities, or availability."
          actions={
            <Link
              href="/staff/admin/vip-rooms"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                isDark
                  ? 'border-[#22211E] text-stone-300 hover:bg-[#1E1E1C]'
                  : 'border-[#E5DFD3] text-stone-700 hover:bg-stone-50'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Back to Directory</span>
            </Link>
          }
        />

        {/* Success Alert */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Room specifications saved successfully. Redirecting to directory...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity */}
            <div
              className={`p-6 rounded-2xl border space-y-5 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 flex items-center gap-2 border-b pb-3 border-stone-800">
                <Sparkles size={16} className="text-[#B99A63]" />
                <span>Space Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    disabled
                    value={slug}
                    className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono outline-none bg-stone-900/60 border border-stone-800 text-stone-500 cursor-not-allowed"
                    title="URL slugs are permanent to avoid breaking existing customer links"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                    Square Meters
                  </label>
                  <input
                    type="text"
                    value={squareMeters}
                    onChange={(e) => setSquareMeters(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none transition-all ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                  Full Atmosphere Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none resize-none transition-all ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
              </div>
            </div>

            {/* Photos */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 flex items-center gap-2 border-b pb-3 border-stone-800">
                <ImageIcon size={16} className="text-[#B99A63]" />
                <span>Photographs</span>
              </h3>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste photograph URL"
                  className={`flex-1 px-3.5 py-2 rounded-lg text-xs outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 rounded-lg bg-[#B99A63] text-white text-xs font-semibold hover:bg-[#A88952]"
                >
                  Add Photo
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group rounded-lg overflow-hidden border border-stone-800 aspect-video bg-stone-900"
                  >
                    <img src={img} alt={`Room photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities & Features */}
            <div
              className={`p-6 rounded-2xl border space-y-5 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Amenities & Features
              </h3>

              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
                  Add Exclusive Amenity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={amenityLabel}
                    onChange={(e) => setAmenityLabel(e.target.value)}
                    placeholder="Label"
                    className={`px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                  <input
                    type="text"
                    value={amenityDetail}
                    onChange={(e) => setAmenityDetail(e.target.value)}
                    placeholder="Detail"
                    className={`px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
                  >
                    Add Amenity
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {amenities.map((a, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-stone-900/40 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-stone-200">{a.label}: </span>
                        <span className="text-stone-400">{a.detail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAmenity(i)}
                        className="text-stone-500 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Input */}
              <div className="space-y-3 pt-3 border-t border-stone-800/60">
                <label className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
                  Add Highlight Feature
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="e.g. Private cloakroom"
                    className={`flex-1 px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded bg-[#B99A63]/10 text-[#C1A87D] border border-[#B99A63]/30"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="hover:text-rose-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Publication */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Operational Status
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#B99A63] border-stone-700 focus:ring-[#B99A63]"
                  />
                  <div>
                    <span className="text-xs font-medium text-stone-200 block">Published on Website</span>
                    <span className="text-[10px] text-stone-400">
                      Guests can discover and request this salon
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#B99A63] border-stone-700 focus:ring-[#B99A63]"
                  />
                  <div>
                    <span className="text-xs font-medium text-stone-200 block">Active in Restaurant Inventory</span>
                    <span className="text-[10px] text-stone-400">
                      Allows staff to assign dining sessions to this room
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Capacity & Timeslots */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Capacity & Preparation Buffer
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Min Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={capacityMin}
                    onChange={(e) => setCapacityMin(parseInt(e.target.value, 10) || 1)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={capacityMax}
                    onChange={(e) => setCapacityMax(parseInt(e.target.value, 10) || 1)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                  Standard Duration (Minutes)
                </label>
                <input
                  type="number"
                  step="30"
                  min="60"
                  value={bookingDurationMinutes}
                  onChange={(e) => setBookingDurationMinutes(parseInt(e.target.value, 10) || 120)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                  Turnover Buffer (Minutes)
                </label>
                <input
                  type="number"
                  step="15"
                  min="0"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10) || 60)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {/* Pricing */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Pricing & Thresholds
              </h3>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                  Base Room Hire ({currency})
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={basePriceMajor}
                  onChange={(e) => setBasePriceMajor(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                  Minimum Food & Wine Spend ({currency})
                </label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={minimumSpendMajor}
                  onChange={(e) => setMinimumSpendMajor(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {/* Categories */}
            <div
              className={`p-6 rounded-2xl border space-y-3 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-stone-100 border-b pb-2 border-stone-800">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Intimate', 'Celebrations', 'Business', 'Tasting'].map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-[#B99A63] border-[#B99A63] text-white font-medium'
                          : isDark
                          ? 'border-stone-800 bg-stone-900/50 text-stone-400 hover:text-stone-200'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#B99A63] hover:bg-[#A88952] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Save Room Changes</span>
              </button>

              <Link
                href="/staff/admin/vip-rooms"
                className="block text-center text-xs text-stone-500 hover:text-stone-300 py-1"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </StaffLayout>
  );
}
