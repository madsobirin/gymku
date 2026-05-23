import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      return NextResponse.json({ message: "Login berhasil" }, { status: 200 });
    } catch (error: any) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case "CredentialsSignin":
            return NextResponse.json(
              { error: "Email atau password salah" },
              { status: 401 },
            );
          default:
            return NextResponse.json(
              { error: "Terjadi kesalahan saat masuk" },
              { status: 401 },
            );
        }
      }

      // NextAuth v5 kadang melempar NEXT_REDIRECT saat berhasil
      if (
        error.message === "NEXT_REDIRECT" ||
        error.digest?.startsWith("NEXT_REDIRECT")
      ) {
        return NextResponse.json({ message: "Login berhasil" }, { status: 200 });
      }

      return NextResponse.json(
        { error: error.message || "Terjadi kesalahan server" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
