import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emailConfigured, sendEmail } from "./email";

const message = { to: "person@example.com", subject: "Reset your Wasiyyah password", text: "Hello" };

const postalSays = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.stubEnv("POSTAL_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM", "Wasiyyah <hello@mail.wasiyyahwills.com>");
    vi.stubEnv("POSTAL_URL", "");
    vi.stubEnv("EMAIL_REPLY_TO", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts the message to Postal with the server key and a Reply-To a person reads", async () => {
    const fetchMock = postalSays(200, { status: "success", data: { message_id: "x" } });
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail(message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://email.oneabsolute.co.uk/api/v1/send/message");
    expect((init.headers as Record<string, string>)["X-Server-API-Key"]).toBe("test-key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Wasiyyah <hello@mail.wasiyyahwills.com>",
      to: ["person@example.com"],
      subject: "Reset your Wasiyyah password",
      plain_body: "Hello",
      reply_to: "hello@wasiyyahwills.com",
    });
  });

  it("uses POSTAL_URL and EMAIL_REPLY_TO when they are set", async () => {
    vi.stubEnv("POSTAL_URL", "https://postal.example.test/");
    vi.stubEnv("EMAIL_REPLY_TO", "help@example.test");
    const fetchMock = postalSays(200, { status: "success" });
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail({ ...message, html: "<p>Hello</p>" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://postal.example.test/api/v1/send/message");
    const sent = JSON.parse(init.body as string);
    expect(sent.reply_to).toBe("help@example.test");
    expect(sent.html_body).toBe("<p>Hello</p>");
  });

  it("throws when Postal refuses the message, even though Postal answers HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      postalSays(200, { status: "error", data: { code: "UnauthenticatedFromAddress" } })
    );
    await expect(sendEmail(message)).rejects.toThrow(/UnauthenticatedFromAddress/);
  });

  it("throws when Postal cannot be reached properly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad gateway", { status: 502 })));
    await expect(sendEmail(message)).rejects.toThrow(/HTTP 502/);
  });

  it("is not configured without both the key and the sender", () => {
    expect(emailConfigured()).toBe(true);
    vi.stubEnv("POSTAL_API_KEY", "");
    expect(emailConfigured()).toBe(false);
  });

  it("in production, refuses to pretend when it is not configured", async () => {
    vi.stubEnv("POSTAL_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendEmail(message)).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
