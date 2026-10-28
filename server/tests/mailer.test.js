import { describe, expect, it, vi } from "vitest";
import { withRetries } from "../src/services/mailer.js";

const quick = { delays: [1, 1] }; // esperas mínimas para que el test sea rápido

describe("Reintentos del correo", () => {
  it("reintenta un fallo pasajero hasta que el envío sale", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("conexión cortada"))
      .mockRejectedValueOnce(new Error("conexión cortada"))
      .mockResolvedValue("enviado");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(withRetries(send, quick)).resolves.toBe("enviado");
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("se rinde tras el último intento y devuelve el error", async () => {
    const send = vi.fn().mockRejectedValue(new Error("servidor caído"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(withRetries(send, quick)).rejects.toThrow("servidor caído");
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("no reintenta un error definitivo", async () => {
    const definitive = Object.assign(new Error("dirección inválida"), { status: 422 });
    const send = vi.fn().mockRejectedValue(definitive);

    await expect(
      withRetries(send, { ...quick, isTransient: (err) => !err.status || err.status >= 500 })
    ).rejects.toThrow("dirección inválida");
    expect(send).toHaveBeenCalledTimes(1);
  });
});
