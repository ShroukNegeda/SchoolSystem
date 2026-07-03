"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "الرئيسية" },
    { href: "/admin/teachers/follow-up", label: "متابعة المدرسين" },
    { href: "/admin/teachers", label: "حضور المدرسين" },
    { href: "/admin/classes", label: "فصول المدرسة" },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap ${
              isActive
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-primary-dark)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
