'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    graduationYear: '',
    degree: '',
    major: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          email: user?.emailAddresses[0].emailAddress,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast.success('Profile updated successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help us personalize your experience
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.emailAddresses[0].emailAddress || ''}
              disabled
              className="bg-muted/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              type="number"
              min="1900"
              max="2100"
              value={formData.graduationYear}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="degree">Degree</Label>
            <Input
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              placeholder="e.g., B.Tech, M.Tech, PhD"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="major">Major/Department</Label>
            <Input
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g., Computer Science, Mechanical Engineering"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
