<script setup>

</script>

<template>
  <section id="bookings-page" class="container page-section">
    <h1 class="section-title">My Bookings</h1>

    <div class="booking-filters">
      <div class="filter">
        <label for="booking-status">Status:</label>
        <select id="booking-status">
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="review">In Review</option>
        </select>
      </div>
      <div class="filter">
        <label for="booking-date-from">Date From:</label>
        <input type="date" id="booking-date-from">
      </div>
      <div class="filter">
        <label for="booking-date-to">Date To:</label>
        <input type="date" id="booking-date-to">
      </div>
      <div class="filter">
        <label for="booking-venue">Venue:</label>
        <input type="text" id="booking-venue" placeholder="Search venues...">
      </div>
    </div>

    <div class="card">
      <table class="bookings-table">
        <thead>
        <tr>
          <th>Booking ID</th>
          <th>Venue</th>
          <th>Date & Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>#12345</td>
          <td>Conference Hall A</td>
          <td>June 15, 2025 • 9:00 AM - 5:00 PM</td>
          <td><span class="booking-status status-approved">Approved</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline" onclick="openBookingModal()">View</button>
              <button class="btn btn-small btn-outline">Cancel</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>#12346</td>
          <td>Meeting Room 3</td>
          <td>June 20, 2025 • 1:00 PM - 3:00 PM</td>
          <td><span class="booking-status status-pending">Pending</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline" onclick="openBookingModal()">View</button>
              <button class="btn btn-small btn-outline">Cancel</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>#12347</td>
          <td>Event Space</td>
          <td>July 1, 2025 • 6:00 PM - 10:00 PM</td>
          <td><span class="booking-status status-review">In Review</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline" onclick="openBookingModal()">View</button>
              <button class="btn btn-small btn-outline">Cancel</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </section></template>

<style scoped>

</style>
