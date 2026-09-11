import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@webform/db";
import { z } from "zod";

const SALT_ROUNDS = 10;

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().email("Enter a valid email").max(254),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long")
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signAccessToken(user: AuthUser, secret: string) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey(secret));
}

export async function verifyAccessToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, secretKey(secret));
  const id = payload.sub;
  if (!id) throw new Error("Invalid token");
  return {
    id,
    email: typeof payload.email === "string" ? payload.email : "",
    name: typeof payload.name === "string" ? payload.name : null,
  } satisfies AuthUser;
}

export async function createUser(input: z.infer<typeof signupSchema>) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists"), { statusCode: 409 });
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email,
      name: input.name.trim() || null,
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }
  return { id: user.id, email: user.email, name: user.name };
}

export async function ensureDemoOwner(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash },
    create: {
      email: email.toLowerCase(),
      name: "Demo Owner",
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
}
