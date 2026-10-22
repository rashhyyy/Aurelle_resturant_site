'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StaffLayout } from '../../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../../types/staff';
import { apiClient } from '../../../../../lib/api';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Eye,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

export default function NewVIPRoomPage() {
  const router = useRouter();
  const { selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const locationId = selectedLocation || 'loc-colombo-main';

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tag, setTag] = useState('SIGNATURE PRIVATE SALON');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [capacityMin, setCapacityMin] = useState(2);
  const [capacityMax, setCapacityMax] = useState(12);
  const [squareMeters, setSquareMeters] = useState('45 m²');
  const [basePriceMajor, setBasePriceMajor] = useState(50000);
  const [minimumSpendMajor, setMinimumSpendMajor] = useState(150000);
  const [currency, setCurrency] = useState('LKR');
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(180);
  const [bufferMinutes, setBufferMinutes] = useState(60);

  // Dynamic lists
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200',
  ]);

  const [amenityLabel, setAmenityLabel] = useState('');
  const [amenityDetail, setAmenityDetail] = useState('');
  const [amenities, setAmenities] = useState<{ label: string; detail: string }[]>([
    { label: 'Private Sommelier', detail: 'Dedicated cellar flight consultation' },
    { label: 'Acoustic Isolation', detail: 'Bespoke Bang & Olufsen sound system' },
  ]);

  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Discreet VIP entrance',
    'Custom degustation menu',
    'Private cloakroom',
  ]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Celebrations',
    'Intimate',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug when name changes if slug wasn't manually customized
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

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

  const handleSubmit = async (publishNow: boolean) => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please provide a VIP room name.');
      return;
    }
    if (!slug.trim()) {
      setError('Please provide a unique URL slug.');
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
    if (images.length === 0) {
      setError('Please provide at least one photograph URL for the room.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        locationId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        tag: tag.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || `The exquisite ${name.trim()} private salon at Aurelle.`,
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
        isActive: true,
        isPublished: publishNow,
      };

      await apiClient<any>('/api/admin/vip/rooms', { method: 'POST', data: payload });
      router.push('/staff/admin/vip-rooms');
    } catch (err: any) {
      console.error('Error creating VIP room:', err);
      setError(err?.message || 'Failed to create VIP room. Please check the values and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Top Header */}
        <StaffPageHeader
          title="Create VIP Salon"
          subtitle="Configure a private dining sanctuary, set guest thresholds, exclusive pricing, and turn-around buffers."
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
            {/* 1. Basic Details */}
            <div
              className={`p-6 rounded-2xl border space-y-5 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 flex items-center gap-2 border-b pb-3 border-stone-800">
                <Sparkles size={16} className="text-[#B99A63]" />
                <span>Space Identity & Branding</span>
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. The Obsidian Suite"
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none transition-all ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. the-obsidian-suite"
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-mono outline-none transition-all ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                    }`}
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
                    placeholder="e.g. SIGNATURE PRIVATE SALON"
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
                    placeholder="e.g. 50 m²"
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
                  placeholder="e.g. For distinguished celebrations and discrete board dinners"
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
                  placeholder="Describe the architectural nuances, acoustic intimacy, and private hospitality..."
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none resize-none transition-all ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
              </div>
            </div>

            {/* 2. Photographs */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 flex items-center gap-2 border-b pb-3 border-stone-800">
                <ImageIcon size={16} className="text-[#B99A63]" />
                <span>Room Photographs</span>
              </h3>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste photograph URL (e.g. Unsplash or CDN)"
                  className={`flex-1 px-3.5 py-2 rounded-lg text-xs outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 rounded-lg bg-[#B99A63] text-white text-xs font-semibold hover:bg-[#A88952] transition-colors"
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
                    <img src={img} alt={`Room ${i + 1}`} className="w-full h-full object-cover" />
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

            {/* 3. Amenities & Features */}
            <div
              className={`p-6 rounded-2xl border space-y-5 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-base font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Amenities & Key Features
              </h3>

              {/* Amenity Input */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
                  Add Exclusive Amenity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={amenityLabel}
                    onChange={(e) => setAmenityLabel(e.target.value)}
                    placeholder="Label (e.g. Private Bar)"
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
                    placeholder="Detail (e.g. Dedicated mixologist on standby)"
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
                    placeholder="e.g. Bespoke floral centerpiece, Private valet parking"
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

          {/* Sidebar / Operational Rules */}
          <div className="space-y-6">
            {/* Capacity & Timeslots */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-all ${
                isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-stone-100 border-b pb-3 border-stone-800">
                Capacity & Turn-Around Buffer
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
                <span className="text-[10px] text-stone-500 block mt-1">
                  Default dining window allocated on reservation
                </span>
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
                <span className="text-[10px] text-stone-500 block mt-1">
                  Enforces post-event disinfection and sommelier restock window
                </span>
              </div>
            </div>

            {/* Pricing & Minimum Spend */}
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
                Filter Categories
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

            {/* Publication & Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="w-full py-3 rounded-xl bg-[#B99A63] hover:bg-[#A88952] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Eye size={14} />
                )}
                <span>Publish Room Now</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className={`w-full py-3 rounded-xl border text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'border-stone-700 bg-stone-900/40 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Save size={14} />
                <span>Save as Draft</span>
              </button>

              <Link
                href="/staff/admin/vip-rooms"
                className="block text-center text-xs text-stone-500 hover:text-stone-300 py-1"
              >
                Cancel and discard changes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
