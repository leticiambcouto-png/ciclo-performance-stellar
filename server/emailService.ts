import nodemailer from "nodemailer";

// ─── SMTP CONFIGURATION ──────────────────────────────────────────────────────
// Configure via environment variables:
//   SMTP_HOST     - e.g. smtp.gmail.com
//   SMTP_PORT     - e.g. 587
//   SMTP_USER     - e-mail address used to send
//   SMTP_PASS     - app password or SMTP password
//   SMTP_FROM     - display name + address, e.g. "Stellar Gaming <no-reply@estrelabet.com>"

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const transport = createTransport();

  if (!transport) {
    console.warn("[EmailService] SMTP not configured — skipping email send.");
    return { success: false, error: "SMTP não configurado." };
  }

  const from =
    process.env.SMTP_FROM ?? `"Stellar Gaming" <${process.env.SMTP_USER}>`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de Senha</title>
</head>
<body style="margin:0;padding:0;background:#001023;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#001023;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1f35;border-radius:12px;overflow:hidden;border:1px solid #1840eb33;">
          <!-- Header -->
          <tr>
            <td style="background:#0d2847;padding:32px 40px;text-align:center;border-bottom:2px solid #d9f22a;">
              <div style="display:inline-flex;align-items:center;gap:12px;">
                <div style="background:#d9f22a;border-radius:10px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">⚡</div>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Stellar Gaming</span>
              </div>
              <p style="color:#8ba3bc;margin:8px 0 0;font-size:13px;">Ciclo de Performance 2.0</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Redefinição de Senha</h1>
              <p style="color:#8ba3bc;font-size:15px;margin:0 0 24px;">Olá, <strong style="color:#fdffdf;">${params.name}</strong>!</p>
              <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Recebemos uma solicitação para redefinir a senha da sua conta na plataforma de Ciclo de Performance da Stellar Gaming.
              </p>
              <p style="color:#c8d8e8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong style="color:#d9f22a;">1 hora</strong>.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.resetUrl}" 
                       style="display:inline-block;background:#d9f22a;color:#001023;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Fallback URL -->
              <p style="color:#8ba3bc;font-size:12px;margin:32px 0 0;text-align:center;">
                Se o botão não funcionar, copie e cole este link no navegador:<br/>
                <a href="${params.resetUrl}" style="color:#1840eb;word-break:break-all;">${params.resetUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #1840eb22;margin:32px 0;" />
              <p style="color:#8ba3bc;font-size:12px;margin:0;text-align:center;">
                Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#071828;padding:20px 40px;text-align:center;border-top:1px solid #1840eb22;">
              <p style="color:#4a6580;font-size:12px;margin:0;">
                © 2026 Stellar Gaming · Ciclo de Performance 2.0
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Olá, ${params.name}!

Recebemos uma solicitação para redefinir a senha da sua conta na plataforma de Ciclo de Performance da Stellar Gaming.

Acesse o link abaixo para criar uma nova senha (válido por 1 hora):
${params.resetUrl}

Se você não solicitou a redefinição de senha, ignore este e-mail.

Stellar Gaming — Ciclo de Performance 2.0
  `.trim();

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: "Redefinição de Senha — Ciclo de Performance Stellar Gaming",
      text,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[EmailService] Failed to send email:", msg);
    return { success: false, error: msg };
  }
}
