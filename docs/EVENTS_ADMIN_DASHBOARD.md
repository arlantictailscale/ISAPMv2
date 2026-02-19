# Events Admin Dashboard Documentation

## Overview

The Events Admin Dashboard is a comprehensive administrative interface designed to provide administrators with a centralized view of all symposium events, workshops, CPD courses, and webinars. Located at `/admin/events`, this dashboard enables real-time monitoring and management of all event data within the system.

## Features

### 1. **Dashboard Summary Statistics**
- **Total Events**: Displays the complete count of all events
- **Event Type Breakdown**: Shows individual counts for:
  - CPD Courses (purple badge)
  - Workshops (blue badge)
  - Symposiums (orange badge)
  - Webinars (green badge)

### 2. **Search & Filtering**
- **Search Bar**: Find events by name, title, or description
- **Filter by Type**: Quick filter to view specific event categories
- **Sort Options**:
  - Name (A-Z)
  - Event Type
  - Date (Earliest First)
  - Date (Most Recent)

### 3. **Dual View Modes**
- **Grid View** (Default): Visual card-based layout for comprehensive overview
- **List View**: Compact tabular format for quick scanning

### 4. **Event Information Display**

#### Grid View Card Layout:
- Event title and short label
- Color-coded type badge
- Event date and time
- Participant type count
- Data source indicator (Database or Static)
- Edit button for quick access

#### List View Layout:
- Condensed event information
- Type badge with color coding
- Date information
- Quick edit action

### 5. **Data Integration**

The dashboard pulls event data from two sources:
1. **Static Events**: Sourced from `/lib/data/event-pricing.ts` (fallback data)
2. **Database Events**: Real-time data from Supabase (when available)

### 6. **Real-Time Updates**

The dashboard automatically subscribes to Supabase real-time channels, ensuring that:
- Changes made in the Event CMS are reflected immediately
- New events appear automatically when added
- Deleted events are removed from the view

### 7. **Event Management Actions**

From the dashboard, administrators can:
- **Edit Events**: Navigate directly to the Event CMS for editing specific events
- **View Details**: Quick access to event information
- **Compare Events**: Use filtering to compare similar events

## Color Coding System

| Event Type | Color | Icon | Purpose |
|-----------|-------|------|---------|
| CPD Courses | Purple | 🎓 | Educational development programs |
| Workshops | Blue | 🛠️ | Hands-on training sessions |
| Symposium | Orange | 👥 | Large-scale gatherings |
| Webinars | Green | 🎥 | Online seminars |

## Access Control

### Authentication Requirements
- Only authenticated users with **admin role** can access this page
- Non-admin users are redirected to the home page
- Unauthenticated users are redirected to login

### Server-Side Validation
- Authentication is verified at the server level in `/app/admin/events/page.tsx`
- User role is checked against the `profiles` table in Supabase
- Access is denied if role ≠ "admin"

## URL Structure

| Page | Purpose |
|------|---------|
| `/admin/events` | Main dashboard with all events |
| `/admin/events?search=...` | Pre-filtered search results |
| `/admin/event-cms?edit=WS1` | Edit specific event |

## Performance Considerations

### Optimization Features
1. **Memoization**: Filtered and sorted event lists are memoized to prevent unnecessary recalculations
2. **Real-time Subscriptions**: Efficient Supabase subscription management
3. **Lazy Loading**: Components are code-split for optimal bundle size
4. **Loading States**: Skeleton loaders provide visual feedback during data fetch

### Best Practices
- Filters and search are applied client-side for instant user feedback
- Initial data load is minimal and non-blocking
- Pagination can be added if events exceed 50 items

## UI/UX Features

### Responsive Design
- **Mobile**: Single column layout with optimized spacing
- **Tablet**: 2-column grid layout
- **Desktop**: 3-column grid layout with sidebar navigation

### Visual Hierarchy
- Large summary statistics at the top
- Filter controls clearly separated
- Event cards use color-coding for quick identification
- Action buttons are prominently placed

### Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast color scheme

## Integration with Event CMS

The dashboard seamlessly integrates with the Event CMS:

1. **Edit Link Generation**: Each event card includes a direct link to edit in Event CMS
2. **Parameter Passing**: `?edit=EVENT_ID` URL parameter pre-selects the event for editing
3. **Real-time Sync**: Changes in Event CMS automatically update the dashboard
4. **Fallback Handling**: Static events can still be viewed and edited

## File Structure

\`\`\`
/app/admin/events/
├── page.tsx                 # Server component with auth
├── events-dashboard.tsx     # Client component with UI logic
└── loading.tsx             # Loading skeleton UI

/components/
└── admin-nav.tsx           # Updated with Events Dashboard link
\`\`\`

## Technical Implementation

### Technologies Used
- **React 19**: Client components with hooks (useState, useMemo, useCallback, useEffect)
- **Next.js 16**: Server components with streaming and authentication
- **Supabase**: Real-time subscriptions and authentication
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe implementation

### Key Dependencies
- `lucide-react`: Icon library
- `sonner`: Toast notifications (for future enhancements)
- `@radix-ui`: UI component library

## Future Enhancements

Potential improvements for future versions:

1. **Pagination**: Add pagination for events exceeding 50 items
2. **Bulk Operations**: Select multiple events for batch actions
3. **Event Analytics**: Display attendee counts and revenue metrics
4. **Export Functionality**: Download event data as CSV/Excel
5. **Advanced Filtering**: Filter by date range, price, capacity
6. **Event Templates**: Clone and duplicate existing events
7. **Automated Reports**: Schedule daily/weekly event reports
8. **Event Validation**: Check for missing required fields or conflicts

## Troubleshooting

### Dashboard Not Loading
- Verify admin role is set correctly in the `profiles` table
- Check browser console for authentication errors
- Ensure user is logged in

### Events Not Showing
- Verify `/lib/data/event-pricing.ts` contains event data
- Check Supabase connection in the console
- Ensure the `events` table exists in database (if using)

### Real-time Updates Not Working
- Verify Supabase real-time subscriptions are enabled
- Check network connection
- Reload the page to manually sync data

### Styling Issues
- Clear browser cache
- Verify Tailwind CSS is properly compiled
- Check for conflicting global styles

## Support

For issues or feature requests related to the Events Admin Dashboard, contact the development team or submit a GitHub issue.

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Production Ready
