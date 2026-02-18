import * as nodemailer from 'nodemailer';

// Lazy initialize Nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number.parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  return transporter;
}

// Default sender
const FROM_EMAIL = process.env.EMAIL_FROM || 'EZMig <noreply@ezmig.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Nodemailer (Gmail SMTP)
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<EmailResult> {
  const transport = getTransporter();

  // If no SMTP config, log to console in development
  if (!transport) {
    console.log('=== EMAIL (SMTP not configured) ===');
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);
    if (html) console.log(`Body: ${html.substring(0, 200)}...`);
    console.log('=== END EMAIL ===');
    return { success: true, id: 'dev-mode' };
  }

  try {
    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    });

    return { success: true, id: info.messageId };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Existing email templates (migrated from Resend, same HTML)
// ---------------------------------------------------------------------------

/**
 * Send welcome email to new user registered via referral
 */
export async function sendWelcomeEmail({
  email,
  name,
  teamName,
}: {
  email: string;
  name: string;
  teamName: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Welcome to ${teamName} - EZMig`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to EZMig!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully for <strong>${teamName}</strong>.</p>
        <p>You can now access the portal to:</p>
        <ul>
          <li>Complete your immigration forms</li>
          <li>Upload supporting documents</li>
          <li>Track your case progress</li>
        </ul>
        <p>
          <a href="${BASE_URL}/dashboard/my-cases" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Portal
          </a>
        </p>
        <p>If you have any questions, please contact your attorney directly.</p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send notification to attorney about new client registration
 */
export async function sendNewClientNotification({
  attorneyEmail,
  clientName,
  clientEmail,
  teamName,
  caseNumber,
}: {
  attorneyEmail: string;
  clientName: string;
  clientEmail: string;
  teamName: string;
  caseNumber?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: attorneyEmail,
    subject: `New Client Registered - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">New Client Registration</h2>
        <p>A new client has registered via your referral link:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Name</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Email</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${clientEmail}</td>
          </tr>
          ${caseNumber ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Case</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">#${caseNumber}</td>
          </tr>
          ` : ''}
        </table>
        <p>
          <a href="${BASE_URL}/dashboard/clients" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Clients
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send case status update notification
 */
export async function sendCaseStatusUpdateNotification({
  email,
  clientName,
  caseNumber,
  oldStatus,
  newStatus,
  statusDescription,
}: {
  email: string;
  clientName: string;
  caseNumber: string;
  oldStatus: string;
  newStatus: string;
  statusDescription?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Case Status Update - ${caseNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Case Status Update</h2>
        <p>Hello ${clientName},</p>
        <p>Your immigration case has a new status update:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Case Number</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${caseNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Previous Status</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${oldStatus}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>New Status</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #7c3aed; font-weight: bold;">${newStatus}</td>
          </tr>
        </table>
        ${statusDescription ? `<p>${statusDescription}</p>` : ''}
        <p>
          <a href="${BASE_URL}/dashboard/my-cases" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Case Details
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// New email templates
// ---------------------------------------------------------------------------

/**
 * Send invitation email when owner invites a team member
 */
export async function sendInvitationEmail({
  email,
  teamName,
  role,
  inviterName,
  inviteId,
}: {
  email: string;
  teamName: string;
  role: string;
  inviterName: string;
  inviteId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `You're invited to join ${teamName} on EZMig`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">You're Invited!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> as <strong>${role}</strong> on EZMig.</p>
        <p>Click the button below to create your account and join the team:</p>
        <p>
          <a href="${BASE_URL}/sign-up?inviteId=${inviteId}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>If you don't recognize this invitation, you can safely ignore this email.</p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send welcome email when someone signs up directly
 */
export async function sendSignUpWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Welcome to EZMig!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to EZMig!</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Your account has been created successfully. You're ready to start managing your immigration cases.</p>
        <p>Get started by setting up your profile:</p>
        <p>
          <a href="${BASE_URL}/onboarding" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Setup
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify team when a client completes a form
 */
export async function sendFormCompletedNotification({
  email,
  formCode,
  clientName,
  caseNumber,
  caseId,
}: {
  email: string;
  formCode: string;
  clientName: string;
  caseNumber: string;
  caseId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Form ${formCode} Completed - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Form Completed</h2>
        <p>Hello,</p>
        <p><strong>${clientName}</strong> has completed form <strong>${formCode}</strong> for case <strong>#${caseNumber}</strong>.</p>
        <p>Please review the completed form at your earliest convenience.</p>
        <p>
          <a href="${BASE_URL}/dashboard/cases/${caseId}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Form
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify team when a form is submitted for review
 */
export async function sendFormSubmittedTeamNotification({
  email,
  formCode,
  clientName,
  caseNumber,
  caseId,
}: {
  email: string;
  formCode: string;
  clientName: string;
  caseNumber: string;
  caseId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Form ${formCode} Submitted for Review - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Form Submitted for Review</h2>
        <p>Hello,</p>
        <p><strong>${clientName}</strong> has submitted form <strong>${formCode}</strong> for case <strong>#${caseNumber}</strong> and it's ready for your review.</p>
        <p>
          <a href="${BASE_URL}/dashboard/cases/${caseId}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Submission
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send confirmation to client when their form is submitted
 */
export async function sendFormSubmittedClientConfirmation({
  email,
  clientName,
  formCode,
  caseNumber,
}: {
  email: string;
  clientName: string;
  formCode: string;
  caseNumber: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Form ${formCode} Submitted Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Form Submitted</h2>
        <p>Hello ${clientName},</p>
        <p>Your form <strong>${formCode}</strong> for case <strong>#${caseNumber}</strong> has been submitted successfully and is now under review by your attorney.</p>
        <p>You will be notified once the review is complete.</p>
        <p>
          <a href="${BASE_URL}/dashboard/my-cases" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View My Cases
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify staff member when they are assigned to a case
 */
export async function sendCaseAssignedNotification({
  email,
  staffName,
  caseNumber,
  clientName,
  caseId,
}: {
  email: string;
  staffName: string;
  caseNumber: string;
  clientName: string;
  caseId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Case Assigned - #${caseNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">New Case Assignment</h2>
        <p>Hello ${staffName},</p>
        <p>You have been assigned to case <strong>#${caseNumber}</strong> for client <strong>${clientName}</strong>.</p>
        <p>
          <a href="${BASE_URL}/dashboard/cases/${caseId}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Case
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify member when they are removed from a team
 */
export async function sendTeamMemberRemovedNotification({
  email,
  teamName,
}: {
  email: string;
  teamName: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `You've been removed from ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Team Membership Update</h2>
        <p>Hello,</p>
        <p>You have been removed from the team <strong>${teamName}</strong> on EZMig.</p>
        <p>If you believe this was done in error, please contact your team administrator.</p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Security notification when password is changed
 */
export async function sendPasswordChangedNotification({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Password Changed - EZMig',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Password Changed</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Your EZMig account password was recently changed.</p>
        <p>If you made this change, no further action is needed.</p>
        <p>If you did <strong>not</strong> make this change, please contact support immediately to secure your account.</p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify team when evidence/document is uploaded
 */
export async function sendEvidenceUploadedNotification({
  email,
  fileName,
  uploaderName,
  caseNumber,
  caseId,
}: {
  email: string;
  fileName: string;
  uploaderName: string;
  caseNumber: string;
  caseId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `New Document Uploaded - Case #${caseNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">New Document Uploaded</h2>
        <p>Hello,</p>
        <p><strong>${uploaderName}</strong> uploaded a document for case <strong>#${caseNumber}</strong>:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>File</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${fileName}</td>
          </tr>
        </table>
        <p>
          <a href="${BASE_URL}/dashboard/cases/${caseId}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Case
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Notify user that their account has been permanently deleted by a team owner
 */
export async function sendAccountDeletedNotification({
  email,
  teamName,
}: {
  email: string;
  teamName: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Your account has been deleted from ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Account Deleted</h2>
        <p>Hello,</p>
        <p>Your account and all associated data have been permanently deleted from <strong>${teamName}</strong> on EZMig by a team administrator.</p>
        <p>If you believe this was done in error, please contact your team administrator directly.</p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send subscription confirmation email with trial details
 */
export async function sendSubscriptionConfirmationEmail({
  email,
  name,
  teamName,
  planName,
  trialEndDate,
  planPrice,
  planInterval,
}: {
  email: string;
  name?: string;
  teamName: string;
  planName: string;
  trialEndDate?: Date;
  planPrice?: number;
  planInterval?: string;
}): Promise<EmailResult> {
  const trialInfo = trialEndDate
    ? `<div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
         <h3 style="margin: 0 0 8px 0; font-size: 18px;">🎉 Prueba gratuita activada</h3>
         <p style="margin: 0; opacity: 0.9;">Tu período de prueba termina el ${trialEndDate.toLocaleDateString('es-ES', {
           weekday: 'long',
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         })}</p>
       </div>`
    : '';

  const priceInfo = planPrice
    ? `<tr>
         <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Precio:</td>
         <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">$${(planPrice / 100).toFixed(2)} USD/${planInterval || 'mes'}</td>
       </tr>`
    : '';

  return sendEmail({
    to: email,
    subject: `¡Bienvenido a ${planName} en EZMig! ✨`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de suscripción - EZMig</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">EZMig</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Simplificando la inmigración</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: white;">✓</span>
              </div>
              <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">¡Suscripción Confirmada!</h2>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hola${name ? ` ${name}` : ''},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              ¡Gracias por suscribirte a EZMig! Tu suscripción a <strong>${planName}</strong> para el equipo <strong>${teamName}</strong> está activa y lista para usar.
            </p>

            ${trialInfo}

            <!-- Subscription Details -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Detalles de la suscripción</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Plan:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Equipo:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${teamName}</td>
                </tr>
                ${priceInfo}
                <tr>
                  <td style="padding: 12px 16px; color: #6b7280; font-weight: 500;">Estado:</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: #22c55e;">Activa</td>
                </tr>
              </table>
            </div>

            <!-- Features -->
            <div style="margin: 24px 0;">
              <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Qué puedes hacer ahora:</h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #22c55e; font-size: 16px;">✓</span>
                  <span style="color: #374151; font-size: 15px;">Procesar formularios de inmigración con IA</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #22c55e; font-size: 16px;">✓</span>
                  <span style="color: #374151; font-size: 15px;">Gestionar casos de clientes</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #22c55e; font-size: 16px;">✓</span>
                  <span style="color: #374151; font-size: 15px;">Colaborar con tu equipo</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #22c55e; font-size: 16px;">✓</span>
                  <span style="color: #374151; font-size: 15px;">Portal de clientes personalizado</span>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${BASE_URL}/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.3);">
                Ir al Dashboard
              </a>
            </div>

            <!-- Support -->
            <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>¿Necesitas ayuda?</strong><br>
                Estamos aquí para ayudarte. Visita nuestro centro de soporte o contáctanos directamente.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
              Este email fue enviado a <strong>${email}</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} EZMig. Todos los derechos reservados.
            </p>
          </div>
        </div>

        <!-- Spacing -->
        <div style="height: 32px;"></div>
      </body>
      </html>
    `,
  });
}

/**
 * Send subscription cancellation confirmation email
 */
export async function sendSubscriptionCancellationEmail({
  email,
  name,
  teamName,
  planName,
  endDate,
}: {
  email: string;
  name?: string;
  teamName: string;
  planName: string;
  endDate?: Date;
}): Promise<EmailResult> {
  const endInfo = endDate
    ? `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
         <h3 style="margin: 0 0 8px 0; font-size: 18px;">📅 Fecha de terminación</h3>
         <p style="margin: 0; opacity: 0.9;">Tu suscripción terminará el ${endDate.toLocaleDateString('es-ES', {
           weekday: 'long',
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         })}</p>
       </div>`
    : '';

  return sendEmail({
    to: email,
    subject: `Confirmación de cancelación - ${planName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancelación confirmada - EZMig</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">EZMig</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Simplificando la inmigración</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: white;">✗</span>
              </div>
              <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">Suscripción Cancelada</h2>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hola${name ? ` ${name}` : ''},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hemos confirmado la cancelación de tu suscripción a <strong>${planName}</strong> para el equipo <strong>${teamName}</strong>.
            </p>

            ${endInfo}

            <!-- What happens next -->
            <div style="background-color: #fef3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">¿Qué pasa ahora?</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                <li>Mantienes acceso completo hasta la fecha de terminación</li>
                <li>Tus datos permanecen seguros durante 30 días adicionales</li>
                <li>Puedes reactivar tu suscripción en cualquier momento</li>
              </ul>
            </div>

            <!-- Reactivate CTA -->
            <div style="text-align: center; margin: 32px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
                ¿Cambiaste de opinión?
              </p>
              <a href="${BASE_URL}/dashboard/billing/plans"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.3);">
                Reactivar Suscripción
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
              Este email fue enviado a <strong>${email}</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} EZMig. Todos los derechos reservados.
            </p>
          </div>
        </div>

        <!-- Spacing -->
        <div style="height: 32px;"></div>
      </body>
      </html>
    `,
  });
}


/**
 * Send trial expiring soon reminder
 */
export async function sendTrialExpiringReminder({
  email,
  name,
  teamName,
  daysLeft,
  planName,
}: {
  email: string;
  name?: string;
  teamName: string;
  daysLeft: number;
  planName: string;
}): Promise<EmailResult> {
  const daysText = daysLeft === 1 ? 'día restante' : 'días restantes';

  return sendEmail({
    to: email,
    subject: `⏰ Tu prueba gratuita expira en ${daysLeft} días`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prueba gratuita expira pronto - EZMig</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">EZMig</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Simplificando la inmigración</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background-color: #f59e0b; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: white;">⏰</span>
              </div>
              <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">Tu prueba gratuita expira pronto</h2>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hola${name ? ` ${name}` : ''},
            </p>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
              <h3 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">${daysLeft}</h3>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">${daysText} en tu prueba gratuita</p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Tu prueba gratuita de <strong>${planName}</strong> para el equipo <strong>${teamName}</strong> está por expirar.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${BASE_URL}/dashboard/billing/plans"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Continuar con plan pago
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} EZMig. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedNotification({
  email,
  name,
  teamName,
  planName,
  errorMessage,
}: {
  email: string;
  name?: string;
  teamName: string;
  planName: string;
  errorMessage?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `⚠️ Error en el pago - Acción requerida`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error en el pago - EZMig</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">EZMig</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Simplificando la inmigración</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px; color: white;">⚠️</span>
              </div>
              <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">Error en el Pago</h2>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hola${name ? ` ${name}` : ''},
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              No pudimos procesar el pago de tu suscripción a <strong>${planName}</strong> para el equipo <strong>${teamName}</strong>.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${BASE_URL}/dashboard/billing"
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Actualizar método de pago
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} EZMig. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
