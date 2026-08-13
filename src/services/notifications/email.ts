import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_PASS);
const APP_NAME = env.APP_NAME;
const SMTP_USER = env.SMTP_USER;
const API_URL = env.API_URL;

const brand = {
  green: '#2A7F68',
  greenDark: '#1F6653',
  greenSoft: '#E8F2EE',
  ink: '#111827',
  text: '#374151',
  muted: '#6B7280',
  border: '#E5E7EB',
  background: '#F7F3EE',
  surface: '#FFFFFF',
};

interface EmailTemplateOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryText?: string;
  warningText?: string;
}

const getTransporter = async (): Promise<Transporter> => {
  if (hasSmtpConfig) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS!,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

const logPreviewUrl = (info: SentMessageInfo): void => {
  if (!hasSmtpConfig) {
    logger.info('email_preview_url', {
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  }
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildPlainText = ({
  title,
  intro,
  ctaLabel,
  ctaUrl,
  secondaryText,
  warningText,
}: EmailTemplateOptions) =>
  [
    `${APP_NAME} - ${title}`,
    '',
    intro,
    '',
    `${ctaLabel}:`,
    ctaUrl,
    secondaryText ? ['', secondaryText] : null,
    warningText ? ['', warningText] : null,
    '',
    `L'équipe ${APP_NAME}`,
  ]
    .flat()
    .filter((line): line is string => typeof line === 'string')
    .join('\n');

const renderEmailTemplate = (options: EmailTemplateOptions) => {
  const {
    preheader,
    eyebrow,
    title,
    intro,
    ctaLabel,
    ctaUrl,
    secondaryText,
    warningText,
  } = options;

  const safeCtaUrl = escapeHtml(ctaUrl);

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${brand.background};font-family:Arial,Helvetica,sans-serif;color:${brand.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${brand.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:24px;line-height:30px;font-weight:800;color:${brand.ink};letter-spacing:-0.2px;">
                      ${escapeHtml(APP_NAME)}
                    </td>
                    <td align="right" style="font-size:12px;line-height:18px;color:${brand.muted};">
                      Reconversion professionnelle
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background:${brand.surface};border:1px solid ${brand.border};border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(17,24,39,0.08);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:${brand.green};padding:28px 32px;">
                      <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#DDF2EA;margin-bottom:8px;">
                        ${escapeHtml(eyebrow)}
                      </div>
                      <h1 style="margin:0;font-size:30px;line-height:36px;color:#FFFFFF;font-weight:800;letter-spacing:-0.4px;">
                        ${escapeHtml(title)}
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 22px 0;font-size:16px;line-height:26px;color:${brand.text};">
                        ${escapeHtml(intro)}
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 28px 0;">
                        <tr>
                          <td style="border-radius:12px;background:${brand.green};">
                            <a href="${safeCtaUrl}" target="_blank" style="display:inline-block;padding:15px 22px;font-size:15px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px;">
                              ${escapeHtml(ctaLabel)}
                            </a>
                          </td>
                        </tr>
                      </table>

                      ${
                        secondaryText
                          ? `<p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:${brand.muted};">${escapeHtml(secondaryText)}</p>`
                          : ''
                      }

                      ${
                        warningText
                          ? `<div style="margin:22px 0;padding:14px 16px;border-radius:12px;background:${brand.greenSoft};font-size:14px;line-height:22px;color:${brand.greenDark};">${escapeHtml(warningText)}</div>`
                          : ''
                      }

                      <div style="margin-top:28px;padding-top:22px;border-top:1px solid ${brand.border};">
                        <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:${brand.muted};">
                          Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :
                        </p>
                        <a href="${safeCtaUrl}" target="_blank" style="font-size:12px;line-height:18px;color:${brand.greenDark};word-break:break-all;text-decoration:underline;">
                          ${safeCtaUrl}
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:22px 12px 0 12px;font-size:12px;line-height:18px;color:${brand.muted};">
                © ${new Date().getFullYear()} ${escapeHtml(APP_NAME)}. Cet email a été envoyé automatiquement.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

async function sendTemplatedEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: EmailTemplateOptions;
}) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject,
    html: renderEmailTemplate(template),
    text: buildPlainText(template),
  });

  logPreviewUrl(info);
}

export const sendValidationEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const link = `${API_URL}/api/users/verify-email?token=${token}`;

  await sendTemplatedEmail({
    to,
    subject: 'Confirme ton adresse email',
    template: {
      preheader: 'Active ton compte Matcha en confirmant ton adresse email.',
      eyebrow: 'Bienvenue sur Matcha',
      title: 'Confirme ton adresse email',
      intro:
        'Merci pour ton inscription. Il ne reste plus qu’à confirmer ton adresse email pour sécuriser ton compte et accéder à ton espace Matcha.',
      ctaLabel: 'Confirmer mon email',
      ctaUrl: link,
      secondaryText: 'Ce lien est valable pendant 1 heure.',
      warningText:
        'Si tu n’es pas à l’origine de cette inscription, tu peux ignorer cet email.',
    },
  });
};

export const sendResetPasswordEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const resetLink = `${API_URL}/api/auth/password-reset/redirect?token=${encodeURIComponent(token)}`;

  await sendTemplatedEmail({
    to,
    subject: 'Réinitialise ton mot de passe',
    template: {
      preheader: 'Choisis un nouveau mot de passe pour ton compte Matcha.',
      eyebrow: 'Sécurité du compte',
      title: 'Réinitialise ton mot de passe',
      intro:
        'Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
      ctaLabel: 'Choisir un nouveau mot de passe',
      ctaUrl: resetLink,
      secondaryText: 'Ce lien est valable pendant 15 minutes.',
      warningText:
        'Si tu n’as pas demandé cette réinitialisation, aucune action n’est nécessaire.',
    },
  });
};

export const sendPasswordChangedEmail = async (to: string): Promise<void> => {
  await sendTemplatedEmail({
    to,
    subject: 'Ton mot de passe a été modifié',
    template: {
      preheader:
        'Confirmation de modification du mot de passe de ton compte Matcha.',
      eyebrow: 'Sécurité du compte',
      title: 'Mot de passe modifié',
      intro:
        'Le mot de passe de ton compte Matcha vient d’être modifié. Si tu es bien à l’origine de cette action, tu n’as rien à faire.',
      ctaLabel: 'Contacter Matcha',
      ctaUrl: `mailto:${SMTP_USER}`,
      warningText:
        'Si tu n’es pas à l’origine de cette modification, demande immédiatement une réinitialisation depuis l’application.',
    },
  });
};

export const sendEmailChangeVerification = async (
  to: string,
  token: string
): Promise<void> => {
  const link = `${API_URL}/api/users/verify-email?token=${token}`;

  await sendTemplatedEmail({
    to,
    subject: 'Confirme ton nouvel email',
    template: {
      preheader: 'Valide la nouvelle adresse email associée à ton compte.',
      eyebrow: 'Changement d’email',
      title: 'Confirme ton nouvel email',
      intro:
        'Tu as demandé à modifier l’adresse email associée à ton compte Matcha. Confirme cette nouvelle adresse pour finaliser le changement.',
      ctaLabel: 'Confirmer mon nouvel email',
      ctaUrl: link,
      secondaryText: 'Ce lien est valable pendant 15 minutes.',
      warningText:
        'Si tu n’es pas à l’origine de cette demande, tu peux ignorer cet email.',
    },
  });
};

export const sendSupportContactEmail = async ({
  fromEmail,
  fromName,
  requestId,
  subject,
  category,
  message,
}: {
  fromEmail: string;
  fromName: string;
  requestId?: string;
  subject: string;
  category: string;
  message: string;
}): Promise<void> => {
  const transporter = await getTransporter();
  const supportRecipient = SMTP_USER;
  const safeSubject = `[Support ${APP_NAME}] ${subject}`;

  const html = renderEmailTemplate({
    preheader: `Nouvelle demande support de ${fromName}.`,
    eyebrow: 'Demande support',
    title: subject,
    intro: `${fromName} (${fromEmail}) a envoyé une demande depuis l’application Matcha.`,
    ctaLabel: 'Répondre par email',
    ctaUrl: `mailto:${fromEmail}`,
    secondaryText: [
      requestId ? `Référence : ${requestId}` : null,
      `Catégorie : ${category}`,
    ]
      .filter(Boolean)
      .join(' · '),
    warningText: message,
  });

  const text = [
    safeSubject,
    '',
    `De : ${fromName} <${fromEmail}>`,
    requestId ? `Référence : ${requestId}` : null,
    `Catégorie : ${category}`,
    '',
    message,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to: supportRecipient,
    replyTo: fromEmail,
    subject: safeSubject,
    html,
    text,
  });

  logPreviewUrl(info);
};
