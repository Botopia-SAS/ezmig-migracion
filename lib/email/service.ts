import { Resend } from 'resend';
import * as React from 'react';

// Lazy initialize Resend client to avoid errors during build
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Default sender
const FROM_EMAIL = process.env.EMAIL_FROM || 'EZMig <noreply@ezmig.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  text?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, react, text }: SendEmailParams): Promise<EmailResult> {
  const resend = getResendClient();

  // If no API key, log to console in development
  if (!resend) {
    console.log('=== EMAIL (Resend API key not configured) ===');
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);
    if (html) console.log(`Body: ${html.substring(0, 200)}...`);
    console.log('=== END EMAIL ===');
    return { success: true, id: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      react,
      text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

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
          <a href="${BASE_URL}/portal" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
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
 * Send low balance notification
 */
export async function sendLowBalanceNotification({
  email,
  teamName,
  currentBalance,
  threshold,
}: {
  email: string;
  teamName: string;
  currentBalance: number;
  threshold: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Low Token Balance Alert - ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Low Token Balance Alert</h2>
        <p>Hello,</p>
        <p>Your team <strong>${teamName}</strong> has a low token balance.</p>
        <ul>
          <li>Current Balance: <strong>${currentBalance} tokens</strong></li>
          <li>Alert Threshold: ${threshold} tokens</li>
        </ul>
        <p>To continue submitting forms without interruption, please purchase more tokens or enable auto-reload.</p>
        <p>
          <a href="${BASE_URL}/dashboard/billing/packages" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Buy Tokens
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send auto-reload success notification
 */
export async function sendAutoReloadSuccessNotification({
  email,
  teamName,
  tokensAdded,
  amountCharged,
  newBalance,
}: {
  email: string;
  teamName: string;
  tokensAdded: number;
  amountCharged: number;
  newBalance: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Auto-Reload Successful - ${tokensAdded} Tokens Added`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Auto-Reload Successful</h2>
        <p>Hello,</p>
        <p>Your auto-reload has been successfully processed for team <strong>${teamName}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Tokens Added</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${tokensAdded}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Amount Charged</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">$${(amountCharged / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>New Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${newBalance} tokens</td>
          </tr>
        </table>
        <p>
          <a href="${BASE_URL}/dashboard/billing/settings" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Manage Settings
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send auto-reload failure notification
 */
export async function sendAutoReloadFailureNotification({
  email,
  teamName,
  currentBalance,
  errorMessage,
}: {
  email: string;
  teamName: string;
  currentBalance: number;
  errorMessage?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Auto-Reload Failed - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Auto-Reload Failed</h2>
        <p>Hello,</p>
        <p>We were unable to process your auto-reload for team <strong>${teamName}</strong>.</p>
        <p>This may be due to:</p>
        <ul>
          <li>Expired or invalid payment method</li>
          <li>Insufficient funds</li>
          <li>Card declined by issuer</li>
        </ul>
        <p>Your current balance: <strong>${currentBalance} tokens</strong></p>
        ${errorMessage ? `<p style="color: #6b7280;"><em>Error details: ${errorMessage}</em></p>` : ''}
        <p>Please update your payment method or purchase tokens manually to continue using our service.</p>
        <p>
          <a href="${BASE_URL}/dashboard/billing/packages" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Buy Tokens
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}

/**
 * Send token purchase confirmation
 */
export async function sendPurchaseConfirmation({
  email,
  teamName,
  tokensAdded,
  amountPaid,
  newBalance,
}: {
  email: string;
  teamName: string;
  tokensAdded: number;
  amountPaid: number;
  newBalance: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Purchase Confirmed - ${tokensAdded} Tokens Added`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Token Purchase Confirmed</h2>
        <p>Hello,</p>
        <p>Thank you for your purchase! Here's your receipt:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Team</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${teamName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Tokens Purchased</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${tokensAdded}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Amount Paid</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">$${(amountPaid / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>New Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${newBalance} tokens</td>
          </tr>
        </table>
        <p>Your tokens are ready to use immediately.</p>
        <p>
          <a href="${BASE_URL}/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
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
          <a href="${BASE_URL}/portal" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Case Details
          </a>
        </p>
        <p>Best regards,<br>The EZMig Team</p>
      </div>
    `,
  });
}
