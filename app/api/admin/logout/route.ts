import { NextResponse } from "next/server";
import { logoutAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  await logoutAdmin();
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url, 303);
}
