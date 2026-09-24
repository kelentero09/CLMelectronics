import { NextResponse } from "next/server";
import { exportInquiriesToArchive } from "@/app/actions/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const days = body.days || 90;
    
    const result = await exportInquiriesToArchive(days);
    
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    // Return the archive data as a downloadable file
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="inquiries-archive-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (e) {
    console.error("[API storage archive]", e);
    return NextResponse.json({ error: "Failed to archive inquiries" }, { status: 500 });
  }
}