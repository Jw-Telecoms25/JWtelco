import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillProvider } from "@/lib/providers";
import { isValidSmartcardNumber } from "@/lib/utils/validators";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { smartcardNumber, provider: cableProvider } = body;

    if (!smartcardNumber || !isValidSmartcardNumber(smartcardNumber)) {
      return NextResponse.json({ error: "Invalid smartcard number" }, { status: 400 });
    }
    if (!cableProvider || !["dstv", "gotv", "startimes"].includes(cableProvider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const billProvider = getBillProvider();
    const result = await billProvider.verifySmartcard({ smartcardNumber, provider: cableProvider });

    if (!result.success) {
      return NextResponse.json({ error: "Smartcard verification failed" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Smartcard verification error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
