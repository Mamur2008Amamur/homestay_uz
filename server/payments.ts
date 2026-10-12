export type PaymeRequest<TParams> = {
  id: number;
  method: string;
  params: TParams;
};

export type PaymeCheckoutInput = {
  bookingId: number;
  amount: number;
  method: "payme" | "click" | "card";
  account?: string;
  phone?: string;
};

export function buildPaymeRequest<TParams>(input: {
  id: number;
  method: string;
  amount: number;
  account: string;
  params?: TParams;
}): PaymeRequest<TParams & { amount: number; account: string }> {
  return {
    id: input.id,
    method: input.method,
    params: {
      ...(input.params ?? {} as TParams),
      amount: input.amount,
      account: input.account,
    } as TParams & { amount: number; account: string },
  };
}

export function getPaymeConfig() {
  const apiUrl = process.env.PAYME_API_URL || process.env.PAYME_URL || process.env.PAYME_ENDPOINT || "";
  const merchantId = process.env.PAYME_MERCHANT_ID || process.env.PAYME_MERCHANT || "";
  const secretKey = process.env.PAYME_SECRET_KEY || process.env.PAYME_KEY || process.env.PAYME_TEST_KEY || "";
  const mode = process.env.PAYME_MODE || "test";

  return { apiUrl, merchantId, secretKey, mode };
}

export function isPaymeConfigured() {
  const { apiUrl, merchantId, secretKey } = getPaymeConfig();
  return Boolean(apiUrl && merchantId && secretKey);
}

export async function createPaymeCheckout(input: PaymeCheckoutInput) {
  const amountTiyin = Math.max(1, Math.round(Number(input.amount || 0)));
  const account = input.account || `booking-${input.bookingId}`;
  const { apiUrl, merchantId, secretKey, mode } = getPaymeConfig();

  if (!isPaymeConfigured()) {
    return {
      ok: true,
      provider: "payme",
      mode: mode || "demo",
      checkoutId: `demo-payme-${input.bookingId}`,
      amountTiyin,
      account,
      redirectUrl: `/payment?demo=true&bookingId=${input.bookingId}`,
      request: buildPaymeRequest({
        id: input.bookingId,
        method: "CreateTransaction",
        amount: amountTiyin,
        account,
      }),
    };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${merchantId}:${secretKey}`).toString("base64")}`,
    },
    body: JSON.stringify(buildPaymeRequest({
      id: input.bookingId,
      method: "CreateTransaction",
      amount: amountTiyin,
      account,
      params: {
        phone: input.phone ?? "",
        method: input.method,
      },
    })),
  });

  if (!response.ok) {
    throw new Error("Payme checkout request failed.");
  }

  const payload = await response.json().catch(() => ({}));

  return {
    ok: true,
    provider: "payme",
    mode: "live",
    checkoutId: payload?.result?.transaction?.id ?? payload?.transaction?.id ?? `payme-${input.bookingId}`,
    amountTiyin,
    account,
    redirectUrl: payload?.result?.url ?? payload?.url ?? undefined,
    request: buildPaymeRequest({
      id: input.bookingId,
      method: "CreateTransaction",
      amount: amountTiyin,
      account,
      params: {
        phone: input.phone ?? "",
        method: input.method,
      },
    }),
  };
}
