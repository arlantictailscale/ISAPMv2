import { Resend } from "resend"
import {
  generateInvoiceBase64,
  generateInvoiceNumber,
  type InvoiceData,
  type InvoiceItem,
  formatRupiah,
  formatDateIndonesian,
  formatTerbilang,
} from "@/lib/invoice/generate-invoice"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(toEmail: string, userName?: string) {
  try {
    const displayName = userName || toEmail.split("@")[0] || "User"

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
              .header { background: #00A9E0; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #EF3340; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              ul { padding-left: 20px; }
              li { margin: 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to ISAPM 2026!</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Dear ${displayName},</p>
                <p style="font-size: 16px;">Thank you for registering with ISAPM 2026. Your account has been successfully created!</p>
                <p style="font-size: 16px; font-weight: bold;">You can now:</p>
                <ul style="font-size: 15px;">
                  <li>Register for the conference</li>
                  <li>Submit poster abstracts</li>
                  <li>View the program schedule</li>
                  <li>Manage your profile</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard" class="button">Go to Dashboard</a>
                </p>
                <p style="font-size: 16px;">If you have any questions, feel free to contact us.</p>
                <p style="font-size: 16px;">Best regards,<br><strong>ISAPM 2026 Team</strong></p>
              </div>
              <div class="footer">
                <p><strong>The Indonesian Society of Anesthesiology for Pain Management</strong></p>
                <p>8th National Meeting - ISAPM 2026</p>
                <p>Email: admin@isapm2026.org | Phone: +6289602626709 (WhatsApp)</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log(`[v0] Welcome email sent successfully to ${toEmail}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error sending welcome email:", error)
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

        // Calculate correct item price (multiply by nights for hotels)
        const itemPrice = item.item_type === "hotel" && item.nights ? item.unit_price * item.nights : item.unit_price

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

        // Show price breakdown for multi-night hotel bookings
        const priceDisplay =
          item.item_type === "hotel" && item.nights && item.nights > 1
            ? `${currency} ${item.unit_price.toLocaleString()} × ${item.nights} nights = ${currency} ${itemPrice.toLocaleString()}`
            : `${currency} ${itemPrice.toLocaleString()}`

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
                ${priceDisplay}
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
              .alert-title { font-weight: 600; color: #1e40af; margin-bottom: 8px; font-size: 16px; }
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
  const rejectionComment = rejectionReason // Fix: Declare rejectionComment

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
              .button:hover { box-shadow: 0 6px 8px rgba(239, 51, 64, 0.3); }
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
                    rejectionComment
                      ? `
                    <div style="background: #fef2f2; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
                      <h3 style="font-size: 16px; color: #991b1b; margin-top: 0;">Reason for Rejection:</h3>
                      <p style="color: #7f1d1d; margin: 0;">${rejectionComment}</p>
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

export async function sendPaymentConfirmationWithInvoice({
  email,
  userName,
  orderId,
  orderItems,
  totalAmount,
  currency,
  customerInstitution,
  customerPhone,
  paymentVerifiedAt,
  invoiceNumber: providedInvoiceNumber,
  paymentMethod, // Add paymentMethod parameter
}: {
  email: string
  userName: string
  orderId: string
  orderItems: Array<{
    item_type: string
    event_label?: string
    participant_type_label?: string
    hotel_room_type?: string
    unit_price: number
    nights?: number
    check_in_date?: string
    check_out_date?: string
  }>
  totalAmount: number
  currency: string
  customerInstitution?: string
  customerPhone?: string
  paymentVerifiedAt: Date
  invoiceNumber?: string // Optional invoice number parameter
  paymentMethod?: string // Add paymentMethod type
}) {
  try {
    // Prepare invoice items
    const items: InvoiceItem[] = orderItems.map((item) => ({
      eventLabel: item.event_label || item.hotel_room_type || "Item",
      unitPrice: item.unit_price,
      quantity: 1,
      nights: item.nights || 1,
      itemType: item.item_type,
      participantTypeLabel: item.participant_type_label,
      hotelRoomType: item.hotel_room_type,
      checkInDate: item.check_in_date,
      checkOutDate: item.check_out_date,
    }))

    const invoiceNumber = providedInvoiceNumber || (await generateInvoiceNumber(orderId, paymentVerifiedAt))

    const paymentType = paymentMethod?.toLowerCase() === "sponsored" ? "sponsored" : "regular"
    const isSponsored = paymentType === "sponsored"

    const invoiceData: InvoiceData = {
      orderId,
      invoiceNumber,
      invoiceDate: paymentVerifiedAt,
      customerName: userName,
      customerEmail: email, // Added customerEmail
      customerPhone,
      customerInstitution,
      items,
      totalAmount,
      currency,
      paymentDate: paymentVerifiedAt,
      paymentType,
    }

    // Generate PDF invoice
    let pdfBase64: string | null = null
    try {
      pdfBase64 = await generateInvoiceBase64(invoiceData)
    } catch (pdfError) {
      console.error("[v0] Failed to generate PDF invoice:", pdfError)
      // Continue without PDF attachment
    }

    // Generate items HTML for email body
    const itemsHtml = orderItems
      .map((item, index) => {
        let itemName = ""
        if (item.item_type === "hotel") {
          itemName = `Hotel: ${item.hotel_room_type || "Room"}`
          if (item.nights && item.nights > 1) {
            itemName += ` (${item.nights} night${item.nights > 1 ? "s" : ""})`
          }
        } else {
          itemName = item.event_label || "Event Registration"
          if (item.participant_type_label) {
            itemName += ` - ${item.participant_type_label}`
          }
        }

        const itemTotal = item.unit_price * (item.nights || 1)

        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${itemName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatRupiah(item.unit_price)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatRupiah(itemTotal)}</td>
          </tr>
        `
      })
      .join("")

    // Items summary for quick overview
    const itemsSummary = orderItems
      .map((item) => {
        if (item.item_type === "workshop" || item.item_type === "symposium") {
          return `<li style="margin: 8px 0; color: #475569;">${item.event_label} - ${item.participant_type_label}</li>`
        } else if (item.item_type === "hotel") {
          return `<li style="margin: 8px 0; color: #475569;">Hotel: ${item.hotel_room_type}${item.nights ? ` (${item.nights} night${item.nights > 1 ? "s" : ""})` : ""}</li>`
        } else if (item.item_type === "cpd_course") {
          return `<li style="margin: 8px 0; color: #475569;">CPD Course: ${item.event_label}</li>`
        }
        return ""
      })
      .join("")

    const emailSubject = isSponsored
      ? `Registration Confirmed - ISAPM 2026 (${invoiceNumber})`
      : `Payment Confirmed & Invoice - ISAPM 2026 (${invoiceNumber})`

    const primaryColor = isSponsored ? "#8B5CF6" : "#00A9E0"
    const primaryColorDark = isSponsored ? "#7C3AED" : "#0088B8"

    const emailConfig: any = {
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorDark} 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
              .sponsor-badge { display: inline-flex; align-items: center; gap: 8px; background: #f3e8ff; color: #7c3aed; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; border: 2px solid #c4b5fd; }
              .alert { background: ${isSponsored ? "#f3e8ff" : "#d1fae5"}; border-left: 4px solid ${isSponsored ? "#8b5cf6" : "#10b981"}; padding: 20px; margin: 25px 0; border-radius: 4px; }
              .alert-icon { font-size: 24px; margin-bottom: 10px; }
              .alert-title { font-weight: 700; color: ${isSponsored ? "#6d28d9" : "#065f46"}; margin-bottom: 8px; font-size: 16px; }
              .alert-text { color: ${isSponsored ? "#5b21b6" : "#064e3b"}; font-size: 14px; line-height: 1.6; }
              .invoice-info { background: #f7fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
              .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .invoice-row:last-child { border-bottom: none; }
              .invoice-label { color: #64748b; font-size: 14px; }
              .invoice-value { font-weight: 600; color: #1e293b; }
              .section-title { font-size: 18px; font-weight: 600; color: #1a202c; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
              .items-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0; }
              .items-table th { padding: 12px; text-align: left; border-bottom: 2px solid ${primaryColor}; background: #f8f9fa; }
              .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
              .total-box { background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorDark} 100%); color: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
              .total-amount { font-size: 28px; font-weight: 700; margin: 10px 0; }
              .terbilang { font-style: italic; font-size: 12px; opacity: 0.9; }
              .info-box { background: #f0f9ff; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid ${primaryColor}; }
              .info-box h3 { font-size: 14px; color: ${isSponsored ? "#6d28d9" : "#0369a1"}; margin-top: 0; }
              .info-box ul { margin: 10px 0; padding-left: 20px; color: ${isSponsored ? "#5b21b6" : "#0c4a6e"}; }
              .info-box li { margin: 8px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, ${isSponsored ? "#8B5CF6 0%, #7C3AED" : "#EF3340 0%, #d92532"} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-align: center; box-shadow: 0 4px 6px rgba(${isSponsored ? "139, 92, 246" : "239, 51, 64"}, 0.2); }
              .button:hover { box-shadow: 0 6px 8px rgba(${isSponsored ? "139, 92, 246" : "239, 51, 64"}, 0.3); }
              .attachment-notice { background: #fef3c7; padding: 15px 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
              .attachment-notice p { margin: 0; font-size: 14px; color: #92400e; }
              .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
              .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${isSponsored ? "🎁 Registration Confirmed!" : "✓ Payment Confirmed!"}</h1>
                <p>${isSponsored ? "Your sponsored registration is complete" : "Thank you for your payment"}</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1a202c; margin-top: 0;">Dear ${userName},</p>
                
                ${isSponsored ? `<div class="sponsor-badge"><span>🎁</span><span>Sponsored Registration</span></div>` : ""}
                
                <div class="alert">
                  <div class="alert-icon">🎉</div>
                  <div class="alert-title">${isSponsored ? "Sponsored Registration Verified!" : "Payment Successfully Verified!"}</div>
                  <div class="alert-text">
                    ${
                      isSponsored
                        ? "Your sponsored registration has been verified and approved by our admin team. Your registration is now complete and confirmed. Please find your official registration certificate attached to this email."
                        : "Your payment has been verified by our admin team. Your registration is now complete and confirmed. Please find your official invoice/receipt attached to this email."
                    }
                  </div>
                </div>

                <div class="invoice-info">
                  <div class="invoice-row">
                    <span class="invoice-label">${isSponsored ? "Certificate Number" : "Invoice Number"}</span>
                    <span class="invoice-value" style="font-family: monospace;">${invoiceNumber}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">Order ID</span>
                    <span class="invoice-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">${isSponsored ? "Approval Date" : "Payment Date"}</span>
                    <span class="invoice-value">${formatDateIndonesian(paymentVerifiedAt)}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">Status</span>
                    <span class="invoice-value" style="color: #10b981;">✓ ${isSponsored ? "Approved" : "Verified"}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">Registration Type</span>
                    <span class="invoice-value" style="color: ${isSponsored ? "#7c3aed" : "#1e293b"};">${isSponsored ? "Sponsored" : "Regular"}</span>
                  </div>
                </div>

                ${
                  itemsSummary
                    ? `
                <div style="margin: 25px 0;">
                  <h3 style="font-size: 16px; color: #1a202c; margin-bottom: 10px;">Your Registered Items:</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${itemsSummary}
                  </ul>
                </div>
                `
                    : ""
                }

                <div class="section-title">${isSponsored ? "Registration Details" : "Invoice Details"}</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="text-align: center; width: 40px;">No</th>
                      <th>Description</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div class="total-box">
                  <div style="font-size: 14px; opacity: 0.9;">${isSponsored ? "Total Registration Value" : "Total Amount Paid"}</div>
                  <div class="total-amount">${formatRupiah(totalAmount)}</div>
                  <div class="terbilang">${formatTerbilang(totalAmount)}</div>
                </div>

                ${
                  pdfBase64
                    ? `
                <div class="attachment-notice">
                  <p>📎 <strong>Attachment:</strong> Your official ${isSponsored ? "registration certificate" : "invoice"} (PDF) is attached to this email.</p>
                </div>
                `
                    : ""
                }

                <div class="info-box">
                  <h3>What's Next?</h3>
                  <ul>
                    <li>Access your verified bookings in your dashboard</li>
                    <li>Download your conference materials and badges</li>
                    <li>Check your email for additional event information</li>
                    <li>Join us on April 16-18, 2026 at Harris Hotel Malang!</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-events" class="button">View My Events</a>
                </div>

                <p style="font-size: 15px; color: #475569; margin-top: 25px;">
                  We look forward to seeing you at ISAPM 2026! If you have any questions, feel free to reach out.
                </p>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  Need assistance? Contact us at <a href="mailto:admin@isapm2026.org" style="color: ${primaryColor}; text-decoration: none;">admin@isapm2026.org</a> 
                  or via WhatsApp at <a href="https://wa.me/6289602626709" style="color: ${primaryColor}; text-decoration: none;">+6289602626709</a>
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
                  <a href="mailto:admin@isapm2026.org" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px;">Email</a> •
                  <a href="https://wa.me/6289602626709" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px;">WhatsApp</a> •
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px;">Website</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    // Add PDF attachment if generated successfully
    if (pdfBase64) {
      emailConfig.attachments = [
        {
          filename: isSponsored
            ? `Sertifikat-Registrasi-ISAPM-2026-${invoiceNumber}.pdf`
            : `Kwitansi-ISAPM-2026-${invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ]
    }

    await resend.emails.send(emailConfig)

    console.log("[v0] Payment confirmation with invoice email sent to:", email)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error sending payment confirmation with invoice email:", error)
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

export async function sendSponsoredPaymentSubmittedEmail({
  email,
  userName,
  orderId,
  sponsorName,
  orderItems,
  totalAmount,
  currency,
}: {
  email: string
  userName: string
  orderId: string
  sponsorName: string
  orderItems: Array<{
    item_type: string
    event_label?: string
    participant_type_label?: string
    hotel_room_type?: string
    unit_price: number
    nights?: number
  }>
  totalAmount: number
  currency: string
}) {
  try {
    const itemsSummary = orderItems
      .map((item) => {
        if (item.item_type === "workshop" || item.item_type === "symposium") {
          return `<li style="margin: 8px 0; color: #475569;">${item.event_label} - ${item.participant_type_label}</li>`
        } else if (item.item_type === "hotel") {
          return `<li style="margin: 8px 0; color: #475569;">Hotel: ${item.hotel_room_type}${item.nights ? ` (${item.nights} night${item.nights > 1 ? "s" : ""})` : ""}</li>`
        } else if (item.item_type === "cpd_course") {
          return `<li style="margin: 8px 0; color: #475569;">CPD Course: ${item.event_label}</li>`
        }
        return ""
      })
      .join("")

    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: "Sponsored Registration Submitted - ISAPM 2026",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
              .sponsor-badge { display: inline-flex; align-items: center; gap: 8px; background: #f3e8ff; color: #7c3aed; padding: 12px 20px; border-radius: 24px; font-weight: 600; font-size: 14px; margin-bottom: 20px; border: 2px solid #c4b5fd; }
              .order-info { background: #f7fafc; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
              .order-info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .order-info-row:last-child { border-bottom: none; }
              .order-info-label { color: #64748b; font-size: 14px; }
              .order-info-value { font-weight: 600; color: #1e293b; }
              .sponsor-box { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 20px; margin: 25px 0; border-radius: 8px; border: 2px solid #c4b5fd; }
              .sponsor-label { font-size: 12px; color: #7c3aed; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
              .sponsor-name { font-size: 20px; font-weight: 700; color: #5b21b6; }
              .waiting-box { background: #fefce8; border: 2px solid #fbbf24; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center; }
              .waiting-icon { font-size: 48px; margin-bottom: 15px; }
              .waiting-title { font-size: 18px; font-weight: 700; color: #92400e; margin-bottom: 10px; }
              .waiting-text { font-size: 14px; color: #a16207; line-height: 1.6; }
              .total-section { margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; border: 2px solid #8b5cf6; }
              .total-row { display: flex; justify-content: space-between; align-items: center; }
              .total-label { font-size: 18px; font-weight: 600; color: #1a202c; }
              .total-amount { font-size: 24px; font-weight: 700; color: #7c3aed; }
              .info-box { background: #f0f9ff; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #00A9E0; }
              .info-box h3 { font-size: 14px; color: #0369a1; margin-top: 0; }
              .info-box ul { margin: 10px 0; padding-left: 20px; color: #0c4a6e; }
              .info-box li { margin: 8px 0; }
              .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
              .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎁 Sponsored Registration</h1>
                <p>Your registration has been submitted</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1a202c; margin-top: 0;">Dear ${userName},</p>
                
                <div class="sponsor-badge">
                  <span>🎁</span>
                  <span>Sponsored Registration</span>
                </div>

                <p style="font-size: 15px; color: #475569; line-height: 1.7;">
                  Thank you for submitting your sponsored registration. Your registration details have been received and are now pending verification by our admin team.
                </p>

                <div class="sponsor-box">
                  <div class="sponsor-label">Sponsored By</div>
                  <div class="sponsor-name">${sponsorName}</div>
                </div>

                <div class="order-info">
                  <div class="order-info-row">
                    <span class="order-info-label">Order ID</span>
                    <span class="order-info-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                  </div>
                  <div class="order-info-row">
                    <span class="order-info-label">Submission Date</span>
                    <span class="order-info-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div class="order-info-row">
                    <span class="order-info-label">Payment Type</span>
                    <span class="order-info-value" style="color: #7c3aed;">Sponsored</span>
                  </div>
                </div>

                ${
                  itemsSummary
                    ? `
                <div style="margin: 25px 0;">
                  <h3 style="font-size: 16px; color: #1a202c; margin-bottom: 10px;">Registration Items:</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${itemsSummary}
                  </ul>
                </div>
                `
                    : ""
                }

                <div class="total-section">
                  <div class="total-row">
                    <span class="total-label">Registration Value</span>
                    <span class="total-amount">${currency} ${totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div class="waiting-box">
                  <div class="waiting-icon">⏳</div>
                  <div class="waiting-title">Please Wait for Verification</div>
                  <div class="waiting-text">
                    Our admin team will verify your sponsored registration with your sponsor/benefactor. 
                    You will receive a confirmation email once your registration is approved.
                    This typically takes 1-2 business days.
                  </div>
                </div>

                <div class="info-box">
                  <h3>What Happens Next?</h3>
                  <ul>
                    <li>Our team will verify the sponsorship details</li>
                    <li>You will receive a confirmation email once approved</li>
                    <li>Your official registration certificate will be sent upon approval</li>
                    <li>No payment action is required from you</li>
                  </ul>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  Need assistance? Contact us at <a href="mailto:admin@isapm2026.org" style="color: #8b5cf6; text-decoration: none;">admin@isapm2026.org</a> 
                  or via WhatsApp at <a href="https://wa.me/6289602626709" style="color: #8b5cf6; text-decoration: none;">+6289602626709</a>
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
                  <a href="mailto:admin@isapm2026.org" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">Email</a> •
                  <a href="https://wa.me/6289602626709" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">WhatsApp</a> •
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #8b5cf6; text-decoration: none; margin: 0 10px;">Website</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending sponsored payment submitted email:", error)
    return { success: false, error }
  }
}
