import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyPassword, signToken, COOKIE_NAME, hashPassword } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if any user exists in the system
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // First-time setup auto-initialization for admin
      const initialAdmin = await User.create({
        name: "School Administrator",
        email: cleanEmail,
        passwordHash: await hashPassword(password),
        role: "admin",
      });

      const token = await signToken({
        userId: initialAdmin._id.toString(),
        name: initialAdmin.name,
        email: initialAdmin.email,
        role: initialAdmin.role,
      });

      const response = NextResponse.json({
        success: true,
        message: "Administrator account created and logged in successfully.",
        user: {
          id: initialAdmin._id,
          name: initialAdmin.name,
          email: initialAdmin.email,
          role: initialAdmin.role,
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
