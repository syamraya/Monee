export async function fetchWithToken(token: string | undefined, url: string, opts: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";
  const headers = { ...(opts.headers as Record<string, string> | undefined), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${base}${url}`, { ...opts, headers });
  return res.json();
}
const API = process.env.NEXT_PUBLIC_BASE_API_URL;

if (!API) {
  throw new Error("NEXT_PUBLIC_BASE_API_URL not defined");
}
export default API;