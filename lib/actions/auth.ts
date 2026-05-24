"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah" };
        default:
          return { error: "Terjadi kesalahan, coba lagi" };
      }
    }
    throw error; // Re-throw redirect (diperlukan oleh NextAuth)
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Semua field wajib diisi" };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  // Cek apakah email sudah terdaftar
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Email sudah terdaftar" };
  }

  // Hash password dan buat user
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return { success: true, message: "Akun berhasil dibuat, silakan login" };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
