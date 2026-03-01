import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillProvider } from "@/lib/providers";
import { isValidMeterNumber } from "@/lib/utils/validators";
import { DISCOS } from "@/lib/utils/constants";
import { logger } from "@/lib/utils/logger";

const VALID_DISCO_IDS = DISCOS.map(d => d.id);

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
    const { meterNumber, disco, meterType } = body;

    if (!meterNumber || !isValidMeterNumber(meterNumber)) {
      return NextResponse.json({ error: "Invalid meter number" }, { status: 400 });
    }
    if (!disco || !VALID_DISCO_IDS.includes(disco)) {
      return NextResponse.json({ error: "Invalid disco" }, { status: 400 });
    }
    if (!meterType || !["prepaid", "postpaid"].includes(meterType)) {
      return NextResponse.json({ error: "Invalid meter type" }, { status: 400 });
    }

    const provider = getBillProvider();
    const result = await provider.verifyMeter({ meterNumber, disco, meterType });

    if (!result.success) {
      return NextResponse.json({ error: "Meter verification failed" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Meter verification error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
