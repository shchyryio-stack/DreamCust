'use client';

import { Card } from '@/components/ui/Card';
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react';

const stats = [
  { name: 'Total Revenue', value: '$45,231.89', change: '+20.1%', icon: DollarSign },
  { name: 'Total Orders', value: '1,234', change: '+12.5%', icon: ShoppingBag },
  { name: 'Active Clients', value: '456', change: '+5.2%', icon: Users },
  { name: 'Active Employees', value: '24', change: '+2.4%', icon: Activity },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back to the AWIS control center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-green-600 bg-green-50 w-max px-2 py-0.5 rounded-full">
                  {stat.change} from last month
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 h-96">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="flex items-center justify-center h-[calc(100%-2rem)] bg-gray-50/50 rounded-xl border border-gray-100/50">
            <p className="text-gray-400 text-sm">Chart Placeholder</p>
          </div>
        </Card>
        
        <Card className="p-6 h-96">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">New order received</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
