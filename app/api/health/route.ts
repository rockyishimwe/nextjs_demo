import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: mongoose } = await import("mongoose");

    await connectDB();

    const dbState = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json({
      status: "ok",
      db: states[dbState] || "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
