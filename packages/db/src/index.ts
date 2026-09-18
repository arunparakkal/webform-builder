import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient, Prisma } from "@prisma/client";
export {
  persistSubmission,
  type PersistSubmissionInput,
  type PersistSubmissionResult,
} from "./submissions.js";
export type {
  User,
  Form,
  FormVersion,
  FormSubmission,
  FormHourlyStat,
  FormStatus,
} from "@prisma/client";
