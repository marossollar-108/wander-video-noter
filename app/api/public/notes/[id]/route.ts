import { NextRequest } from "next/server";
import { getNoteDetail } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const note = getNoteDetail(id);

    if (!note || !note.published) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ note });
  } catch (err) {
    console.error("GET /api/public/notes/[id] error:", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
