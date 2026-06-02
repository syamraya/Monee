export async function getGoldPrice() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API_URL}/market/gold-price`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed fetch gold price");
  }

  return response.json();
}

export async function getBTCPrice() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API_URL}/market/crypto?coin=bitcoin`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed fetch BTC price");
  }

  return response.json();
}

export async function getAnalytics() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API_URL}/market/analytics`
  );

  if (!response.ok) {
    throw new Error("Failed fetch analytics");
  }

  return response.json();
}