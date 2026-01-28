/**
 * Email Service
 *
 * This is a placeholder email service. To enable email notifications:
 * 1. Install an email provider (e.g., `npm install resend` or `npm install nodemailer`)
 * 2. Add your API key to .env (e.g., RESEND_API_KEY)
 * 3. Implement the sendEmail function below
 *
 * Example with Resend:
 * ```
 * import { Resend } from 'resend';
 * const resend = new Resend(process.env.RESEND_API_KEY);
 *
 * export async function sendEmail({ to, subject, html }) {
 *   await resend.emails.send({
 *     from: 'EZMig <noreply@yourdomain.com>',
 *     to,
 *     subject,
 *     html,
 *   });
 * }
 * ```
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email
 * Currently logs to console - implement with your preferred email provider
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  // TODO: Implement with actual email provider
  console.log('=== EMAIL (not sent - configure email provider) ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${html.substring(0, 200)}...`);
  console.log('=== END EMAIL ===');

  return true;
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
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Low Token Balance Alert - ${teamName}`,
    html: `
      <h2>Low Token Balance Alert</h2>
      <p>Hello,</p>
      <p>Your team <strong>${teamName}</strong> has a low token balance.</p>
      <ul>
        <li>Current Balance: <strong>${currentBalance} tokens</strong></li>
        <li>Alert Threshold: ${threshold} tokens</li>
      </ul>
      <p>To continue submitting forms without interruption, please purchase more tokens or enable auto-reload.</p>
      <p>
        <a href="${process.env.BASE_URL}/dashboard/billing/packages" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Buy Tokens
        </a>
      </p>
      <p>Best regards,<br>The EZMig Team</p>
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
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Auto-Reload Successful - ${tokensAdded} Tokens Added`,
    html: `
      <h2>Auto-Reload Successful</h2>
      <p>Hello,</p>
      <p>Your auto-reload has been successfully processed for team <strong>${teamName}</strong>.</p>
      <ul>
        <li>Tokens Added: <strong>${tokensAdded}</strong></li>
        <li>Amount Charged: <strong>$${(amountCharged / 100).toFixed(2)}</strong></li>
        <li>New Balance: <strong>${newBalance} tokens</strong></li>
      </ul>
      <p>You can manage your auto-reload settings in your dashboard.</p>
      <p>
        <a href="${process.env.BASE_URL}/dashboard/billing/settings" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Manage Settings
        </a>
      </p>
      <p>Best regards,<br>The EZMig Team</p>
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
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Auto-Reload Failed - Action Required`,
    html: `
      <h2>Auto-Reload Failed</h2>
      <p>Hello,</p>
      <p>We were unable to process your auto-reload for team <strong>${teamName}</strong>.</p>
      <p>This may be due to:</p>
      <ul>
        <li>Expired or invalid payment method</li>
        <li>Insufficient funds</li>
        <li>Card declined by issuer</li>
      </ul>
      <p>Your current balance: <strong>${currentBalance} tokens</strong></p>
      ${errorMessage ? `<p>Error details: ${errorMessage}</p>` : ''}
      <p>Please update your payment method or purchase tokens manually to continue using our service.</p>
      <p>
        <a href="${process.env.BASE_URL}/dashboard/billing/packages" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Buy Tokens
        </a>
      </p>
      <p>Best regards,<br>The EZMig Team</p>
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
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Purchase Confirmed - ${tokensAdded} Tokens Added`,
    html: `
      <h2>Token Purchase Confirmed</h2>
      <p>Hello,</p>
      <p>Thank you for your purchase! Here's your receipt:</p>
      <ul>
        <li>Team: <strong>${teamName}</strong></li>
        <li>Tokens Purchased: <strong>${tokensAdded}</strong></li>
        <li>Amount Paid: <strong>$${(amountPaid / 100).toFixed(2)}</strong></li>
        <li>New Balance: <strong>${newBalance} tokens</strong></li>
      </ul>
      <p>Your tokens are ready to use immediately.</p>
      <p>
        <a href="${process.env.BASE_URL}/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </p>
      <p>Best regards,<br>The EZMig Team</p>
    `,
  });
}
