'use client';

import { useEffect, useState } from 'react';
import { BlueprintForm } from '@/components/categories/BlueprintForm';
import api from '@/utils/api';
import { useParams } from 'next/navigation';

export default function EditBlueprintPage() {
  const { id } = useParams();
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlueprint = async () => {
      try {
        const { data } = await api.get(`/categories/${id}`);
        setBlueprint(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBlueprint();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!blueprint) return <div>Blueprint not found</div>;

  return (
    <div className="max-w-[1400px] mx-auto">
      <BlueprintForm initialData={blueprint} isEdit={true} />
    </div>
  );
}
