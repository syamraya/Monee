// src/services/analytics.service.ts

const BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

export async function getAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return res.json();
}