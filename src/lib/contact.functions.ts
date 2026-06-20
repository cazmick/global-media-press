import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message required").max(2000),
});

const FORWARD_TO = "kanishkamogha20@gmail.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function toBase64Url(input: string): string {
  // btoa handles ASCII; ensure UTF-8 safety
  const utf8 = unescape(encodeURIComponent(input));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function forwardViaGmail(data: z.infer<typeof ContactSchema>) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmailKey = process.env.GOOGLE_MAIL_API_KEY;
  if (!lovableKey || !gmailKey) {
    console.error("[contact] Missing email forwarding credentials");
    return;
  }

  const subject = `Global Media inquiry from ${data.name}`;
  const textBody =
    `New contact form submission\n\n` +
    `Name: ${data.name}\n` +
    `Email: ${data.email}\n\n` +
    `Message:\n${data.message}\n`;

  const headers = [
    `To: ${FORWARD_TO}`,
    `Reply-To: ${data.name} <${data.email}>`,
    `Subject: =?UTF-8?B?${toBase64Url(subject).replace(/-/g, "+").replace(/_/g, "/")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textBody,
  ].join("\r\n");

  const raw = toBase64Url(headers);

  try {
    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmailKey,
      },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[contact] Gmail send failed", res.status, text);
    }
  } catch (e) {
    console.error("[contact] Gmail send threw", e);
  }
  // Intentionally do not throw: DB row is already saved.
  void escapeHtml;
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ContactSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      message: data.message,
    });
    if (error) throw new Error(error.message);

    await forwardViaGmail(data);

    return { ok: true };
  });
