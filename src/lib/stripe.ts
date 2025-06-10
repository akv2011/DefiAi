import Stripe from "stripe";

// Create a wrapper function that will initialize Stripe only when called
let _stripe: Stripe | null = null;

export const getStripe = () => {
  // Only initialize Stripe if the API key exists
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      appInfo: {
        name: "Matrix Terminal",
        version: "1.0.0",
      },
    });
  }

  if (!_stripe) {
    throw new Error(
      "Stripe API key is missing. Please set STRIPE_SECRET_KEY in environment variables."
    );
  }

  return _stripe;
};

// For backwards compatibility, also provide the stripe object directly,
// but initialize it lazily only when needed
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    return getStripe()[prop as keyof Stripe];
  },
});

// Define product IDs
export const PREMIUM_PRODUCTS = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRODUCT_ID || "prod_monthly",
  ANNUAL: process.env.STRIPE_ANNUAL_PRODUCT_ID || "prod_annual",
};

// Define price IDs
export const PREMIUM_PRICES = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID || "price_monthly",
  ANNUAL: process.env.STRIPE_ANNUAL_PRICE_ID || "price_annual",
};

// Map plan IDs to Stripe price IDs
export const PLAN_TO_PRICE = {
  monthly: PREMIUM_PRICES.MONTHLY,
  annual: PREMIUM_PRICES.ANNUAL,
};

// Payment method types supported
// Note: These should only include methods that are officially supported by Stripe
export const PAYMENT_METHODS = {
  CARD: "card",
  // CRYPTO is not supported in Stripe's standard API
  // For crypto payments, consider using a specialized crypto payment processor
};

// Metadata fields to include with subscriptions
export const SUBSCRIPTION_METADATA = {
  product: "matrix-terminal",
  version: "1.0",
};
