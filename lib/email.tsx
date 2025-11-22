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

// Use sendOrderConfirmationEmail instead for new cart-based system
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

export async function sendOrderConfirmationEmail({
  email,
  userName,
  orderId,
  orderItems,
  totalAmount,
  currency,
}: {
  email: string
  userName: string
  orderId: string
  orderItems: Array<{
    item_type: string
    event_label?: string
    participant_type_label?: string
    hotel_room_type?: string
    check_in_date?: string
    check_out_date?: string
    nights?: number
    unit_price: number
  }>
  totalAmount: number
  currency: string
}) {
  try {
    const itemsHtml = orderItems
      .map((item) => {
        let itemName = ""
        const itemType = item.item_type.replace("_", " ").toUpperCase()

        if (item.item_type === "workshop" || item.item_type === "symposium") {
          const eventName = item.event_label || `${itemType}`
          const participantType = item.participant_type_label || "General Participant"
          itemName = `${eventName} - ${participantType}`
        } else if (item.item_type === "hotel") {
          const roomType = item.hotel_room_type || "Standard Room"
          const checkIn = item.check_in_date || "TBD"
          const checkOut = item.check_out_date || "TBD"
          const nights = item.nights || 1
          itemName = `Hotel: ${roomType} (${checkIn} to ${checkOut}, ${nights} night${nights > 1 ? "s" : ""})`
        } else if (item.item_type === "cpd_course") {
          itemName = item.event_label || "CPD Course"
        } else {
          // Fallback for any other item types
          itemName = item.event_label || itemType
          if (item.participant_type_label) {
            itemName += ` - ${item.participant_type_label}`
          }
        }

        return `
          <div style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 3px solid #00A9E0; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1a202c; margin-bottom: 4px;">${itemName}</div>
                <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 500;">
                  ${itemType}
                </div>
              </div>
              <div style="text-align: right; font-weight: 600; color: #00A9E0; white-space: nowrap; margin-left: 15px;">
                ${currency} ${item.unit_price.toLocaleString()}
              </div>
            </div>
          </div>
        `
      })
      .join("")

    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: "Order Confirmation - ISAPM 2026",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00A9E0 0%, #0088B8 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
              .order-info { background: #f7fafc; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
              .order-info-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .order-info-label { color: #64748b; font-size: 14px; }
              .order-info-value { font-weight: 600; color: #1e293b; }
              .alert { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 25px 0; border-radius: 4px; }
              .alert-title { font-weight: 600; color: #1e40af; margin-bottom: 8px; }
              .alert-text { color: #1e40af; font-size: 14px; line-height: 1.6; }
              .items-section { margin: 30px 0; }
              .items-title { font-size: 18px; font-weight: 600; color: #1a202c; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
              .total-section { margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border: 2px solid #00A9E0; }
              .total-row { display: flex; justify-content: space-between; align-items: center; }
              .total-label { font-size: 18px; font-weight: 600; color: #1a202c; }
              .total-amount { font-size: 24px; font-weight: 700; color: #00A9E0; }
              .bank-details { background: #fff7ed; border: 2px solid #fb923c; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .bank-details-title { font-weight: 700; color: #9a3412; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; }
              .bank-info { background: white; padding: 15px; border-radius: 6px; margin-top: 10px; }
              .bank-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fed7aa; }
              .bank-row:last-child { border-bottom: none; }
              .bank-label { color: #78350f; font-weight: 500; font-size: 14px; }
              .bank-value { color: #1a202c; font-weight: 700; font-size: 14px; font-family: monospace; }
              .button { display: inline-block; background: linear-gradient(135deg, #EF3340 0%, #d92532 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-align: center; box-shadow: 0 4px 6px rgba(239, 51, 64, 0.2); }
              .button:hover { box-shadow: 0 6px 8px rgba(239, 51, 64, 0.3); }
              .steps { margin: 25px 0; }
              .step { padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 3px solid #00A9E0; border-radius: 4px; }
              .step-number { display: inline-block; width: 24px; height: 24px; background: #00A9E0; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 600; font-size: 12px; margin-right: 10px; }
              .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
              .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Order Confirmed!</h1>
                <p>Thank you for your order</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1a202c; margin-top: 0;">Dear ${userName},</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.7;">
                  Thank you for your order! We've successfully received your order and it's now awaiting payment verification.
                </p>

                <div class="order-info">
                  <div class="order-info-row">
                    <span class="order-info-label">Order ID</span>
                    <span class="order-info-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                  </div>
                  <div class="order-info-row" style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px;">
                    <span class="order-info-label">Order Date</span>
                    <span class="order-info-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div class="order-info-row">
                    <span class="order-info-label">Number of Items</span>
                    <span class="order-info-value">${orderItems.length} item${orderItems.length > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div class="alert">
                  <div class="alert-title">⚠️ Action Required</div>
                  <div class="alert-text">
                    Please submit your payment proof to complete your order. Click the button below to upload your payment confirmation.
                  </div>
                </div>

                <div class="items-section">
                  <div class="items-title">Order Items</div>
                  ${itemsHtml}
                </div>

                <div class="total-section">
                  <div class="total-row">
                    <span class="total-label">Total Amount</span>
                    <span class="total-amount">${currency} ${totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div class="steps">
                  <div style="font-size: 18px; font-weight: 600; color: #1a202c; margin-bottom: 15px;">Next Steps:</div>
                  
                  <div class="step">
                    <span class="step-number">1</span>
                    <strong>Make Payment:</strong> Transfer the total amount to our bank account
                  </div>

                  <!-- Added bank account details section -->
                  <div class="bank-details">
                    <div class="bank-details-title">
                      <span style="margin-right: 8px;">🏦</span> Bank Account Details
                    </div>
                    <div class="bank-info">
                      <div class="bank-row">
                        <span class="bank-label">Bank Name</span>
                        <span class="bank-value">Bank Syariah Indonesia (BSI)</span>
                      </div>
                      <div class="bank-row">
                        <span class="bank-label">Account Number</span>
                        <span class="bank-value">7207681363</span>
                      </div>
                      <div class="bank-row">
                        <span class="bank-label">Account Name</span>
                        <span class="bank-value">PT Tombo Farma Indonesia</span>
                      </div>
                      <div class="bank-row">
                        <span class="bank-label">Amount to Transfer</span>
                        <span class="bank-value" style="color: #00A9E0; font-size: 16px;">${currency} ${totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: #9a3412; font-style: italic;">
                      💡 Tip: Please transfer the exact amount to help us verify your payment quickly
                    </p>
                  </div>

                  <div class="step">
                    <span class="step-number">2</span>
                    <strong>Upload Proof:</strong> Submit a clear photo of your payment receipt
                  </div>
                  <div class="step">
                    <span class="step-number">3</span>
                    <strong>Wait for Verification:</strong> Our team will verify your payment within 1-2 business days
                  </div>
                  <div class="step">
                    <span class="step-number">4</span>
                    <strong>Get Confirmation:</strong> You'll receive a confirmation email once verified
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-purchases" class="button">Submit Payment Proof</a>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  Need help? Contact us at <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none;">admin@isapm2026.org</a> 
                  or via WhatsApp at <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none;">+6289602626709</a>
                </p>
              </div>
              <div class="footer">
                <div class="footer-brand">ISAPM 2026 National Meeting</div>
                <div>The Indonesian Society of Anesthesiology for Pain Management</div>
                <div style="margin-top: 12px;">
                  <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Email</a> •
                  <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">WhatsApp</a> •
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Website</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending order confirmation email:", error)
    return { success: false, error }
  }
}

export async function sendPaymentVerificationEmail({
  email,
  userName,
  status,
  rejectionReason,
  orderId,
  orderItems,
  totalAmount,
  currency,
}: {
  email: string
  userName: string
  status: "verified" | "rejected"
  rejectionReason?: string
  orderId: string
  orderItems?: Array<{
    item_type: string
    event_label?: string
    participant_type_label?: string
    hotel_room_type?: string
  }>
  totalAmount: number
  currency: string
}) {
  const isVerified = status === "verified"

  // Format order items summary for verified emails
  let itemsSummary = ""
  if (isVerified && orderItems && orderItems.length > 0) {
    itemsSummary = orderItems
      .map((item) => {
        if (item.item_type === "workshop" || item.item_type === "symposium") {
          return `<li>${item.event_label} - ${item.participant_type_label}</li>`
        } else if (item.item_type === "hotel") {
          return `<li>Hotel: ${item.hotel_room_type}</li>`
        } else if (item.item_type === "cpd_course") {
          return `<li>CPD Course: ${item.event_label}</li>`
        }
        return ""
      })
      .join("")
  }

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
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${isVerified ? "linear-gradient(135deg, #00A9E0 0%, #0088B8 100%)" : "linear-gradient(135deg, #EF3340 0%, #d92532 100%)"}; color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
              .alert { background: ${isVerified ? "#d1fae5" : "#fee2e2"}; border-left: 4px solid ${isVerified ? "#10b981" : "#ef4444"}; padding: 20px; margin: 25px 0; border-radius: 4px; }
              .alert-icon { font-size: 24px; margin-bottom: 10px; }
              .alert-title { font-weight: 700; color: ${isVerified ? "#065f46" : "#991b1b"}; margin-bottom: 8px; font-size: 16px; }
              .alert-text { color: ${isVerified ? "#064e3b" : "#7f1d1d"}; font-size: 14px; line-height: 1.6; }
              .details { background: #f7fafc; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
              .details-title { font-size: 16px; font-weight: 600; color: #1a202c; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
              .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .details-row:last-child { border-bottom: none; }
              .details-label { color: #64748b; font-size: 14px; }
              .details-value { font-weight: 600; color: #1e293b; text-align: right; }
              .button { display: inline-block; background: linear-gradient(135deg, #EF3340 0%, #d92532 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-align: center; box-shadow: 0 4px 6px rgba(239, 51, 64, 0.2); }
              .items-list { margin: 15px 0; padding-left: 20px; }
              .items-list li { margin: 8px 0; color: #475569; }
              .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
              .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${isVerified ? "✓ Payment Verified" : "✗ Payment Rejected"}</h1>
                <p>${isVerified ? "Your order is now complete" : "Action required on your payment"}</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1a202c; margin-top: 0;">Dear ${userName},</p>
                
                ${
                  isVerified
                    ? `
                  <div class="alert">
                    <div class="alert-icon">🎉</div>
                    <div class="alert-title">Payment Successfully Verified!</div>
                    <div class="alert-text">
                      Your payment has been verified by our admin team. Your registration is now complete and confirmed.
                    </div>
                  </div>
                  
                  <div class="details">
                    <div class="details-title">Order Summary</div>
                    <div class="details-row">
                      <span class="details-label">Order ID</span>
                      <span class="details-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Total Paid</span>
                      <span class="details-value" style="color: #00A9E0; font-size: 18px;">${currency} ${totalAmount.toLocaleString()}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Payment Status</span>
                      <span class="details-value" style="color: #10b981;">✓ Verified</span>
                    </div>
                  </div>
                  
                  ${
                    itemsSummary
                      ? `
                    <div style="margin: 25px 0;">
                      <h3 style="font-size: 16px; color: #1a202c; margin-bottom: 10px;">Your Items:</h3>
                      <ul class="items-list">
                        ${itemsSummary}
                      </ul>
                    </div>
                  `
                      : ""
                  }
                  
                  <div style="background: #f0f9ff; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #00A9E0;">
                    <h3 style="font-size: 16px; color: #0369a1; margin-top: 0;">What's Next?</h3>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #0c4a6e;">
                      <li style="margin: 8px 0;">Access your verified bookings in your dashboard</li>
                      <li style="margin: 8px 0;">Download your conference materials and badges</li>
                      <li style="margin: 8px 0;">Check your email for additional event information</li>
                      <li style="margin: 8px 0;">Join us on April 16-18, 2026!</li>
                    </ul>
                  </div>

                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>
                  </div>

                  <p style="font-size: 15px; color: #475569; margin-top: 25px;">
                    We look forward to seeing you at ISAPM 2026! If you have any questions, feel free to reach out.
                  </p>
                `
                    : `
                  <div class="alert">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-title">Payment Could Not Be Verified</div>
                    <div class="alert-text">
                      Unfortunately, we were unable to verify your payment at this time.
                    </div>
                  </div>
                  
                  <div class="details">
                    <div class="details-title">Order Information</div>
                    <div class="details-row">
                      <span class="details-label">Order ID</span>
                      <span class="details-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Expected Amount</span>
                      <span class="details-value">${currency} ${totalAmount.toLocaleString()}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Payment Status</span>
                      <span class="details-value" style="color: #ef4444;">✗ Rejected</span>
                    </div>
                  </div>
                  
                  ${
                    rejectionReason
                      ? `
                    <div style="background: #fef2f2; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
                      <h3 style="font-size: 16px; color: #991b1b; margin-top: 0;">Reason for Rejection:</h3>
                      <p style="color: #7f1d1d; margin: 0;">${rejectionReason}</p>
                    </div>
                  `
                      : ""
                  }
                  
                  <div style="background: #fffbeb; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <h3 style="font-size: 16px; color: #92400e; margin-top: 0;">Next Steps:</h3>
                    <ol style="margin: 10px 0; padding-left: 20px; color: #78350f;">
                      <li style="margin: 8px 0;">Verify your payment details and amount</li>
                      <li style="margin: 8px 0;">Upload a clear, readable photo of your payment receipt</li>
                      <li style="margin: 8px 0;">Ensure the payment matches the order amount</li>
                      <li style="margin: 8px 0;">Contact us if you need assistance</li>
                    </ol>
                  </div>

                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-purchases" class="button">Resubmit Payment Proof</a>
                  </div>

                  <p style="font-size: 14px; color: #64748b; margin-top: 25px;">
                    If you believe this is an error or need help, please contact our support team.
                  </p>
                `
                }
                
                <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  Need assistance? Contact us at <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none;">admin@isapm2026.org</a> 
                  or via WhatsApp at <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none;">+6289602626709</a>
                </p>
                
                <p style="font-size: 15px; color: #1a202c; margin-top: 25px;">
                  Best regards,<br>
                  <strong>ISAPM 2026 Team</strong>
                </p>
              </div>
              <div class="footer">
                <div class="footer-brand">ISAPM 2026 National Meeting</div>
                <div>The Indonesian Society of Anesthesiology for Pain Management</div>
                <div style="margin-top: 12px;">
                  <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Email</a> •
                  <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">WhatsApp</a> •
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Website</a>
                </div>
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
