"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// Import the Department type from the user model
import { Department as UserDepartment } from '@/models/user.model';

type Department = 'all' | UserDepartment;

// Create a type with all possible department values including 'all'
type AllDepartments = Department | 'all';

const departmentLabels: Record<AllDepartments, string> = {
  'all': 'All Departments',
  'CSE(AI&ML)': 'CSE (AI & ML)',
  'CSE': 'Computer Science & Engineering',
  'CSBS': 'Computer Science & Business Systems',
  'AI&DS': 'AI & Data Science',
  '': 'Not Specified' // Add empty string case from UserDepartment
};

// Get all department values from the user model type
const departmentValues = (Object.keys(departmentLabels) as Department[]).filter(
  (key): key is Department => key !== 'all'
);

interface DepartmentFilterProps {
  className?: string;
  variant?: 'default' | 'dropdown';
}

export default function DepartmentFilter({ 
  className = '',
  variant = 'dropdown' 
}: DepartmentFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedDept, setSelectedDept] = useState<Department>('all');
  
  // Handle null searchParams in case of static rendering
  const safeSearchParams = searchParams || new URLSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    const dept = searchParams.get('dept') as Department | null;
    if (dept && departmentValues.includes(dept)) {
      setSelectedDept(dept);
    } else {
      setSelectedDept('all');
    }
  }, [searchParams]);

  const handleFilterChange = (dept: Department) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (dept === 'all') {
      params.delete('dept');
    } else {
      params.set('dept', dept);
    }
    // Reset pagination when changing filters
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  if (variant === 'default') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {departmentValues.map((dept) => (
          <Button
            key={dept}
            variant={selectedDept === dept ? 'default' : 'outline'}
            size="sm"
            className="rounded-full whitespace-nowrap"
            onClick={() => handleFilterChange(dept)}
          >
            {departmentLabels[dept]}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {departmentLabels[selectedDept]}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {departmentValues.map((dept) => (
            <DropdownMenuItem 
              key={dept}
              className="cursor-pointer"
              onClick={() => handleFilterChange(dept)}
            >
              {departmentLabels[dept]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
