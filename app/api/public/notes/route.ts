import { NextRequest } from "next/server";
import { getPublishedNotes } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const notes = getPublishedNotes(search);
    return Response.json({ notes });
  } catch (err) {
    console.error("GET /api/public/notes error:", err);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
