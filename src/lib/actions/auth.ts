"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

const registerSchema = z
  .object({
    name: z.string().min(3, "الاسم يجب ان يكون 3 حروف على الأقل"),
    phone: z.string().min(8, "رقم الهاتف غير صحيح"),
    email: z.string().email("البريد الإلكترونى غير صحيح"),
    password: z.string().min(6, "كلمة المرور يجب ان تكون 6 خانات على الأقل"),
    role: z.enum(["TEACHER", "SHOON"]),
    subject: z.string().optional(),
  })
  .refine((data) => data.role !== "TEACHER" || !!data.subject, {
    message: "من فضلك اختر المادة التى تدرسها",
    path: ["subject"],
  });

export type ActionState = { error?: string; success?: boolean };

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
    role: String(formData.get("role") || ""),
    subject: formData.get("subject") ? String(formData.get("subject")) : undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "البيانات غير صحيحة" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "البريد الإلكترونى مستخدم بالفعل" };
  }

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      password: hashed,
      role: data.role as "TEACHER" | "SHOON",
      subject: data.role === "TEACHER" ? (data.subject as never) : null,
    },
  });

  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect(user.role === "TEACHER" ? "/teacher" : "/shoon");
}

const loginSchema = z.object({
  email: z.string().email("البريد الإلكترونى غير صحيح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "البيانات غير صحيحة" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return { error: "البريد الإلكترونى أو كلمة المرور غير صحيحة" };
  }
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    return { error: "البريد الإلكترونى أو كلمة المرور غير صحيحة" };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name });

  const home = user.role === "TEACHER" ? "/teacher" : user.role === "SHOON" ? "/shoon" : "/admin";
  redirect(home);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
