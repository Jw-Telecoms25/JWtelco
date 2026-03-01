import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  if (!reference || reference.length < 5) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: txn, error } = await admin
    .from("transactions")
    .select("id, type, amount, status, reference, description, metadata, created_at, user_id")
    .eq("reference", reference)
    .single();

  if (error || !txn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Fetch user name (not email for privacy)
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", txn.user_id)
    .single();

  return NextResponse.json({
    reference: txn.reference,
    type: txn.type,
    description: txn.description,
    amount: txn.amount,
    status: txn.status,
    date: txn.created_at,
    customer: profile ? `${profile.first_name} ${profile.last_name}` : "Customer",
    metadata: {
      phone: txn.metadata?.phone,
      network: txn.metadata?.network,
      token: txn.metadata?.providerResponse?.data?.token,
      plan_name: txn.metadata?.plan_name,
    },
  });
}
