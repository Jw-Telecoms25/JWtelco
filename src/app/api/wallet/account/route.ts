import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reserveAccount } from "@/lib/providers/aspfiy";
import { generateReference } from "@/lib/utils/reference";
import { assertActiveUser, AccountBlockedError } from "@/lib/utils/guards";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    await assertActiveUser(user.id, admin);

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, phone, virtual_account_number, virtual_account_bank")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.virtual_account_number) {
      return NextResponse.json({
        accountNumber: profile.virtual_account_number,
        bankName: profile.virtual_account_bank,
        accountName: `${profile.first_name} ${profile.last_name}`,
      });
    }

    if (!process.env.ASPFIY_SECRET_KEY) {
      return NextResponse.json(
        { error: "Virtual accounts not configured" },
        { status: 503 }
      );
    }

    const reference = generateReference("VA");
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://jwtelecoms.com.ng";
    const webhookUrl = `${origin}/api/webhooks/aspfiy`;

    const result = await reserveAccount({
      email: user.email!,
      reference,
      firstName: profile.first_name || "JW",
      lastName: profile.last_name || "User",
      phone: profile.phone || "",
      webhookUrl,
    });

    const account = result.data;

    await admin
      .from("profiles")
      .update({
        virtual_account_number: account.accountNumber,
        virtual_account_bank: account.bankName,
      })
      .eq("id", user.id);

    await admin.from("payment_sessions").insert({
      user_id: user.id,
      gateway: "aspfiy",
      gateway_reference: account.accountNumber,
      amount: 0,
      status: "pending",
    });

    return NextResponse.json({
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      accountName: `${profile.first_name} ${profile.last_name}`,
    });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Virtual account error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create virtual account" },
      { status: 500 }
    );
  }
}
