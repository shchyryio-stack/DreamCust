'use client';

import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Profile Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-3xl font-semibold mb-4 shadow-sm">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{user?.fullName}</h3>
          <p className="text-sm text-gray-500 mb-6">{user?.position}</p>
          
          <Button variant="secondary" className="w-full">Change Avatar</Button>
        </Card>

        <Card className="p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name" value={user?.fullName || ''} readOnly />
            <Input label="Login" value={user?.login || ''} readOnly />
            <Input label="Corporate Email" value={user?.corporateEmail || ''} readOnly />
            <Input label="Department" value={user?.department || ''} readOnly />
            <Input label="Position" value={user?.position || ''} readOnly />
            <Input label="Role" value={user?.role || ''} readOnly />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security</h3>
            <form className="space-y-4 max-w-md">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Button type="submit">Update Password</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
