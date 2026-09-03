import db from '../db/index.js';

export async function getOrganizerAnalytics(req, res) {
  try {
    const organizerId = req.user.id;

    // Fetch metrics
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        SUM(CASE WHEN e.status = 'PUBLISHED' THEN 1 ELSE 0 END) as active_events,
        COUNT(r.id) as total_registrations,
        SUM(CASE WHEN r.status = 'CHECKED_IN' THEN 1 ELSE 0 END) as checked_in_count,
        SUM(CASE WHEN r.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed_count,
        COALESCE(SUM(CASE WHEN r.status IN ('CONFIRMED', 'CHECKED_IN') THEN e.price ELSE 0 END), 0) as total_revenue
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.organizer_id = ?
    `).get(organizerId);

    const conversionRate = stats.total_registrations > 0 
      ? Math.round((stats.checked_in_count / stats.total_registrations) * 100) 
      : 0;

    return res.json({
      success: true,
      data: {
        analytics: {
          totalEvents: stats.total_events || 0,
          activeEvents: stats.active_events || 0,
          totalRegistrations: stats.total_registrations || 0,
          confirmedAttendees: stats.confirmed_count || 0,
          checkedInAttendees: stats.checked_in_count || 0,
          attendanceRatePercent: conversionRate,
          totalRevenueFormatted: `$${(stats.total_revenue || 0).toFixed(2)}`
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
