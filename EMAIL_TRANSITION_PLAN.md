# Email Automation System Transition Plan
## From Old Registration System to Cart-Based Order System

---

## Executive Summary

This document outlines the comprehensive plan to transition ISAPM 2026's email automation from the legacy registration-based system to a modern cart-based order system. The transition ensures all user communications remain consistent while leveraging the new shopping cart architecture.

**Current State**: Emails tied to individual registration records  
**Target State**: Emails tied to unified orders containing multiple items from cart checkout

---

## 1. Current Email System Analysis

### 1.1 Existing Email Functions (lib/email.tsx)

| Function | Purpose | Trigger | Status |
|----------|---------|---------|--------|
| `sendWelcomeEmail` | Welcome new users | Account creation | ✅ Keep (not registration-related) |
| `sendRegistrationConfirmation` | Confirm single registration | Old registration flow | 🔄 Replace with order confirmation |
| `sendPaymentVerificationEmail` | Notify payment approval/rejection | Admin action | ✅ Keep (works with orders) |
| `sendContactFormEmail` | Contact form submissions | Contact form | ✅ Keep (independent) |
| `sendPosterSubmissionConfirmation` | Poster submission confirmation | Poster submit | ✅ Keep (independent) |
| `sendPosterReviewNotification` | Poster review result | Admin poster review | ✅ Keep (independent) |

### 1.2 Email System Dependencies

**Files to Review/Update**:
- `lib/email.tsx` - Core email functions
- `app/actions/checkout.ts` - Order creation (no email trigger currently)
- `app/actions/payment-validation.ts` - Payment approval/rejection (no email trigger currently)
- `app/api/send-registration-email/route.ts` - API endpoint to deprecate
- `EMAIL_SETUP.md` - Documentation to update

---

## 2. Gap Analysis

### 2.1 Missing Email Triggers

Currently, the cart-based checkout system **does NOT send any emails**:

1. **Order Confirmation Email** - After cart checkout ❌ Not implemented
2. **Payment Approval Email** - After admin verifies payment ❌ Not implemented
3. **Payment Rejection Email** - After admin rejects payment ❌ Not implemented
4. **Order Items Summary** - Multi-item order details ❌ Not in email templates

### 2.2 Deprecated Functions

Functions to remove/replace:
- `sendRegistrationConfirmation` - Designed for single registration, not multi-item orders
- API route `/api/send-registration-email` - No longer needed

---

## 3. New Email System Design

### 3.1 New Email Functions Required

#### A. Order Confirmation Email
**Function**: `sendOrderConfirmation`  
**Trigger**: Immediately after successful cart checkout  
**Recipient**: Customer who placed order  
**Content**:
- Order ID and date
- Complete list of order items (events, workshops, hotels)
- Individual item details:
  - Item type badge (color-coded)
  - Event name / hotel room type
  - Participant type / check-in dates
  - Individual prices
- Order total amount
- Payment instructions
- Link to upload payment proof
- Link to view order details

**Template Design**:
\`\`\`html
Subject: Order Confirmation #[ORDER_ID] - ISAPM 2026

[HEADER: ISAPM 2026 Logo + "Order Confirmed"]

Dear [Customer Name],

Thank you for your order! We've received your registration and hotel booking for ISAPM 2026.

[ORDER SUMMARY BOX]
Order ID: #cb270197
Order Date: November 22, 2025
Status: Awaiting Payment Proof

[ORDER ITEMS SECTION]
📋 Your Order Items:

[WORKSHOP BADGE - Cyan]
WS 3 (Pediatric Essential Pain Management (EPM Lite) + TOT)
Participant Type: Resident
Price: IDR 1,500,000

[WORKSHOP BADGE - Cyan]
WS 4 (Adjunct Therapy for Pain Management)
Participant Type: Resident
Price: IDR 1,500,000

[SYMPOSIUM BADGE - Purple]
Symposium
Participant Type: Resident
Price: IDR 1,500,000

[HOTEL BADGE - Orange]
Hotel: premier
Check-in: April 16, 2026
Check-out: April 18, 2026 (2 nights)
Price: IDR 1,350,000

[TOTAL BOX]
Total Amount: IDR 5,850,000

[PAYMENT INSTRUCTIONS BOX]
Next Steps - Complete Your Payment:

1. Transfer the total amount to our bank account:
   Bank: [Bank Name]
   Account Number: [Account Number]
   Account Name: ISAPM 2026

2. Upload your payment proof:
   [Upload Payment Proof Button]

3. Wait for verification (usually within 24 hours)

[VIEW ORDER BUTTON]

Questions? Contact us at admin@isapm2026.org

[FOOTER]
\`\`\`

#### B. Payment Approved Email
**Function**: `sendPaymentApprovedEmail`  
**Trigger**: When admin clicks "Approve" on payment validation page  
**Recipient**: Customer whose payment was approved  
**Content**:
- Payment verified confirmation
- Order status updated to "Paid"
- All order items confirmed
- Access instructions for conference/events
- Receipt/invoice attached (optional future enhancement)
- Next steps (event check-in, hotel confirmation, etc.)

#### C. Payment Rejected Email
**Function**: `sendPaymentRejectedEmail`  
**Trigger**: When admin clicks "Reject" on payment validation page  
**Recipient**: Customer whose payment was rejected  
**Content**:
- Payment rejection notice
- Clear explanation of rejection reason
- Instructions to resubmit correct payment proof
- Link to reupload payment proof
- Support contact information

### 3.2 Updated Email Functions

#### Modify: sendPaymentVerificationEmail
Currently exists but needs to be integrated into the admin actions:
- Already supports approved/rejected status
- Needs to be called from `app/actions/payment-validation.ts`
- Add order items details in email template

---

## 4. Implementation Plan

### Phase 1: Create New Email Functions (Week 1)

#### Step 1.1: Create Order Confirmation Email
\`\`\`typescript
// lib/email.tsx

export async function sendOrderConfirmation({
  email,
  customerName,
  orderId,
  orderDate,
  orderItems,
  totalAmount,
  currency,
}: {
  email: string
  customerName: string
  orderId: string
  orderDate: string
  orderItems: Array<{
    itemType: 'workshop' | 'symposium' | 'hotel' | 'cpd_course'
    label: string
    participantType?: string
    roomType?: string
    checkIn?: string
    checkOut?: string
    nights?: number
    price: number
  }>
  totalAmount: number
  currency: string
}) {
  // Full HTML email template with order items
}
\`\`\`

#### Step 1.2: Create Payment Status Emails
\`\`\`typescript
export async function sendPaymentApprovedEmail({
  email,
  customerName,
  orderId,
  orderItems,
  totalAmount,
  currency,
  approvedDate,
})

export async function sendPaymentRejectedEmail({
  email,
  customerName,
  orderId,
  rejectionReason,
  resubmitLink,
})
\`\`\`

### Phase 2: Integrate Email Triggers (Week 1-2)

#### Step 2.1: Add Order Confirmation to Checkout
\`\`\`typescript
// app/actions/checkout.ts

export async function createOrderFromCart(guestInfo) {
  
  // After successful order creation
  if (order) {
    // Send order confirmation email
    await sendOrderConfirmation({
      email: guestInfo.email,
      customerName: guestInfo.full_name,
      orderId: order.id,
      orderDate: order.created_at,
      orderItems: orderItemsData.map(item => ({
        itemType: item.item_type,
        label: item.event_label || item.hotel_room_type,
        participantType: item.participant_type_label,
        roomType: item.hotel_room_type,
        checkIn: item.check_in_date,
        checkOut: item.check_out_date,
        nights: item.nights,
        price: item.unit_price,
      })),
      totalAmount: totalAmount,
      currency: currency,
    })
  }
  
  return { data: order }
}
\`\`\`

#### Step 2.2: Add Payment Emails to Validation Actions
\`\`\`typescript
// app/actions/payment-validation.ts

export async function approvePayment(paymentId: string, orderId: string) {
  // ... existing approval logic ...
  
  if (success) {
    // Fetch order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()
    
    // Send approval email
    await sendPaymentApprovedEmail({
      email: order.email,
      customerName: order.full_name,
      orderId: order.id,
      orderItems: order.order_items,
      totalAmount: order.total_amount,
      currency: order.currency,
      approvedDate: new Date().toISOString(),
    })
  }
  
  return { success: true }
}

export async function rejectPayment(paymentId: string, rejectionReason: string) {
  // ... existing rejection logic ...
  
  if (success) {
    // Fetch order details
    const { data: payment } = await supabase
      .from('order_payments')
      .select('*, orders(*)')
      .eq('id', paymentId)
      .single()
    
    const order = payment.orders
    
    // Send rejection email
    await sendPaymentRejectedEmail({
      email: order.email,
      customerName: order.full_name,
      orderId: order.id,
      rejectionReason: rejectionReason,
      resubmitLink: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/order/${order.id}`,
    })
  }
  
  return { success: true }
}
\`\`\`

### Phase 3: Remove Deprecated Functions (Week 2)

#### Step 3.1: Delete Old Registration Email Function
- Remove `sendRegistrationConfirmation` from `lib/email.tsx`
- Remove API route `app/api/send-registration-email/route.ts`
- Search codebase for any calls to this function and update

#### Step 3.2: Update Documentation
- Update `EMAIL_SETUP.md` with new email functions
- Add examples of new email templates
- Document trigger points for each email

### Phase 4: Testing & Validation (Week 2)

#### Step 4.1: Unit Testing
\`\`\`typescript
// __tests__/email.test.ts

describe('Order Confirmation Email', () => {
  it('sends email with multiple order items', async () => {
    const result = await sendOrderConfirmation({
      email: 'test@example.com',
      customerName: 'Test User',
      orderId: 'test-order-123',
      orderDate: '2025-11-22',
      orderItems: [
        { itemType: 'workshop', label: 'WS 3', price: 1500000 },
        { itemType: 'hotel', label: 'premier', nights: 2, price: 1350000 },
      ],
      totalAmount: 2850000,
      currency: 'IDR',
    })
    
    expect(result.success).toBe(true)
  })
})
\`\`\`

#### Step 4.2: Integration Testing
1. Create test order through cart checkout
2. Verify order confirmation email received
3. Admin approves payment
4. Verify payment approved email received
5. Admin rejects different payment
6. Verify payment rejected email received

#### Step 4.3: Email Preview Testing
- Use `/admin/email-test` page
- Add dropdowns for different email types
- Preview rendered HTML for all email templates
- Test on multiple email clients (Gmail, Outlook, Apple Mail)

### Phase 5: Deployment (Week 3)

#### Step 5.1: Staging Deployment
1. Deploy to staging environment
2. Configure Resend API key
3. Test all email flows end-to-end
4. Verify email deliverability
5. Check spam folder rates

#### Step 5.2: Production Deployment
1. Backup existing email functions
2. Deploy new email system
3. Monitor email sending logs
4. Track email open rates
5. Gather user feedback

#### Step 5.3: Rollback Plan
If issues occur:
1. Revert to previous deployment
2. Disable new email triggers
3. Investigate issues in staging
4. Fix and re-deploy

---

## 5. Data Migration & Integration

### 5.1 Database Schema Verification

**Existing Tables Used**:
- `orders` - Main order record
- `order_items` - Individual items in order
- `order_payments` - Payment proof submissions
- `profiles` - User information

**No schema changes required** - All necessary data already exists.

### 5.2 Email Template Data Mapping

| Old System Field | New System Field | Source Table |
|------------------|------------------|--------------|
| registrationId | orderId | orders.id |
| registrationType | orderItems[].event_label | order_items.event_label |
| amount | totalAmount | orders.total_amount |
| single item | multiple orderItems | order_items (array) |

### 5.3 Backward Compatibility

**No old registrations to migrate** - System already uses cart-based orders.

---

## 6. Email Template Design Standards

### 6.1 Visual Guidelines

**Brand Colors**:
- Primary: `#00A9E0` (Cyan) - Header background
- Accent: `#EF3340` (Red) - CTA buttons
- Success: `#10B981` (Green) - Approved status
- Warning: `#F59E0B` (Orange) - Pending status
- Error: `#EF4444` (Red) - Rejected status

**Item Type Badges**:
- Workshop: Cyan background (`bg-cyan-500`)
- Symposium: Purple background (`bg-purple-500`)
- Hotel: Orange background (`bg-orange-500`)
- CPD Course: Blue background (`bg-blue-500`)

**Typography**:
- Headings: Arial, bold, 24-32px
- Body: Arial, regular, 16px
- Line height: 1.6

### 6.2 Responsive Design

- Max width: 600px
- Mobile-friendly buttons (min 44px height)
- Scalable images
- Single column layout on mobile

### 6.3 Accessibility

- Alt text for all images
- Sufficient color contrast (WCAG AA)
- Semantic HTML structure
- Text-only fallback for rich HTML

---

## 7. Testing Procedures

### 7.1 Functional Testing Checklist

- [ ] Order confirmation sent after checkout
- [ ] Email contains all order items
- [ ] Email shows correct prices and totals
- [ ] Payment proof upload link works
- [ ] View order button navigates correctly
- [ ] Payment approved email sent on approval
- [ ] Payment rejected email sent on rejection
- [ ] Rejection reason included in email
- [ ] Resubmit link works correctly
- [ ] All emails have proper branding

### 7.2 Email Deliverability Testing

- [ ] Test with Gmail
- [ ] Test with Outlook
- [ ] Test with Apple Mail
- [ ] Check spam folder placement
- [ ] Verify SPF/DKIM records
- [ ] Test unsubscribe link (if applicable)

### 7.3 Performance Testing

- [ ] Email sent within 5 seconds of order creation
- [ ] No duplicate emails sent
- [ ] Failed emails retry automatically
- [ ] Error logs captured for debugging

---

## 8. Monitoring & Analytics

### 8.1 Metrics to Track

**Email Metrics**:
- Total emails sent per type
- Delivery success rate
- Open rate
- Click-through rate (payment upload link)
- Bounce rate
- Spam complaint rate

**Business Metrics**:
- Orders with payment proof uploaded (after email)
- Time from order to payment proof upload
- Payment approval rate after email notification
- User support tickets related to emails

### 8.2 Logging Strategy

\`\`\`typescript
// Log all email sends
console.log('[Email] Sending order confirmation', {
  orderId,
  email,
  itemCount: orderItems.length,
  timestamp: new Date().toISOString(),
})

// Log email failures
console.error('[Email] Failed to send order confirmation', {
  orderId,
  email,
  error: error.message,
  timestamp: new Date().toISOString(),
})
\`\`\`

### 8.3 Alerts

Set up alerts for:
- Email delivery failures > 5% in 1 hour
- No emails sent in last hour (potential system issue)
- Resend API quota exceeded

---

## 9. Documentation Updates

### 9.1 Files to Update

1. **EMAIL_SETUP.md**
   - Remove old registration email references
   - Add new order confirmation documentation
   - Add payment approval/rejection email docs
   - Update testing instructions

2. **README.md**
   - Update email system overview
   - List all current email types
   - Link to email testing page

3. **SHOPPING_CART_INTEGRATION_PLAN.md**
   - Mark email integration as complete
   - Update email triggers section
   - Add links to implemented functions

### 9.2 Developer Documentation

Create new file: `docs/EMAIL_SYSTEM.md`
\`\`\`markdown
# Email System Documentation

## Overview
Automated email notifications for ISAPM 2026 cart-based order system.

## Email Functions

### sendOrderConfirmation
Sent after cart checkout completes...

### sendPaymentApprovedEmail
Sent when admin approves payment proof...

### sendPaymentRejectedEmail
Sent when admin rejects payment proof...

## Testing
Use `/admin/email-test` to preview emails...
\`\`\`

---

## 10. Risk Assessment & Mitigation

### 10.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Email delivery failures | High | Low | Implement retry logic, monitor Resend status |
| Duplicate emails sent | Medium | Medium | Add idempotency checks, log sent emails |
| Wrong order details in email | High | Low | Validate data before sending, add tests |
| Email ends up in spam | Medium | Medium | Configure SPF/DKIM, monitor deliverability |
| Resend API quota exceeded | High | Low | Monitor usage, set up alerts, scale plan |
| Template rendering errors | Medium | Low | Test templates thoroughly, add error handling |

### 10.2 Rollback Procedures

**If critical email failure**:
1. Disable email triggers in code (feature flag)
2. Queue failed emails for manual retry
3. Deploy hotfix
4. Notify affected users via support channels
5. Re-enable email system after verification

---

## 11. Timeline & Milestones

| Week | Milestone | Deliverables | Owner |
|------|-----------|--------------|-------|
| Week 1 | Email Functions | New email templates created | Dev Team |
| Week 1-2 | Integration | Triggers added to actions | Dev Team |
| Week 2 | Cleanup | Old functions removed | Dev Team |
| Week 2 | Testing | All tests pass | QA Team |
| Week 3 | Deployment | Staged release | DevOps Team |
| Week 3 | Monitoring | Metrics tracked | Dev Team |

**Total Duration**: 3 weeks  
**Go-Live Date**: [To be determined]

---

## 12. Success Criteria

### 12.1 Technical Success

- ✅ All new email functions implemented and tested
- ✅ Order confirmation sent 100% of time after checkout
- ✅ Payment notification sent 100% of time after admin action
- ✅ Email delivery rate > 98%
- ✅ No duplicate emails sent
- ✅ Old registration email functions removed
- ✅ Zero critical bugs in production

### 12.2 User Experience Success

- ✅ Users receive clear order confirmation within 30 seconds
- ✅ Email templates render correctly on all major clients
- ✅ Payment instructions easy to understand
- ✅ Links in emails work correctly
- ✅ Users report improved communication clarity
- ✅ Reduced support tickets about order confirmation

### 12.3 Business Success

- ✅ 90%+ of users upload payment proof after receiving email
- ✅ Time to payment upload reduced by 30%
- ✅ Payment approval process streamlined
- ✅ Improved user satisfaction scores
- ✅ Admin time spent on payment queries reduced by 50%

---

## 13. Post-Launch Plan

### 13.1 Week 1 After Launch
- Monitor email delivery rates hourly
- Review user feedback and support tickets
- Fix any minor bugs or template issues
- Gather metrics on email opens and clicks

### 13.2 Month 1 After Launch
- Analyze email performance metrics
- Conduct user satisfaction survey
- Identify optimization opportunities
- Plan email template improvements

### 13.3 Ongoing Maintenance
- Monthly review of email metrics
- Quarterly template updates
- Annual deliverability audit
- Continuous A/B testing of email content

---

## 14. Appendix

### 14.1 Email Template Examples

**Order Confirmation Subject Lines**:
- ✅ "Order Confirmed #[ORDER_ID] - ISAPM 2026"
- ✅ "Thank You for Your Order - ISAPM 2026"
- ❌ "Registration Successful" (old, don't use)

**Payment Status Subject Lines**:
- ✅ "Payment Approved - Order #[ORDER_ID]"
- ✅ "Payment Verification Required - Order #[ORDER_ID]"

### 14.2 Useful Links

- Resend Dashboard: https://resend.com/dashboard
- Email Testing Tool: `/admin/email-test`
- Email Documentation: `EMAIL_SETUP.md`
- API Reference: `lib/email.tsx`

### 14.3 Contact Information

**Email System Owner**: Development Team  
**Support Contact**: admin@isapm2026.org  
**Emergency Contact**: [Phone number]

---

## Conclusion

This transition plan ensures a smooth migration from the old registration-based email system to the modern cart-based order email automation. By following this structured approach, we will:

1. **Eliminate deprecated functions** tied to old registration system
2. **Implement comprehensive order confirmation** for multi-item purchases
3. **Enhance payment communication** with clear approval/rejection emails
4. **Maintain consistency** in user communications
5. **Leverage cart system capabilities** for better user experience

The phased implementation approach minimizes risk while maximizing value delivery. With proper testing, monitoring, and rollback procedures in place, the transition will be seamless for both users and administrators.

**Status**: Ready for Implementation  
**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 3 weeks

---

**Document Version**: 1.0  
**Created**: January 2025  
**Last Updated**: January 2025  
**Maintained By**: ISAPM Development Team
