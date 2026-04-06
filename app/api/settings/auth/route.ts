import { NextRequest } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json() as { password?: string };
    if (!password) {
      return Response.json({ error: "Password required" }, { status: 400 });
    }

    const storedPassword = getSetting("admin_password");

    // First time — no password set yet, set it now
    if (!storedPassword) {
      setSetting("admin_password", password);
      return Response.json({ success: true, firstSetup: true });
    }

    // Verify password
    if (password === storedPassword) {
      return Response.json({ success: true });
    }

    return Response.json({ error: "Nesprávne heslo" }, { status: 401 });
  } catch (err) {
    console.error("Auth error:", err);
    return Response.json({ error: "Auth failed" }, { status: 500 });
  }
}
