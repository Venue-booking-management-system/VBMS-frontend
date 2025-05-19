<script setup>

</script>

<template>
  <div class="modal-backdrop" id="booking-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Booking Details</h2>
        <button class="modal-close" onclick="closeBookingModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="card">
          <h3>Booking #12345</h3>
          <p><strong>Venue:</strong> Conference Hall A</p>
          <p><strong>Location:</strong> Downtown Business Center</p>
          <p><strong>Date:</strong> June 15, 2025</p>
          <p><strong>Time:</strong> 9:00 AM - 5:00 PM</p>
          <p><strong>Guests:</strong> 50</p>
          <p><strong>Status:</strong> <span class="booking-status status-approved">Approved</span></p>
          <p><strong>Total Cost:</strong> $500</p>
        </div>

        <div class="tabs">
          <div class="tab active" onclick="showTab('details-tab')">Details</div>
          <div class="tab" onclick="showTab('documents-tab')">Documents</div>
          <div class="tab" onclick="showTab('notes-tab')">Notes</div>
        </div>

        <div class="tab-content active" id="details-tab">
          <p>Additional details about the booking, such as special requests or setup requirements.</p>
        </div>
        <div class="tab-content" id="documents-tab">
          <p>Uploaded documents: <a href="#">Contract.pdf</a></p>
        </div>
        <div class="tab-content" id="notes-tab">
          <p>Notes: Ensure projector is set up before event start.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeBookingModal()">Close</button>
        <button class="btn">Download Invoice</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
