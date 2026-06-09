"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddressManager from '@/components/account/AddressManager';
import WishlistTab from '@/components/account/WishlistTab';
import OrderHistoryTab from '@/components/account/OrderHistoryTab';
import { useToast } from '@/context/ToastContext';

// Mock Icons
const IconProfile = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconOrders = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IconAddress = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconWishlist = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const IconCoins = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconLogout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

export default function AccountDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>({ name: '', email: 'loading...' });
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // Load mock user from localStorage if exists
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      setUser(parsedUser);
      setFirstName(parsedUser.firstName || '');
      setLastName(parsedUser.lastName || '');
    } else {
      // Fallback UI test state
      setUser({ email: 'builder@dreamcust.com' });
    }

    // Read active tab from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: <IconProfile /> },
    { id: 'orders', label: 'Orders', icon: <IconOrders /> },
    { id: 'addresses', label: 'Addresses', icon: <IconAddress /> },
    { id: 'wishlist', label: 'Wishlist', icon: <IconWishlist /> },
    { id: 'bonuses', label: 'Dream Coins', icon: <IconCoins /> },
    { id: 'settings', label: 'Settings', icon: <IconSettings /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[20px] p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-tr from-[#1E6FE8] to-purple-400 rounded-full flex items-center justify-center text-white font-extrabold text-3xl shadow-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">
                      {user.name ? user.name : user.email.split('@')[0]}
                    </h2>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-[#1E6FE8] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      <IconCoins /> 450 Coins
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gray-50 hover:bg-gray-100 text-[#1A1A1A] px-5 py-2.5 rounded-full font-semibold transition-colors border border-gray-200"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form className="space-y-4 max-w-md animate-fade-in-up">
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-semibold text-gray-400 mb-2">First Name</label>
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-medium focus:bg-white focus:outline-none focus:border-[#1E6FE8]" 
                        placeholder="e.g. John" 
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-medium focus:bg-white focus:outline-none focus:border-[#1E6FE8]" 
                        placeholder="e.g. Doe" 
                      />
                    </div>
                  </div>
                  {saveError && <p className="text-red-500 text-sm font-bold">{saveError}</p>}
                  {saveMessage && <p className="text-green-500 text-sm font-bold">{saveMessage}</p>}
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!firstName.trim() || !lastName.trim()) {
                        setSaveError('First and Last names are required');
                        return;
                      }
                      setSaveError('');
                      setIsSaving(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/profile`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ firstName, lastName })
                        });
                        if (!res.ok) throw new Error('Failed to update profile');
                        const updatedUser = await res.json();
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setSaveMessage('Saved successfully!');
                        showToast('Profile updated successfully!', 'success');
                        setTimeout(() => {
                          setSaveMessage('');
                          setIsEditing(false);
                        }, 2000);
                      } catch (err: any) {
                        setSaveError(err.message);
                        showToast(err.message, 'error');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(30,111,232,0.3)] mt-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 max-w-lg">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Full Name</p>
                      <p className="text-[#1A1A1A] font-bold mt-0.5">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : (user.name || 'Not provided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Email Address</p>
                      <p className="text-[#1A1A1A] font-bold mt-0.5">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Phone</p>
                      <p className="text-[#1A1A1A] font-bold mt-0.5">Not provided</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'bonuses':
        return (
          <div className="animate-fade-in space-y-6">
            <div className="bg-gradient-to-br from-[#1E6FE8] to-purple-600 rounded-[20px] p-8 shadow-[0_8px_30px_rgba(30,111,232,0.2)] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-20 transform translate-x-4 -translate-y-10">
                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.1-.96-2.17-1.92H8.01c.08 1.82 1.45 3.08 2.89 3.48V19h2.33v-1.64c1.55-.26 2.94-1.38 2.94-3.13 0-1.89-1.32-2.7-3.86-3.09z" /></svg>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-white/80 font-semibold mb-1 uppercase tracking-wider text-sm">Available Balance</h3>
                <div className="text-5xl font-extrabold mb-4 flex items-center gap-3">
                  450 <span className="text-2xl text-blue-200">DC</span>
                </div>
                <p className="text-blue-100 max-w-sm font-medium leading-relaxed mb-6">
                  Use Dream Coins to get instant discounts at checkout or purchase exclusive limited-edition components.
                </p>
                <button className="bg-white text-[#1E6FE8] hover:bg-gray-50 px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                  Use Coins
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">How to earn more?</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-gray-600 font-medium bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">🛒</div>
                  Earn 1 DC for every 10 ₴ spent on PC parts.
                </li>
                <li className="flex items-center gap-4 text-gray-600 font-medium bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">✍️</div>
                  Earn 50 DC for leaving a comprehensive photo review.
                </li>
              </ul>
            </div>
          </div>
        );

      case 'orders':
        return <OrderHistoryTab />;

      case 'addresses':
        return <AddressManager />;

      case 'wishlist':
        return <WishlistTab />;

      case 'settings':
        return (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Account Settings</h2>
            
            <div className="bg-white rounded-[20px] p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Security</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1E6FE8]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1E6FE8]" />
                </div>
                <button className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md mt-2">
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-red-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-gray-500 font-medium mb-6">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 px-6 py-3 rounded-xl font-bold transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden sticky top-28">
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-[#1E6FE8]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <IconLogout />
                Log out
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1">
          {renderContent()}
        </div>

      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
