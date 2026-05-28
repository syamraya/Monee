// hooks/useUserProfile.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchWithToken } from "@/lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export function useUserProfile() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchWithToken(token, "/users/me")
      .then((data) => {
        if (data?.id) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return { profile, setProfile, loading };
}
