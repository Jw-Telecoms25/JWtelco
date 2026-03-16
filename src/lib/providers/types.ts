export interface ProviderResponse {
  success: boolean;
  reference: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface VerifyResponse {
  success: boolean;
  customer_name: string;
  customer_address?: string;
  meter_number?: string;
  smartcard_number?: string;
}

export interface AirtimeProvider {
  name: string;
  buyAirtime(params: {
    phone: string;
    network: string;
    amount: number; // kobo
    reference: string;
  }): Promise<ProviderResponse>;
}

export interface DataProvider {
  name: string;
  buyData(params: {
    phone: string;
    network: string;
    planCode: string;
    reference: string;
  }): Promise<ProviderResponse>;
}

export interface ElectricityProvider {
  name: string;
  verifyMeter(params: {
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
  }): Promise<VerifyResponse>;
  buyElectricity(params: {
    meterNumber: string;
    disco: string;
    meterType: "prepaid" | "postpaid";
    amount: number; // kobo
    reference: string;
  }): Promise<ProviderResponse>;
}

export interface CableProvider {
  name: string;
  verifySmartcard(params: {
    smartcardNumber: string;
    provider: string;
  }): Promise<VerifyResponse>;
  subscribeCable(params: {
    smartcardNumber: string;
    provider: string;
    planCode: string;
    reference: string;
  }): Promise<ProviderResponse>;
}

export interface ExamPinProvider {
  name: string;
  buyExamPin(params: {
    examType: string;
    quantity: number;
    reference: string;
  }): Promise<ProviderResponse>;
}

export type VTUProvider = AirtimeProvider &
  DataProvider &
  ElectricityProvider &
  CableProvider &
  ExamPinProvider;
