import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { allowedOrigins } from "../src/utils/origins.js";

describe("Seguridad de la API", () => {
  it("envía cabeceras de seguridad con una política de contenido estricta", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();

    const csp = res.headers["content-security-policy"];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("fonts.googleapis.com");
  });

  it("solo permite llamadas desde la web propia (CLIENT_URL)", async () => {
    const own = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(own.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const other = await request(app).get("/api/health").set("Origin", "https://otra-web.com");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("admite varios orígenes en CLIENT_URL separados por comas", () => {
    const previous = process.env.CLIENT_URL;
    try {
      process.env.CLIENT_URL = "https://midominio.com/, https://www.midominio.com";
      expect(allowedOrigins()).toEqual(["https://midominio.com", "https://www.midominio.com"]);

      process.env.CLIENT_URL = "https://midominio.com";
      expect(allowedOrigins()).toEqual(["https://midominio.com"]);
    } finally {
      process.env.CLIENT_URL = previous;
    }
  });
});
