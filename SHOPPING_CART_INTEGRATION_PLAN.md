# Shopping Cart Integration Plan
## ISAPM National Meeting 2026 - Payment System Rework

---

## Executive Summary

This plan outlines the integration of a comprehensive shopping cart system into the existing ISAPM payment infrastructure. The cart will allow users to add multiple items (event registrations, workshops, hotel bookings) before proceeding to a unified checkout, replacing the current one-item-at-a-time flow.

**Current State:** Users register for one event and immediately proceed to payment.
**Target State:** Users can browse and add multiple items to cart, review their selections, and complete payment in one transaction.

---

## 1. Database Architecture

### 1.1 Existing Tables (Already in Place ✅)

#### `carts` Table
- **id**: uuid (PK)
- **user_id**: uuid (FK to profiles)
- **status**: text (CHECK: 'active', 'completed', 'abandoned')
- **created_at**: timestamp
- **updated_at**: timestamp
- **RLS Policies**: ✅ Already configured

#### `cart_items` Table
- **id**: uuid (PK)
- **cart_id**: uuid (FK to carts)
- **item_type**: text ('event' or 'hotel')
- **event_id**: text (nullable)
- **event_label**: text (nullable)
- **participant_type_id**: text (nullable)
- **participant_type_label**: text (nullable)
- **hotel_room_type**: text (nullable)
- **check_in_date**: date (nullable)
- **check_out_date**: date (nullable)
- **nights**: integer (nullable)
- **unit_price**: numeric
- **currency**: text
- **created_at**: timestamp
- **RLS Policies**: ✅ Already configured

### 1.2 Required Schema Updates

No major schema changes needed. The existing cart tables are well-designed. Minor recommendations:

#### Add Index for Performance
```sql
CREATE INDEX idx_carts_user_status ON carts(user_id, status);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
```

#### Add Quantity Field (Optional Enhancement)
```sql
ALTER TABLE cart_items ADD COLUMN quantity INTEGER DEFAULT 1;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0);
```

---

## 2. User Flow Architecture

### 2.1 Current Flow
```
Browse Events → Select Event → Fill Form → Payment → Complete
```

### 2.2 New Cart Flow
```
Browse Events/Hotels 
  ↓
Add to Cart (multiple items)
  ↓
View Cart (review, edit, remove)
  ↓
Proceed to Checkout (unified form)
  ↓
Payment
  ↓
Complete
```

### 2.3 Detailed User Journey

#### Phase 1: Browse & Add
1. User visits `/register` or `/hotel-booking`
2. Selects event/workshop/hotel with preferences
3. Clicks "Add to Cart" (instead of immediate register)
4. Cart badge updates showing item count
5. User can continue browsing or proceed to cart

#### Phase 2: Cart Review
1. User clicks cart icon or "View Cart" button
2. Navigates to `/cart` page
3. Sees all items with:
   - Item name and type
   - Participant type / room type
   - Dates (for hotels)
   - Individual price
   - Remove button
4. Real-time total calculation displayed
5. Options:
   - Continue Shopping (return to browse)
   - Proceed to Checkout

#### Phase 3: Checkout
1. User clicks "Proceed to Checkout"
2. Navigates to `/checkout` page
3. Pre-filled form with profile data:
   - Full Name
   - Email
   - Phone
   - Institution
   - Position
4. Review order summary
5. Confirm and create order
6. Redirect to payment page

#### Phase 4: Payment
1. System creates single `order` record
2. Creates multiple `order_items` from cart
3. Clears/marks cart as completed
4. User proceeds with existing payment flow
5. Upload proof → Admin verification

---

## 3. Technical Implementation

### 3.1 Core Components to Build

#### A. Cart Context Provider (`lib/cart-context.tsx`)
```typescript
- useCart() hook
- addToCart(item)
- removeFromCart(itemId)
- updateCartItem(itemId, updates)
- clearCart()
- getCartTotal()
- getCartCount()
- Real-time sync with Supabase
```

#### B. Cart UI Components

**1. Cart Button/Badge (`components/cart-button.tsx`)**
- Floating cart icon in navigation
- Badge showing item count
- Opens cart drawer/page on click

**2. Cart Drawer/Page (`app/cart/page.tsx`)**
- List all cart items
- Remove item functionality
- Edit item (change participant type, dates)
- Running total
- Checkout button

**3. Mini Cart Preview (`components/mini-cart.tsx`)**
- Dropdown showing last 3 items
- Quick view without page navigation
- "View Full Cart" link

#### C. Modified Registration Flow

**1. Event Registration (`app/register/page.tsx`)**
- Replace "Complete Registration" button with "Add to Cart"
- Show success toast: "Added to cart"
- Add "Proceed to Checkout" link
- Keep validation logic

**2. Hotel Booking (`app/hotel-booking/page.tsx`)**
- Replace "Book Now" with "Add to Cart"
- Show success toast
- Add cart preview

#### D. New Checkout Flow

**1. Checkout Page (`app/checkout/page.tsx`)**
- Fetch cart items
- Display order summary
- Pre-fill user information
- Single "Confirm Order" action
- Creates order + order_items in transaction

**2. Cart API Routes (`app/api/cart/*`)**
- POST `/api/cart/add` - Add item to cart
- DELETE `/api/cart/remove` - Remove item
- PUT `/api/cart/update` - Update item
- GET `/api/cart` - Get user cart

---

## 4. Data Flow & State Management

### 4.1 Cart State Architecture

#### Client-Side State (React Context)
```typescript
interface CartState {
  items: CartItem[]
  totalAmount: number
  totalItems: number
  isLoading: boolean
  error: string | null
}

interface CartItem {
  id: string
  itemType: 'event' | 'hotel'
  label: string
  participantType?: string
  roomType?: string
  checkIn?: Date
  checkOut?: Date
  nights?: number
  unitPrice: number
  currency: string
}
```

#### Server-Side Sync
- Auto-save to Supabase on every change
- Real-time subscription for multi-device sync
- Optimistic updates with rollback on error

### 4.2 Cart Operations Flow

#### Adding Item
```
1. User clicks "Add to Cart"
2. Validate item data
3. Check for active cart (create if none)
4. Insert into cart_items table
5. Update local state
6. Show success notification
7. Update cart badge count
```

#### Checkout Process
```
1. User clicks "Proceed to Checkout"
2. Validate cart not empty
3. Validate user profile complete
4. Display checkout form
5. On confirm:
   a. Start Supabase transaction
   b. Create order record
   c. Create order_items from cart_items
   d. Mark cart as 'completed'
   e. Commit transaction
6. Redirect to payment page
```

---

## 5. Security Considerations

### 5.1 Row Level Security (RLS)

Already in place:
- ✅ Users can only access their own carts
- ✅ Users can only insert/update/delete own cart_items
- ✅ Orders and order_items protected

### 5.2 Additional Security Measures

#### Price Validation
```typescript
// CRITICAL: Always validate prices server-side
// Never trust client-submitted prices

// In checkout API:
const validateCartPrices = async (cartItems) => {
  for (const item of cartItems) {
    const actualPrice = await getActualPrice(item.eventId, item.participantTypeId)
    if (item.unitPrice !== actualPrice) {
      throw new Error('Price mismatch detected')
    }
  }
}
```

#### Duplicate Prevention
```typescript
// Prevent adding same item multiple times
// Check before insert:
const existingItem = await supabase
  .from('cart_items')
  .select('*')
  .eq('cart_id', cartId)
  .eq('event_id', newItem.eventId)
  .eq('participant_type_id', newItem.participantTypeId)
  .maybeSingle()

if (existingItem) {
  throw new Error('Item already in cart')
}
```

#### Cart Expiration
```typescript
// Automatically abandon carts after 7 days
// Run via cron job:
UPDATE carts
SET status = 'abandoned'
WHERE status = 'active'
AND updated_at < NOW() - INTERVAL '7 days'
```

---

## 6. Real-Time Features

### 6.1 Live Cart Updates

Implement Supabase real-time subscriptions:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('cart-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `cart_id=eq.${cartId}`,
      },
      (payload) => {
        handleCartUpdate(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [cartId])
```

### 6.2 Price Updates

If event prices change while items are in cart:
- Show warning to user
- Update prices automatically
- Highlight changed prices
- Allow user to review before checkout

---

## 7. UI/UX Design Specifications

### 7.1 Responsive Design Requirements

#### Mobile (< 768px)
- Sticky bottom cart button
- Full-screen cart drawer
- Simplified checkout form
- Touch-friendly remove buttons

#### Tablet (768px - 1024px)
- Right-side cart drawer
- Two-column checkout layout

#### Desktop (> 1024px)
- Right-side cart drawer (sticky)
- Multi-column checkout
- Enhanced cart preview on hover

### 7.2 Visual Components

#### Cart Badge
- Position: Top-right of cart icon
- Style: Red circle with white number
- Animation: Bounce when count increases

#### Cart Item Card
```
┌─────────────────────────────────────┐
│ [Icon] Event Name                  │
│        Participant Type             │
│        Date                        │
│                         Price [×]  │
└─────────────────────────────────────┘
```

#### Cart Total Section
```
┌─────────────────────────────────────┐
│ Subtotal:              IDR 5,000,000│
│ ─────────────────────────────────── │
│ Total:                 IDR 5,000,000│
│                                     │
│ [Proceed to Checkout Button]       │
└─────────────────────────────────────┘
```

### 7.3 Interactions & Feedback

#### Success States
- ✅ "Added to cart" toast notification
- ✅ Cart badge animates
- ✅ "View Cart" button appears briefly

#### Error States
- ❌ "Failed to add item" toast
- ❌ Show specific error message
- ❌ Retry button

#### Loading States
- Skeleton loaders for cart items
- Disabled buttons during operations
- Progress indicators for checkout

---

## 8. Performance Optimization

### 8.1 Caching Strategy

#### Client-Side Caching
- Cache cart in localStorage as backup
- Sync with server on reconnect
- Reduce unnecessary API calls

#### Server-Side Optimization
- Use database indexes (see section 1.2)
- Batch cart operations
- Pagination for large carts (if needed)

### 8.2 Lazy Loading

- Load cart data only when cart button clicked
- Prefetch on hover (desktop)
- Load images on demand

---

## 9. Migration Strategy

### 9.1 Phase 1: Build Cart System (Week 1-2)
1. Create cart context and provider
2. Build cart UI components
3. Implement cart operations
4. Add real-time sync
5. Testing

### 9.2 Phase 2: Update Registration Flow (Week 2-3)
1. Modify `/register` page to use cart
2. Modify `/hotel-booking` to use cart
3. Add cart navigation elements
4. Update existing flows

### 9.3 Phase 3: Build Checkout (Week 3-4)
1. Create checkout page
2. Implement order creation
3. Connect to payment flow
4. End-to-end testing

### 9.4 Phase 4: Launch & Monitor (Week 4-5)
1. Deploy to staging
2. User acceptance testing
3. Fix bugs
4. Deploy to production
5. Monitor analytics

### 9.5 Backward Compatibility

**Important:** Maintain existing direct-purchase flow as fallback:
- Keep `/register` → direct payment option
- Add "Buy Now" alongside "Add to Cart"
- Support both flows during transition

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Cart operations (add, remove, update)
- Price calculations
- Validation functions

### 10.2 Integration Tests
- Cart-to-checkout flow
- Order creation from cart
- Payment integration
- Email notifications

### 10.3 E2E Tests (Playwright)
```typescript
test('Complete cart checkout flow', async ({ page }) => {
  // 1. Add items to cart
  await page.goto('/register')
  await page.click('[data-testid="add-to-cart"]')
  
  // 2. View cart
  await page.click('[data-testid="cart-button"]')
  expect(await page.textContent('[data-testid="cart-count"]')).toBe('1')
  
  // 3. Checkout
  await page.click('[data-testid="checkout-button"]')
  await page.fill('[name="fullName"]', 'Test User')
  await page.click('[data-testid="confirm-order"]')
  
  // 4. Verify order created
  await expect(page).toHaveURL(/\/payment\//)
})
```

### 10.4 Load Testing
- Simulate 100 concurrent users
- Test cart operations under load
- Verify database performance

---

## 11. Analytics & Monitoring

### 11.1 Key Metrics to Track

#### Cart Metrics
- Cart abandonment rate
- Average items per cart
- Time in cart before checkout
- Most removed items

#### Conversion Metrics
- Cart-to-checkout rate
- Checkout-to-payment rate
- Payment success rate
- Average order value

#### Performance Metrics
- Page load time
- API response time
- Cart operation latency

### 11.2 Implementation

```typescript
// Track cart events
trackEvent('cart_item_added', {
  item_type: 'event',
  item_id: eventId,
  price: amount,
})

trackEvent('cart_checkout_started', {
  cart_value: totalAmount,
  item_count: itemCount,
})

trackEvent('order_completed', {
  order_id: orderId,
  total: totalAmount,
})
```

---

## 12. Error Handling

### 12.1 Common Error Scenarios

#### 1. Cart Sync Failure
```typescript
try {
  await addToCart(item)
} catch (error) {
  // Fallback: Store in localStorage
  saveToLocalStorage(item)
  showToast('Added to cart (offline)', 'warning')
  // Retry sync in background
  retrySync()
}
```

#### 2. Price Mismatch
```typescript
// Detect during checkout
if (cartPrice !== actualPrice) {
  showModal({
    title: 'Price Updated',
    message: `The price for ${item.name} has changed`,
    actions: ['Update', 'Remove Item'],
  })
}
```

#### 3. Sold Out Events
```typescript
// Check availability during checkout
const availability = await checkEventAvailability(eventId)
if (!availability.hasSpace) {
  showError('This event is now full')
  removeFromCart(itemId)
}
```

---

## 13. Accessibility

### 13.1 ARIA Labels
```tsx
<button 
  aria-label={`Cart with ${itemCount} items`}
  aria-expanded={isCartOpen}
>
  <ShoppingCart />
  <span aria-live="polite">{itemCount}</span>
</button>
```

### 13.2 Keyboard Navigation
- Tab through cart items
- Enter to remove item
- Escape to close cart drawer
- Focus management on cart open/close

### 13.3 Screen Reader Support
- Announce cart updates
- Describe item details
- Read total and counts

---

## 14. Future Enhancements

### 14.1 Short-term (Post-Launch)
- Save cart for later
- Share cart via link
- Promo code support
- Group discounts

### 14.2 Medium-term (3-6 months)
- Saved carts across devices
- Recommended items
- Cart analytics dashboard
- A/B testing framework

### 14.3 Long-term (6-12 months)
- One-click checkout
- Payment plan options
- Multi-currency support
- Advanced bundling options

---

## 15. Success Criteria

### 15.1 Launch Metrics
- ✅ Zero critical bugs in first week
- ✅ < 5% cart operation failures
- ✅ < 2s average cart load time
- ✅ > 70% cart-to-checkout rate

### 15.2 Business Metrics
- 📈 Increase average order value by 30%
- 📈 Reduce checkout time by 40%
- 📈 Improve conversion rate by 20%
- 📈 Increase multi-item purchases by 50%

---

## 16. Technical Stack Summary

### Frontend
- **Framework**: Next.js 16 with React 19
- **State Management**: React Context + hooks
- **UI Components**: Shadcn/ui with Tailwind CSS v4
- **Real-time**: Supabase Realtime
- **Validation**: Zod schemas
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Vercel Blob (payment proofs)
- **Email**: Resend
- **API**: Next.js Server Actions + Route Handlers

### DevOps
- **Hosting**: Vercel
- **Monitoring**: Vercel Analytics
- **Testing**: Playwright (E2E) + Vitest (Unit)
- **CI/CD**: GitHub Actions via Vercel

---

## 17. Implementation Checklist

### Database
- [ ] Add database indexes
- [ ] Test RLS policies
- [ ] Create migration scripts
- [ ] Add quantity column (optional)

### Backend
- [ ] Cart context provider
- [ ] Cart operations (add/remove/update)
- [ ] Checkout API endpoint
- [ ] Price validation logic
- [ ] Order creation transaction

### Frontend
- [ ] Cart button with badge
- [ ] Cart page/drawer
- [ ] Mini cart preview
- [ ] Update register page
- [ ] Update hotel booking page
- [ ] Checkout page
- [ ] Cart empty state
- [ ] Loading states

### Integration
- [ ] Connect cart to navigation
- [ ] Update payment flow
- [ ] Email notifications
- [ ] Real-time sync
- [ ] Error handling

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load tests
- [ ] Security audit

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Developer setup guide

### Launch
- [ ] Staging deployment
- [ ] UAT testing
- [ ] Production deployment
- [ ] Monitor metrics
- [ ] Gather feedback

---

## Conclusion

This comprehensive plan provides a roadmap for integrating shopping cart functionality into the ISAPM payment system. The design prioritizes:

1. **User Experience**: Seamless, intuitive cart interactions
2. **Security**: Server-side validation, RLS policies
3. **Performance**: Optimized queries, caching strategies
4. **Scalability**: Modular architecture, real-time sync
5. **Maintainability**: Clean code, comprehensive tests

The existing database schema is well-suited for this implementation, requiring minimal changes. The phased rollout approach ensures stability while delivering value incrementally.

**Estimated Timeline**: 4-5 weeks
**Team Required**: 1-2 full-stack developers
**Risk Level**: Medium (well-defined scope, existing infrastructure)

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Owner**: ISAPM Development Team
