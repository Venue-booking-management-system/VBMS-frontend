<script setup>
</script>

<template>
  <section id="dashboard-page" class="container page-section">
    <h1 class="section-title">Dashboard</h1>

    <div class="dashboard-grid">
      <div class="card stat-card">
        <div class="stat-number">5</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="card stat-card">
        <div class="stat-number">2</div>
        <div class="stat-label">Upcoming Events</div>
      </div>
      <div class="card stat-card">
        <div class="stat-number">1</div>
        <div class="stat-label">Pending Approval</div>
      </div>
    </div>

    <div class="card">
      <h2>Upcoming Bookings</h2>
      <table class="bookings-table">
        <thead>
        <tr>
          <th>Venue</th>
          <th>Date & Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Conference Hall A</td>
          <td>June 15, 2025 • 9:00 AM - 5:00 PM</td>
          <td><span class="booking-status status-approved">Approved</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline">View</button>
              <button class="btn btn-small btn-outline">Cancel</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>Meeting Room 3</td>
          <td>June 20, 2025 • 1:00 PM - 3:00 PM</td>
          <td><span class="booking-status status-pending">Pending</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline">View</button>
              <button class="btn btn-small btn-outline">Cancel</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="card recent-activity">
      <h2>Recent Activity</h2>
      <ul class="activity-list">
        <li class="activity-item">
          <div class="activity-icon">✓</div>
          <div class="activity-content">
            <div>Your booking for <strong>Conference Hall A</strong> has been approved.</div>
            <div class="activity-time">2 hours ago</div>
          </div>
        </li>
        <li class="activity-item">
          <div class="activity-icon">📅</div>
          <div class="activity-content">
            <div>You booked <strong>Meeting Room 3</strong> for June 20.</div>
            <div class="activity-time">5 hours ago</div>
          </div>
        </li>
        <li class="activity-item">
          <div class="activity-icon">📄</div>
          <div class="activity-content">
            <div>Document verification requested for <strong>Event Space</strong> booking.</div>
            <div class="activity-time">Yesterday</div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
