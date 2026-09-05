/**
 * Centralized Currency & Pricing Utility for AI BOQ Engine
 * 
 * GLOBAL PRICING POLICY: UAE Dirham (AED) is the DEFAULT project currency
 * throughout all modules, BOQ rates, item calculations, tender pricing, and exports.
 */

export const DEFAULT_PROJECT_CURRENCY = 'AED';
export const DEFAULT_CURRENCY_NAME = 'UAE Dirham';
export const DEFAULT_CURRENCY_SYMBOL = 'AED';
export const DEFAULT_VAT_PERCENTAGE = 5.0; // Standard UAE VAT rate

export type RateSourceCategory =
  | 'Company Rate Database'
  | 'Supplier Quote'
  | 'Subcontractor Bid'
  | 'Historical Project'
  | 'Manual Estimate'
  | 'Cost Index'
  | 'Rate Required';

export interface CommercialSummaryResult {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  netAfterDiscount: number;
  markupPercent: number;
  markupAmount: number;
  subtotalWithMarkup: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  currency: string;
  currencySymbol: string;
  totalPricedItems?: number;
  totalUnpricedItems?: number;
}

export interface FormatCurrencyOptions {
  showCode?: boolean;
  symbol?: string;
  decimals?: number;
}

export interface CommercialSummaryOptions {
  discountPercent?: number;
  markupPercent?: number;
  vatPercent?: number;
  currency?: string;
  symbol?: string;
  currencySymbol?: string;
  pricedCount?: number;
  unpricedCount?: number;
}

/**
 * Formats a numeric monetary value with currency symbol and standard comma separators.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: string = DEFAULT_PROJECT_CURRENCY,
  options?: FormatCurrencyOptions | string
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    const sym = typeof options === 'string' ? options : options?.symbol || 'AED';
    return `${sym} 0.00`;
  }

  const decimals = (typeof options === 'object' && options?.decimals !== undefined) ? options.decimals : 2;
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (typeof options === 'string') {
    return `${options} ${formattedNumber}`;
  }

  if (options && typeof options === 'object') {
    if (options.showCode === false) {
      return formattedNumber;
    }
    const sym = options.symbol || (currency === 'AED' || currency === 'USD' ? 'AED' : currency);
    return `${sym} ${formattedNumber}`;
  }

  const defaultSym = (currency === 'AED' || currency === 'USD') ? 'AED' : currency;
  return `${defaultSym} ${formattedNumber}`;
}

/**
 * Produces an audit calculation trace string showing:
 * "Quantity = 125.50 m² × Unit Rate = AED 45.00/m² → Amount = AED 5,647.50"
 */
export function formatRateCalculationTrace(
  quantity: number,
  unit: string,
  unitRate: number,
  currency: string = DEFAULT_PROJECT_CURRENCY
): {
  formulaText: string;
  measuredQuantity: number;
  unit: string;
  appliedUnitRate: number;
  currency: string;
  calculatedAmount: number;
} {
  const formattedQty = quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const formattedRate = unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalAmount = Number((quantity * unitRate).toFixed(2));
  const formattedTotal = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formulaText = `Quantity = ${formattedQty} ${unit} × Unit Rate = ${currency} ${formattedRate}/${unit} → Amount = ${currency} ${formattedTotal}`;

  return {
    formulaText,
    measuredQuantity: quantity,
    unit,
    appliedUnitRate: unitRate,
    currency,
    calculatedAmount: totalAmount,
  };
}

/**
 * Computes subtotal, discount, markup, VAT (5% default UAE rate), and grand total.
 * Supports both object options and positional arguments.
 */
export function computeCommercialSummary(
  subtotal: number,
  arg2?: CommercialSummaryOptions | number,
  arg3?: number,
  arg4?: number,
  arg5?: string,
  arg6?: string,
  arg7?: number,
  arg8?: number
): CommercialSummaryResult {
  const cleanSubtotal = Math.max(0, subtotal);

  let discountPercent = 0;
  let markupPercent = 0;
  let vatPercent = DEFAULT_VAT_PERCENTAGE;
  let currency = DEFAULT_PROJECT_CURRENCY;
  let symbol = DEFAULT_CURRENCY_SYMBOL;
  let pricedCount = 0;
  let unpricedCount = 0;

  if (typeof arg2 === 'object' && arg2 !== null) {
    discountPercent = arg2.discountPercent ?? 0;
    markupPercent = arg2.markupPercent ?? 0;
    vatPercent = arg2.vatPercent ?? DEFAULT_VAT_PERCENTAGE;
    currency = (arg2.currency && arg2.currency !== 'USD') ? arg2.currency : DEFAULT_PROJECT_CURRENCY;
    symbol = (arg2.symbol && arg2.symbol !== '$') ? (arg2.currencySymbol || arg2.symbol || DEFAULT_CURRENCY_SYMBOL) : DEFAULT_CURRENCY_SYMBOL;
    if (symbol === '$' || symbol === 'USD') symbol = 'AED';
    pricedCount = arg2.pricedCount ?? 0;
    unpricedCount = arg2.unpricedCount ?? 0;
  } else {
    discountPercent = typeof arg2 === 'number' ? arg2 : 0;
    markupPercent = typeof arg3 === 'number' ? arg3 : 0;
    vatPercent = typeof arg4 === 'number' ? arg4 : DEFAULT_VAT_PERCENTAGE;
    const rawCurrency = typeof arg5 === 'string' ? arg5 : DEFAULT_PROJECT_CURRENCY;
    currency = rawCurrency === 'USD' ? 'AED' : rawCurrency;
    const rawSymbol = typeof arg6 === 'string' ? arg6 : DEFAULT_CURRENCY_SYMBOL;
    symbol = (rawSymbol === '$' || rawSymbol === 'USD') ? 'AED' : rawSymbol;
    pricedCount = typeof arg7 === 'number' ? arg7 : 0;
    unpricedCount = typeof arg8 === 'number' ? arg8 : 0;
  }

  const discountAmount = cleanSubtotal * (discountPercent / 100);
  const netAfterDiscount = cleanSubtotal - discountAmount;
  const markupAmount = netAfterDiscount * (markupPercent / 100);
  const subtotalWithMarkup = netAfterDiscount + markupAmount;
  const vatAmount = subtotalWithMarkup * (vatPercent / 100);
  const grandTotal = subtotalWithMarkup + vatAmount;

  return {
    subtotal: Number(cleanSubtotal.toFixed(2)),
    discountPercent,
    discountAmount: Number(discountAmount.toFixed(2)),
    netAfterDiscount: Number(netAfterDiscount.toFixed(2)),
    markupPercent,
    markupAmount: Number(markupAmount.toFixed(2)),
    subtotalWithMarkup: Number(subtotalWithMarkup.toFixed(2)),
    vatPercent,
    vatAmount: Number(vatAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    currency,
    currencySymbol: symbol,
    totalPricedItems: pricedCount,
    totalUnpricedItems: unpricedCount,
  };
}
