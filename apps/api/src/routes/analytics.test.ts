import Fastify from "fastify";
import { afterAll, describe, expect, it, vi } from "vitest";
import { analyticsRoutes } from "./analytics.js";
import { requireAuth } from "./auth.js";
import { signAccessToken } from "../services/auth.js";
import { getHourlyAnalytics } from "../services/hourly-analytics.js";

vi.mock("../services/hourly-analytics.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/hourly-analytics.js")>();
  return {
    ...actual,
    getHourlyAnalytics: vi.fn(),
  };
});

const FORM_ID = "0dbdd8c8-8b76-4858-88ff-8cc821d94ad8";
const JWT_SECRET = "dev-only-change-me-jwt-secret";

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.decorate("env", { JWT_SECRET } as never);
  app.decorate("redis", {} as never);
  await app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", requireAuth);
    await protectedApp.register(analyticsRoutes);
  });
  return app;
}

describe("GET /api/forms/:formId/analytics/hourly", () => {
  const mockedGet = vi.mocked(getHourlyAnalytics);

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it("requires authentication", async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: "GET",
      url: `/api/forms/${FORM_ID}/analytics/hourly`,
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects an invalid formId", async () => {
    const app = await buildTestApp();
    const token = await signAccessToken(
      { id: "b8785d00-0cc4-445a-814d-53a66fee648c", email: "a@b.c", name: "A" },
      JWT_SECRET,
    );
    const res = await app.inject({
      method: "GET",
      url: "/api/forms/not-a-uuid/analytics/hourly",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "Invalid form id" });
    expect(mockedGet).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects invalid start/end timestamps", async () => {
    const app = await buildTestApp();
    const token = await signAccessToken(
      { id: "b8785d00-0cc4-445a-814d-53a66fee648c", email: "a@b.c", name: "A" },
      JWT_SECRET,
    );
    const res = await app.inject({
      method: "GET",
      url: `/api/forms/${FORM_ID}/analytics/hourly?start=yesterday`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(mockedGet).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns chronological analytics from the service", async () => {
    mockedGet.mockResolvedValueOnce({
      formId: FORM_ID,
      data: [
        {
          windowStart: "2026-09-20T10:00:00.000Z",
          windowEnd: "2026-09-20T11:00:00.000Z",
          submissionCount: 3,
        },
      ],
    });
    const app = await buildTestApp();
    const token = await signAccessToken(
      { id: "b8785d00-0cc4-445a-814d-53a66fee648c", email: "a@b.c", name: "A" },
      JWT_SECRET,
    );
    const res = await app.inject({
      method: "GET",
      url: `/api/forms/${FORM_ID}/analytics/hourly?start=2026-09-20T10:00:00.000Z&end=2026-09-20T11:00:00.000Z`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      formId: FORM_ID,
      data: [
        {
          windowStart: "2026-09-20T10:00:00.000Z",
          windowEnd: "2026-09-20T11:00:00.000Z",
          submissionCount: 3,
        },
      ],
    });
    await app.close();
  });
});
