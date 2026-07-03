import { readFileSync, writeFileSync } from "fs";

const files = [
  "src/app/admin/page.tsx",
  "src/app/admin/classes/page.tsx",
  "src/app/admin/classes/year/[year]/page.tsx",
  "src/app/admin/classes/year/[year]/term/[term]/page.tsx",
  "src/app/admin/classes/year/[year]/term/[term]/[grade]/[section]/page.tsx",
  "src/app/admin/classes/year/[year]/term/[term]/[grade]/[section]/teacher/[classFileId]/page.tsx",
  "src/app/admin/teachers/page.tsx",
  "src/app/admin/teachers/follow-up/page.tsx",
  "src/app/admin/teachers/follow-up/year/[year]/page.tsx",
  "src/app/admin/teachers/follow-up/year/[year]/term/[term]/page.tsx",
  "src/app/admin/teachers/year/[year]/page.tsx",
  "src/app/admin/teachers/year/[year]/term/[term]/page.tsx",
  "src/app/admin/year/[year]/page.tsx",
  "src/app/admin/year/[year]/term/[term]/page.tsx",
  "src/app/shoon/page.tsx",
  "src/app/shoon/[yearSlug]/page.tsx",
  "src/app/shoon/[yearSlug]/[term]/page.tsx",
  "src/app/shoon/[yearSlug]/[term]/[fileId]/page.tsx",
  "src/app/teacher/page.tsx",
  "src/app/teacher/[yearSlug]/page.tsx",
  "src/app/teacher/[yearSlug]/[term]/page.tsx",
  "src/app/teacher/[yearSlug]/[term]/[classFileId]/page.tsx",
];

for (const file of files) {
  try {
    let content = readFileSync(file, "utf8");
    const original = content;

    // 1. Add redirect import if not present
    if (!content.includes("redirect") && content.includes('from "next/navigation"')) {
      content = content.replace('from "next/navigation"', ', redirect from "next/navigation"');
    }

    // 2. Replace findUniqueOrThrow with findUnique + redirect
    content = content.replace(
      /const user = await prisma\.user\.findUniqueOrThrow\(\{\s*where:\s*\{ id: session\.userId \},\s*\}\);/g,
      `const user = await prisma.user.findUnique({\n    where: { id: session.userId },\n  });\n  if (!user) redirect("/login");`
    );

    if (content !== original) {
      writeFileSync(file, content);
      console.log("✅ Fixed:", file);
    }
  } catch (e) {
    console.log("❌ Error:", file, e.message);
  }
}
console.log("DONE");