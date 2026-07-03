import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-session";

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const year = String(formData.get("year") || "");

  if (!year) {
    return NextResponse.json({ error: "Missing year" }, { status: 400 });
  }

  const existing = await prisma.academicYear.findUnique({ where: { year } });
  if (!existing) {
    await prisma.academicYear.create({
      data: {
        year,
        terms: {
          create: [{ term: "TERM1" }, { term: "TERM2" }],
        },
      },
    });
  }

  return NextResponse.json({ success: true });
}
