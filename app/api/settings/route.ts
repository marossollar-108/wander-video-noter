import { NextRequest } from "next/server";
import { getAllSettings, setSetting } from "@/lib/db";

export async function GET() {
  try {
    const settings = getAllSettings();
    return Response.json({ settings });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { error: "Body must be a JSON object of key-value pairs" },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(body)) {
      setSetting(key, String(value));
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("PUT /api/settings error:", err);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
