import { NextRequest } from "next/server";
import { publishNote, unpublishNote, getNoteById } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    publishNote(id);
    const note = getNoteById(id);
    return Response.json({ note });
  } catch (err) {
    console.error("POST /api/notes/[id]/publish error:", err);
    return Response.json(
      { error: "Failed to publish note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    unpublishNote(id);
    const note = getNoteById(id);
    return Response.json({ note });
  } catch (err) {
    console.error("DELETE /api/notes/[id]/publish error:", err);
    return Response.json(
      { error: "Failed to unpublish note" },
      { status: 500 }
    );
  }
}
