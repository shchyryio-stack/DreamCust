"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function AddressForm({ isOpen, onClose, onSave, addressToEdit = null }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [label, setLabel] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [deliveryType, setDeliveryType] = useState<'courier' | 'branch' | 'locker'>('courier');
  
  // Dynamic fields
  const [cityQuery, setCityQuery] = useState('');
  const debouncedCityQuery = useDebounce(cityQuery, 300);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  
  const [addressQuery, setAddressQuery] = useState('');
  const debouncedAddressQuery = useDebounce(addressQuery, 300);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isStreetUserTyping, setIsStreetUserTyping] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [isStreetFocused, setIsStreetFocused] = useState(false);
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [courierComment, setCourierComment] = useState('');
  
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(branchSearchQuery.toLowerCase()) || 
    (o.shortAddress && o.shortAddress.toLowerCase().includes(branchSearchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label || '');
      setFirstName(addressToEdit.firstName || '');
      setLastName(addressToEdit.lastName || '');
      setMiddleName(addressToEdit.middleName || '');
      setPhone(addressToEdit.phone || '+380');
      setDeliveryType(addressToEdit.deliveryType || 'courier');
      setCityQuery(addressToEdit.city || '');
      setSelectedCity({ name: addressToEdit.city, ref: addressToEdit.cityRef });
      
      if (addressToEdit.deliveryType === 'courier') {
        setAddressQuery(addressToEdit.street || '');
        setHouse(addressToEdit.house || '');
        setApartment(addressToEdit.apartment || '');
        setCourierComment(addressToEdit.courierComment || '');
      } else {
        const opt = { ref: addressToEdit.warehouseRef, name: addressToEdit.warehouseName };
        setOptions([opt]);
        setSelectedOption(opt);
      }
    } else {
      setLabel(''); setFirstName(''); setLastName(''); setMiddleName(''); setPhone('+380');
      setDeliveryType('courier'); setCityQuery(''); setSelectedCity(null);
      setAddressQuery(''); setSelectedAddress(null); setIsStreetUserTyping(false); setHouse(''); setApartment(''); setCourierComment(''); setSelectedOption(null);
      setError('');
    }
  }, [addressToEdit, isOpen]);

  useEffect(() => {
    if (debouncedCityQuery.length < 2 || selectedCity?.name === debouncedCityQuery) {
      setCitySuggestions([]);
      return;
    }
    const search = async () => {
      setIsSearchingCity(true);
      try {
        const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY || "",
            modelName: "Address",
            calledMethod: "getCities",
            methodProperties: { FindByString: debouncedCityQuery }
          })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCitySuggestions(data.data.map((c: any) => ({ ref: c.Ref, name: c.Description, region: c.AreaDescription })));
        }
      } catch (err) {
        setCitySuggestions([]);
      } finally {
        setIsSearchingCity(false);
      }
    };
    search();
  }, [debouncedCityQuery, selectedCity]);

  useEffect(() => {
    if (!selectedCity || !selectedCity.ref || deliveryType !== 'courier' || !debouncedAddressQuery || selectedAddress?.name === debouncedAddressQuery || !isStreetUserTyping || debouncedAddressQuery.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    const searchAddress = async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY || "",
            modelName: "Address",
            calledMethod: "getStreet",
            methodProperties: { CityRef: selectedCity.ref, FindByString: debouncedAddressQuery }
          })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setAddressSuggestions(data.data.map((s: any) => ({ ref: s.Ref, name: `${s.StreetsType} ${s.Description}` })));
        }
      } catch (err) {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    };
    searchAddress();
  }, [debouncedAddressQuery, selectedCity, deliveryType, selectedAddress]);

  useEffect(() => {
    if (!selectedCity || !selectedCity.ref || deliveryType === 'courier') return;
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      setSelectedOption(null);
      let allWarehouses = [];
      try {
        const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY || "",
            modelName: "Address",
            calledMethod: "getWarehouses",
            methodProperties: { CityRef: selectedCity.ref, Limit: 400 }
          })
        });
        const data = await res.json();
        if (data.success && data.data) allWarehouses = data.data;
      } catch (err) {}
      
      const isLocker = deliveryType === 'locker';
      const filteredData = allWarehouses.filter((w: any) => {
        const isPochomat = w.CategoryOfWarehouse === 'Postomat' || (w.TypeOfWarehouse && w.TypeOfWarehouse.includes('Postomat')) || (w.Description && w.Description.toLowerCase().includes('поштомат'));
        return isLocker ? isPochomat : !isPochomat;
      });
      setOptions(filteredData.map((b: any) => ({ ref: b.Ref, name: b.Description, shortAddress: b.ShortAddress || b.Description || "" })));
      setIsLoadingOptions(false);
    };
    fetchOptions();
  }, [selectedCity, deliveryType]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === '+') {
      setPhone('+');
      return;
    }
    
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('380')) {
      digits = '380' + digits.substring(3, 12);
    } else if (digits.startsWith('0')) {
      digits = '380' + digits.substring(1, 10);
    } else {
      digits = digits.substring(0, 12);
    }
    
    setPhone('+' + digits);
  };

  const isPhoneValid = /^\+380\d{9}$/.test(phone);
  const isBaseValid = Boolean(label.trim() && firstName.trim() && lastName.trim() && isPhoneValid && selectedCity);
  let isDynamicValid = false;
  if (deliveryType === 'courier') isDynamicValid = addressQuery.trim() !== '' && house.trim() !== '';
  if (deliveryType === 'branch' || deliveryType === 'locker') isDynamicValid = selectedOption !== null;
  const isFormValid = isBaseValid && isDynamicValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isFormValid) return;
    setIsSubmitting(true);
    
    const addressData = {
      label, firstName, lastName, middleName, phone, deliveryType,
      city: selectedCity.name, cityRef: selectedCity.ref,
      details: deliveryType === 'courier' ? `${addressQuery}, ${house}${apartment ? `, Apt ${apartment}` : ''}${courierComment ? ` (Comment: ${courierComment})` : ''}` : selectedOption.name,
      street: addressQuery, house, apartment, courierComment,
      warehouseRef: selectedOption?.ref || '', warehouseName: selectedOption?.name || ''
    };

    console.log('[AddressForm] Submitting address:', JSON.stringify(addressData, null, 2));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in and try again.');
        setIsSubmitting(false);
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = addressToEdit ? `${apiUrl}/addresses/${addressToEdit._id || addressToEdit.id}` : `${apiUrl}/addresses`;
      const method = addressToEdit ? 'PUT' : 'POST';
      console.log(`[AddressForm] ${method} ${url}`);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressData)
      });
      if (res.ok) {
        const responseData = await res.json();
        // Handle both { data: address } wrapper and plain address object
        const savedAddress = responseData.data || responseData;
        console.log('[AddressForm] Save successful:', savedAddress._id || savedAddress.id);
        onSave(savedAddress);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[AddressForm] Backend error:', res.status, err);
        setError(err.message || 'Failed to save address. Please try again.');
      }
    } catch (err: any) {
      console.error('[AddressForm] Network error:', err);
      setError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="bg-white w-full max-w-[540px] rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-extrabold text-[#1A1A1A]">{addressToEdit ? 'Edit Address' : 'Add New Address'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 text-[#ef4444] p-4 rounded-xl mb-6 font-medium border border-red-100 text-sm">
              {error}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Address Label <span className="text-[#ef4444] font-semibold">*</span></label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Home, Work..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-[#1E6FE8] focus:outline-none transition-all" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1A1A1A] mb-2">First Name <span className="text-[#ef4444] font-semibold">*</span></label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-[#1E6FE8] focus:outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Last Name <span className="text-[#ef4444] font-semibold">*</span></label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-[#1E6FE8] focus:outline-none transition-all" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Middle Name</label>
                <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-[#1E6FE8] focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Phone Number <span className="text-[#ef4444] font-semibold">*</span></label>
                <input type="tel" value={phone} onChange={handlePhoneChange} className={`w-full bg-gray-50 border ${phone.length > 4 && !/^\+380\d{9}$/.test(phone) ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#1E6FE8]'} rounded-xl px-4 py-3 focus:bg-white focus:outline-none transition-all`} placeholder="+380" required />
                {phone.length > 4 && !/^\+380\d{9}$/.test(phone) && (
                  <p className="text-red-500 text-xs mt-1.5 font-bold">Invalid Ukrainian phone number</p>
                )}
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-bold text-[#1A1A1A] mb-3">Delivery Type <span className="text-[#ef4444] font-semibold">*</span></label>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button type="button" onClick={() => setDeliveryType('courier')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${deliveryType === 'courier' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Courier</button>
                <button type="button" onClick={() => setDeliveryType('branch')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${deliveryType === 'branch' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Branch</button>
                <button type="button" onClick={() => setDeliveryType('locker')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${deliveryType === 'locker' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Locker</button>
              </div>
            </div>
            <div className="relative pt-2">
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2">City <span className="text-[#ef4444] font-semibold">*</span></label>
              <input type="text" value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }} onFocus={() => setIsCityFocused(true)} onBlur={() => setTimeout(() => setIsCityFocused(false), 150)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-[#1E6FE8] focus:outline-none transition-all" />
              {isSearchingCity && <div className="absolute right-4 top-11 animate-spin w-5 h-5 border-2 border-[#1E6FE8] border-t-transparent rounded-full"></div>}
              {isCityFocused && citySuggestions.length > 0 && !selectedCity && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-y-auto max-h-48">
                  {citySuggestions.map(c => <li key={c.ref} onClick={() => { setSelectedCity(c); setCityQuery(c.name); setCitySuggestions([]); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50"><p className="text-sm font-bold">{c.name}</p></li>)}
                </ul>
              )}
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-4">
              {deliveryType === 'courier' && (
                <>
                  <div className="relative">
                    <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Street <span className="text-[#ef4444] font-semibold">*</span></label>
                    <input type="text" value={addressQuery} onChange={(e) => { setAddressQuery(e.target.value); setSelectedAddress(null); setIsStreetUserTyping(true); }} onFocus={() => setIsStreetFocused(true)} onBlur={() => setTimeout(() => setIsStreetFocused(false), 150)} disabled={!selectedCity} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#1E6FE8] focus:outline-none transition-all disabled:bg-gray-50" />
                    {isSearchingAddress && <div className="absolute right-4 top-11 animate-spin w-5 h-5 border-2 border-[#1E6FE8] border-t-transparent rounded-full"></div>}
                    {isStreetFocused && addressSuggestions.length > 0 && !selectedAddress && isStreetUserTyping && (
                      <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {addressSuggestions.map(a => <li key={a.ref} onClick={() => { setSelectedAddress(a); setAddressQuery(a.name); setAddressSuggestions([]); setIsStreetUserTyping(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50"><p className="text-sm font-bold">{a.name}</p></li>)}
                      </ul>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#1A1A1A] mb-2">House <span className="text-[#ef4444] font-semibold">*</span></label>
                      <input type="text" value={house} onChange={e => setHouse(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#1E6FE8] focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Apt (Optional)</label>
                      <input type="text" value={apartment} onChange={e => setApartment(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#1E6FE8] focus:outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-[#1A1A1A]">Courier Comment</label>
                      <span className={`text-xs font-bold ${courierComment.length >= 130 ? 'text-[#ef4444]' : 'text-gray-400'}`}>
                        {courierComment.length} / 150
                      </span>
                    </div>
                    <textarea 
                      value={courierComment} 
                      onChange={e => {
                        const text = e.target.value;
                        if (text.length <= 150) {
                          setCourierComment(text);
                        }
                      }}
                      maxLength={150}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#1E6FE8] focus:outline-none transition-all" 
                      rows={2}
                      style={{ resize: 'none' }}
                    ></textarea>
                  </div>
                </>
              )}
              {(deliveryType === 'branch' || deliveryType === 'locker') && (
                <div className="relative" ref={branchDropdownRef}>
                  <label className="block text-sm font-bold text-[#1A1A1A] mb-2">{deliveryType === 'branch' ? 'Select Branch' : 'Select Parcel Locker'} <span className="text-[#ef4444] font-semibold">*</span></label>
                  <button type="button" onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} disabled={!selectedCity || isLoadingOptions} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-left transition-all disabled:bg-gray-50">
                    <span className={`font-medium ${!selectedOption ? 'text-gray-400' : 'text-[#1A1A1A]'}`}>{isLoadingOptions ? 'Loading...' : selectedOption ? selectedOption.name : 'Choose an option...'}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isBranchDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isBranchDropdownOpen && (
                    <div className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-[16px] shadow-xl overflow-hidden flex flex-col max-h-[350px]">
                      <div className="p-3 border-b border-gray-50">
                        <input type="text" placeholder="Search..." value={branchSearchQuery} onChange={(e) => setBranchSearchQuery(e.target.value)} className="w-full bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1E6FE8]" />
                      </div>
                      <div className="overflow-y-auto custom-scrollbar p-2">
                        {filteredOptions.map((opt) => (
                          <button key={opt.ref} type="button" onClick={() => { setSelectedOption(opt); setIsBranchDropdownOpen(false); setBranchSearchQuery(''); }} className="w-full text-left p-3 rounded-xl hover:bg-gray-50 mb-1 last:mb-0">
                            <p className="text-sm font-bold">{opt.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-[24px]">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
