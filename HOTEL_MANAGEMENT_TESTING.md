# Hotel Management Room Settings - Testing & Verification Guide

## Issue Fixed
The "Save Settings" button in `/admin/hotel-management` was not updating the maximum room availability in the database.

### Root Cause
The `room_availability_settings` table had Row Level Security (RLS) enabled with only a SELECT policy ("Anyone can view"). The INSERT and UPDATE operations were being silently rejected due to missing RLS policies.

## Solution Implemented

### 1. Database Level (SQL Migration)
**File**: `/scripts/add-hotel-rls-policies.sql`

Added two new RLS policies to the `room_availability_settings` table:
- **INSERT Policy**: Allows authenticated users and service_role to insert room settings
- **UPDATE Policy**: Allows authenticated users and service_role to update room settings

### 2. Code Level Enhancements
**File**: `/app/actions/hotel-management.ts`

- Enhanced `updateRoomSettings()` with explicit error detection for RLS permission issues
- Improved `getRoomSettings()` with better error messages and fallback defaults
- Added detailed logging for all database operations

**File**: `/app/admin/hotel-management/page.tsx`

- Added input validation to ensure room values are positive integers
- Enhanced save handler with user feedback (success/error toasts)
- Added pre-save validation before sending to backend

## Testing Procedure

### Step 1: Verify RLS Policies
1. Open Supabase Dashboard
2. Navigate to the `room_availability_settings` table
3. Click on "Auth Policies" / "RLS" settings
4. Verify these policies exist:
   - `room_availability_settings_insert` - INSERT policy
   - `room_availability_settings_update` - UPDATE policy

### Step 2: Test Room Settings Save

1. **Navigate to Hotel Management**
   - Go to `/admin/hotel-management`
   - Click on the "Inventory" tab

2. **Change Room Availability**
   - Modify the "Total Rooms Available" value for Deluxe rooms (e.g., from 50 to 60)
   - Modify the "Total Rooms Available" value for Premier rooms (e.g., from 21 to 30)

3. **Click "Save Settings"**
   - You should see a success toast notification: "Settings saved successfully!"
   - The notification will display: "Deluxe: 60 rooms, Premier: 30 rooms"

4. **Verify Persistence**
   - Refresh the page (Ctrl+R or Cmd+R)
   - The room values should remain at your new amounts (60 and 30)
   - If they revert to old values, the save failed

5. **Check Database Directly** (Optional)
   - Open Supabase Dashboard
   - Navigate to `room_availability_settings` table
   - Verify the `default_capacity` values match your changes:
     - Row with `room_type: "deluxe"` should show `default_capacity: 60`
     - Row with `room_type: "premier"` should show `default_capacity: 30`

### Step 3: Test Error Handling

1. **Test Invalid Input**
   - Try entering 0 or negative numbers
   - You should see an error toast: "Invalid input - rooms must be at least 1"

2. **Test Permission Errors** (If RLS policies weren't added)
   - You should see: "Permission denied: Unable to save room settings"
   - This indicates the RLS policies need to be added

### Step 4: Test Page Refresh and Reload

1. Change room values again
2. Save Settings
3. Refresh the page
4. Verify the new values appear

## Debugging Logs

When testing, check the browser console (F12) for debug logs:

```
[v0] Saving room settings with: { deluxe_rooms: 60, premier_rooms: 30 }
[v0] Room settings saved successfully
[v0] Loaded settings: { deluxe_rooms: 60, premier_rooms: 30 }
[v0] Setting room settings to: { deluxe_rooms: 60, premier_rooms: 30 }
```

If you see errors like:
```
[v0] Error saving room settings: { message: "Permission denied", isRLSError: true }
```

This means the RLS policies weren't added. Run the SQL migration again.

## Expected Behavior After Fix

1. ✅ Input values are captured correctly in the form
2. ✅ "Save Settings" button is clickable and responsive
3. ✅ Success toast appears with saved values
4. ✅ Database updates immediately
5. ✅ Page refresh shows persisted values
6. ✅ Invalid inputs are rejected with helpful error messages

## Files Modified

- `/app/actions/hotel-management.ts` - Enhanced error handling
- `/app/admin/hotel-management/page.tsx` - Added input validation and better UX
- `/scripts/add-hotel-rls-policies.sql` - New RLS policies (executed)

## Rollback Instructions

If you need to revert the RLS policies (not recommended), run:

```sql
DROP POLICY IF EXISTS room_availability_settings_insert ON room_availability_settings;
DROP POLICY IF EXISTS room_availability_settings_update ON room_availability_settings;
```

Note: This will prevent saving room settings again until the policies are re-added.
