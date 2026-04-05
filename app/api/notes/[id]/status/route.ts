import { NextRequest } from "next/server";
import { getNoteById } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const note = getNoteById(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({
      status: note.status,
      progress: note.progress,
      current_step: note.current_step,
      error_msg: note.error_msg,
    });
  } catch (err) {
    console.error("GET /api/notes/[id]/status error:", err);
    return Response.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
