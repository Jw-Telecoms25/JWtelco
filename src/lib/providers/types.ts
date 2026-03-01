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

export interface VTUProvider {
  name: string;

  buyAirtime(params: {
    phone: string;
    network: string;
    amount: number; // kobo
    reference: string;
  }): Promise<ProviderResponse>;

  buyData(params: {
    phone: string;
    network: string;
    planCode: string;
    reference: string;
  }): Promise<ProviderResponse>;

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

  buyExamPin(params: {
    examType: string;
    quantity: number;
    reference: string;
  }): Promise<ProviderResponse>;
}
