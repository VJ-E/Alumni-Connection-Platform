'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    graduationYear: '',
    department: '',
    major: '',
    description: '',
    linkedInUrl: '',
    githubUrl: '',
  });
  const [verificationImage, setVerificationImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationImage(file);
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationImage) {
      toast.error('Please upload a verification document (College ID, Transcript, or Company ID)');
      return;
    }
    
    setIsLoading(true);

    try {
      // First upload the image
      const formDataToSend = new FormData();
      formDataToSend.append('verificationImage', verificationImage);
      formDataToSend.append('clerkId', user?.id || '');
      formDataToSend.append('email', user?.emailAddresses[0].emailAddress || '');
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await fetch('/api/users', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      toast.success('Profile submitted for verification!');
      router.push('/waiting-verification');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help us personalize your experience and connect you with fellow alumni
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verification */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Verification</h3>
              <div className="space-y-2">
                <Label htmlFor="verificationImage">Verification Document *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Please upload a clear photo of your College ID, Transcript, or Company ID for verification.
                </p>
                <Input
                  id="verificationImage"
                  name="verificationImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                  required
                />
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Preview:</p>
                    <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Verification document preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {verificationImage?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
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
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  placeholder="e.g., 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange('department', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science Engineering (CSE)</SelectItem>
                    <SelectItem value="CSE(AI&ML)">Computer Science Engineering - AI & ML</SelectItem>
                    <SelectItem value="CSBS">Computer Science & Business Systems</SelectItem>
                    <SelectItem value="AI&DS">Artificial Intelligence & Data Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="major">Major/Specialization</Label>
              <Input
                id="major"
                name="major"
                value={formData.major}
                onChange={handleChange}
                placeholder="e.g., Computer Science, Mechanical Engineering, etc."
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="description">Bio/Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us about yourself, your interests, and what you're working on..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedInUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedInUrl"
                  name="linkedInUrl"
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub Profile</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Profile...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
