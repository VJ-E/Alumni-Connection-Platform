import { useEffect, useState } from "react";

type UserProfile = {
    role: string;
    profilePhoto: string;
    firstName: string;
    lastName: string;
    email: string;
    description: string;
    graduationYear: number;
  };

export function useCurrentUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
}