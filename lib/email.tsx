import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(toEmail: string, userName: string) {
  try {
    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: toEmail,
      subject: "Welcome to ISAPM 2026!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00A9E0; color: white; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ISAPM 2026!</h1>
              </div>
              <div class="content">
                <p>Dear ${userName},</p>
                <p>Thank you for registering with ISAPM 2026. Your account has been successfully created!</p>
                <p>You can now:</p>
                <ul>
                  <li>Register for the conference</li>
                  <li>Submit poster abstracts</li>
                  <li>View the program schedule</li>
                  <li>Manage your profile</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>
                </p>
                <p>If you have any questions, feel free to contact us.</p>
                <p>Best regards,<br>ISAPM 2026 Team</p>
              </div>
              <div class="footer">
                <p>The Indonesian Society of Anesthesiology for Pain Management National Meeting</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}

export async function sendRegistrationConfirmation({
  email,
  firstName,
  lastName,
  registrationType,
  amount,
  currency,
  registrationId,
}: {
  email: string
  firstName: string
  lastName?: string
  registrationType: string
  amount: number
  currency: string
  registrationId: string
}) {
  const userName = lastName ? `${firstName} ${lastName}` : firstName

  try {
    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: "Registration Confirmation - ISAPM 2026",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00A9E0; color: white; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #EF3340; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Registration Confirmed!</h1>
              </div>
              <div class="content">
                <p>Dear ${userName},</p>
                <p>Thank you for registering for ISAPM 2026. Your registration has been received.</p>
                
                <div class="details">
                  <h3>Registration Details:</h3>
                  <p><strong>Order ID:</strong> ${registrationId}</p>
                  <p><strong>Registration Type:</strong> ${registrationType}</p>
                  <p><strong>Total Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
                </div>

                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Complete payment using the payment instructions</li>
                  <li>Upload your payment proof</li>
                  <li>Wait for admin verification</li>
                </ol>

                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-purchases" class="button">View My Purchases</a>
                </p>

                <p>For any questions, please contact us at admin@isapm2026.org or +6289602626709 (WhatsApp).</p>
                
                <p>Best regards,<br>ISAPM 2026 Team</p>
              </div>
              <div class="footer">
                <p>The Indonesian Society of Anesthesiology for Pain Management National Meeting</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending registration confirmation:", error)
    return { success: false, error }
  }
}

export async function sendPaymentVerificationEmail({
  email,
  firstName,
  lastName,
  status,
  rejectionReason,
  registrationType,
  amount,
  currency,
}: {
  email: string
  firstName: string
  lastName?: string
  status: "verified" | "rejected"
  rejectionReason?: string
  registrationType?: string
  amount?: number
  currency?: string
}) {
  const userName = lastName ? `${firstName} ${lastName}` : firstName
  const isVerified = status === "verified"

  try {
    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: `Payment ${isVerified ? "Verified" : "Rejected"} - ISAPM 2026`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${isVerified ? "#00A9E0" : "#EF3340"}; color: white; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .alert { background: ${isVerified ? "#d4edda" : "#f8d7da"}; border: 1px solid ${isVerified ? "#c3e6cb" : "#f5c6cb"}; color: ${isVerified ? "#155724" : "#721c24"}; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #00A9E0; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment ${isVerified ? "Verified" : "Rejected"}</h1>
              </div>
              <div class="content">
                <p>Dear ${userName},</p>
                
                ${
                  isVerified
                    ? `
                  <div class="alert">
                    <strong>✓ Payment Verified!</strong><br>
                    Your payment has been successfully verified by our admin team.
                  </div>
                  
                  ${
                    registrationType && amount && currency
                      ? `
                    <div class="details">
                      <h3>Payment Details:</h3>
                      <p><strong>Registration Type:</strong> ${registrationType}</p>
                      <p><strong>Amount Paid:</strong> ${currency} ${amount.toLocaleString()}</p>
                    </div>
                  `
                      : ""
                  }
                  
                  <p>Your registration is now complete! You can now:</p>
                  <ul>
                    <li>Download your conference badge</li>
                    <li>View the full conference program</li>
                    <li>Access all conference materials</li>
                  </ul>

                  <p style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>
                  </p>

                  <p>We look forward to seeing you at ISAPM 2026!</p>
                `
                    : `
                  <div class="alert">
                    <strong>✗ Payment Rejected</strong><br>
                    Unfortunately, your payment could not be verified.
                  </div>
                  
                  ${
                    registrationType && amount && currency
                      ? `
                    <div class="details">
                      <h3>Payment Details:</h3>
                      <p><strong>Registration Type:</strong> ${registrationType}</p>
                      <p><strong>Expected Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
                    </div>
                  `
                      : ""
                  }
                  
                  ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
                  
                  <p><strong>What to do next:</strong></p>
                  <ol>
                    <li>Check your payment details</li>
                    <li>Upload a clear photo of your payment proof</li>
                    <li>Contact us if you need assistance</li>
                  </ol>

                  <p style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-purchases" class="button">Update Payment Proof</a>
                  </p>
                `
                }
                
                <p>For any questions, please contact us at admin@isapm2026.org or +6289602626709 (WhatsApp).</p>
                
                <p>Best regards,<br>ISAPM 2026 Team</p>
              </div>
              <div class="footer">
                <p>The Indonesian Society of Anesthesiology for Pain Management National Meeting</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending payment verification email:", error)
    return { success: false, error }
  }
}

export async function sendContactFormEmail(formData: {
  name: string
  email: string
  subject: string
  message: string
}) {
  try {
    await resend.emails.send({
      from: "ISAPM 2026 Contact Form <noreply@isapm2026.org>",
      to: "admin@isapm2026.org",
      replyTo: formData.email,
      subject: `Contact Form: ${formData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00A9E0; color: white; padding: 20px; }
              .content { background: #f9f9f9; padding: 20px; }
              .field { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #EF3340; }
              .label { font-weight: bold; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div>${formData.name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div>${formData.email}</div>
                </div>
                <div class="field">
                  <div class="label">Subject:</div>
                  <div>${formData.subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div>${formData.message}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending contact form email:", error)
    return { success: false, error }
  }
}

export async function sendPosterSubmissionConfirmation({
  email,
  userName,
  posterTitle,
  topic,
}: {
  email: string
  userName: string
  posterTitle: string
  topic: string
}) {
  try {
    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: "E-Poster Submission Received - ISAPM 2026",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #00A9E0; color: white; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #EF3340; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>E-Poster Submitted!</h1>
              </div>
              <div class="content">
                <p>Dear ${userName},</p>
                <p>Thank you for submitting your e-poster to ISAPM 2026. We have successfully received your submission.</p>
                
                <div class="details">
                  <h3>Submission Details:</h3>
                  <p><strong>Title:</strong> ${posterTitle}</p>
                  <p><strong>Topic:</strong> ${topic}</p>
                  <p><strong>Status:</strong> Pending Review</p>
                </div>

                <p><strong>What happens next?</strong></p>
                <ol>
                  <li>Our scientific committee will review your submission</li>
                  <li>You will receive a notification once the review is complete</li>
                  <li>If accepted, you will receive further instructions</li>
                </ol>

                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-posters" class="button">View My Submissions</a>
                </p>

                <p>For any questions, please contact us at admin@isapm2026.org or +6289602626709 (WhatsApp).</p>
                
                <p>Best regards,<br>ISAPM 2026 Scientific Committee</p>
              </div>
              <div class="footer">
                <p>The Indonesian Society of Anesthesiology for Pain Management National Meeting</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending poster submission confirmation:", error)
    return { success: false, error }
  }
}

export async function sendPosterReviewNotification({
  email,
  userName,
  posterTitle,
  status,
  rejectionComment,
  canResubmit,
}: {
  email: string
  userName: string
  posterTitle: string
  status: "accepted" | "rejected"
  rejectionComment?: string
  canResubmit?: boolean
}) {
  const isAccepted = status === "accepted"

  try {
    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: `E-Poster ${isAccepted ? "Accepted" : "Rejected"} - ISAPM 2026`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${isAccepted ? "#00A9E0" : "#EF3340"}; color: white; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .alert { background: ${isAccepted ? "#d4edda" : "#f8d7da"}; border: 1px solid ${isAccepted ? "#c3e6cb" : "#f5c6cb"}; color: ${isAccepted ? "#155724" : "#721c24"}; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #00A9E0; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>E-Poster Review Complete</h1>
              </div>
              <div class="content">
                <p>Dear ${userName},</p>
                
                ${
                  isAccepted
                    ? `
                  <div class="alert">
                    <strong>✓ Congratulations!</strong><br>
                    Your e-poster has been accepted for presentation at ISAPM 2026.
                  </div>
                  
                  <div class="details">
                    <h3>Accepted Submission:</h3>
                    <p><strong>Title:</strong> ${posterTitle}</p>
                    <p><strong>Status:</strong> Accepted</p>
                  </div>
                  
                  <p><strong>Next Steps:</strong></p>
                  <ul>
                    <li>Your poster will be included in the conference program</li>
                    <li>You will receive presentation guidelines closer to the event</li>
                    <li>Make sure to complete your conference registration</li>
                  </ul>

                  <p style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-posters" class="button">View My Posters</a>
                  </p>

                  <p>We look forward to your presentation at ISAPM 2026!</p>
                `
                    : `
                  <div class="alert">
                    <strong>✗ Submission Not Accepted</strong><br>
                    After careful review, your e-poster submission was not accepted for this year's conference.
                  </div>
                  
                  <div class="details">
                    <h3>Submission Details:</h3>
                    <p><strong>Title:</strong> ${posterTitle}</p>
                    <p><strong>Status:</strong> Not Accepted</p>
                  </div>
                  
                  ${
                    rejectionComment
                      ? `
                    <div class="details">
                      <h3>Reviewer Feedback:</h3>
                      <p>${rejectionComment}</p>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    canResubmit
                      ? `
                    <p><strong>Good News:</strong> You are welcome to revise and resubmit your abstract based on the feedback provided.</p>
                    
                    <p style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-posters" class="button">Revise & Resubmit</a>
                    </p>
                  `
                      : `
                    <p>We encourage you to consider submitting to future ISAPM conferences.</p>
                  `
                  }
                `
                }
                
                <p>For any questions, please contact us at admin@isapm2026.org or +6289602626709 (WhatsApp).</p>
                
                <p>Best regards,<br>ISAPM 2026 Scientific Committee</p>
              </div>
              <div class="footer">
                <p>The Indonesian Society of Anesthesiology for Pain Management National Meeting</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending poster review notification:", error)
    return { success: false, error }
  }
}
