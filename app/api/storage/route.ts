import { NextResponse } from "next/server";
import { getStorageStats } from "@/app/actions/storage";

export async function GET() {
  try {
    const result = await getStorageStats();
    
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (e) {
    console.error("[API storage]", e);
    return NextResponse.json({ error: "Failed to get storage stats" }, { status: 500 });
  }
}