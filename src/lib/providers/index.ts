import type { VTUProvider, ProviderResponse } from "./types";
import { vtpassProvider } from "./vtpass";

export function getBillProvider(): VTUProvider {
  if (!process.env.VTPASS_API_KEY || !process.env.VTPASS_SECRET_KEY) {
    throw new Error("VTPASS_API_KEY and VTPASS_SECRET_KEY must be configured");
  }
  return vtpassProvider;
}

export { vtpassProvider } from "./vtpass";
export type { VTUProvider, ProviderResponse } from "./types";
