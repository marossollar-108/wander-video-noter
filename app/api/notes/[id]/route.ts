import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getNoteDetail, deleteNote } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const note = getNoteDetail(id);

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ note });
  } catch (err) {
    console.error("GET /api/notes/[id] error:", err);
    return Response.json(
      { error: "Failed to fetch note" },
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
    const deleted = deleteNote(id);

    if (!deleted) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Remove output directory
    const outputDir = path.join(process.cwd(), "public", "notes", id);
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return Response.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
