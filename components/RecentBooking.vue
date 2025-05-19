<template>
  <div style="flex: 1;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0;">Recent Bookings</h3>
      <a href="#" style="color: #3498db; text-decoration: none;">View All</a>
    </div>

    <table class="table">
      <thead>
      <tr>
        <th>Booking ID</th>
        <th>Venue</th>
        <th>User</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>#1234</td>
        <td>Grand Hall</td>
        <td>John Smith</td>
        <td>Apr 28, 2025</td>
        <td><span class="status-badge status-approved">Approved</span></td>
      </tr>
      <tr>
        <td>#1235</td>
        <td>Conference Room A</td>
        <td>Alice Johnson</td>
        <td>Apr 30, 2025</td>
        <td><span class="status-badge status-pending">Pending</span></td>
      </tr>
      <tr>
        <td>#1236</td>
        <td>Garden Pavilion</td>
        <td>Robert Brown</td>
        <td>May 2, 2025</td>
        <td><span class="status-badge status-rejected">Rejected</span></td>
      </tr>
      <tr>
        <td>#1237</td>
        <td>Main Auditorium</td>
        <td>Emily Davis</td>
        <td>May 5, 2025</td>
        <td><span class="status-badge status-approved">Approved</span></td>
      </tr>
      </tbody>
    </table>
  </div>
</template>
