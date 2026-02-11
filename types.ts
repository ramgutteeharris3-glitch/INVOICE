
export interface ReceiptItem {
  id: string;
  code?: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Product {
  code: string;
  name: string;
  price: number;
}

export interface CompanyInfo {
  name: string;
  shopName?: string;
  email: string;
  address: string;
  phone: string;
  taxId?: string;
  brn?: string;
}

export type PaymentMethod = 'Cheque' | 'Cash' | 'Bank Transfer' | 'Juice' | 'Blink' | 'MyT' | 'Card' | 'Credit' | 'Gift' | 'Online';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'MUR' | 'JPY';

export type MovementType = 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface StockMovement {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  type: MovementType;
  reference: string; // Invoice #, DN #, or WTN #
  associatedWtn?: string; // Manually linked WTN for DNs
  quantity: number;
  location: string; // "From X" or "To Y"
  notes?: string;
}

export interface Invoice {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: Currency;
  sender: CompanyInfo;
  client: CompanyInfo;
  items: LineItem[];
  notes: string;
  taxRate: number;
  discount: number;
}

export interface Receipt {
  receiptNumber: string;
  relatedInvoiceNo?: string; // Manually linked Invoice No
  date: string;
  salesRep: string;
  receivedFrom: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientTaxId?: string;
  clientBrn?: string;
  addressNotes: string;
  paymentMethod: PaymentMethod;
  items: ReceiptItem[];
  chequeNo?: string;
  settlementOf: string;
  currency: Currency;
  sender: CompanyInfo;
  notes: string;
  taxRate: number;
  location?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'Juice', 'Blink', 'Bank Transfer', 'Credit', 'Gift', 'Online', 'MyT', 'Cheque'];
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  MUR: 'Rs',
  JPY: '¥'
};
