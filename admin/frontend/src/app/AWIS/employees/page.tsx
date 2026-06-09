import { Card } from '@/components/ui/Card';

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Employees Directory</h2>
        <p className="text-gray-500 mt-1">Manage team members and permissions.</p>
      </div>
      <Card className="p-6 h-96 flex items-center justify-center">
        <p className="text-gray-400">Employees list will be implemented here</p>
      </Card>
    </div>
  );
}
