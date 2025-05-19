<script setup>

</script>

<template>
  <section id="venue-detail-page" class="container page-section">
    <div class="venue-detail-header">
      <img src="../assets/images/venuePic.jpeg" alt="Conference Hall A" class="venue-detail-image">
      <div class="venue-detail-overlay">
        <h1 class="venue-detail-title">Conference Hall A</h1>
        <div class="venue-detail-meta">
          <div>Downtown Business Center</div>
          <div>★★★★☆ 4.5 (24 reviews)</div>
        </div>
      </div>
    </div>

    <div class="venue-detail-info">
      <div class="venue-detail-main">
        <div class="card venue-detail-section">
          <h2>About this Venue</h2>
          <p>A spacious conference hall located in the heart of the business district, perfect for corporate events, presentations, and workshops. The space is equipped with modern amenities and can be configured to meet various event needs.</p>

          <h3 style="margin-top: 20px;">Features</h3>
          <ul>
            <li>High-speed Wi-Fi</li>
            <li>Projector and screen</li>
            <li>Flexible seating arrangements</li>
            <li>On-site technical support</li>
          </ul>
        </div>

        <div class="card venue-detail-section">
          <h2>Pricing</h2>
          <p><strong>$500 / day</strong> (Minimum 4 hours)</p>
          <p>Additional services (catering, extra equipment) available at additional cost.</p>
        </div>

        <div class="card venue-detail-section">
          <h2>Availability</h2>
          <div class="availability-calendar">
            <div class="calendar-header">
              <div class="calendar-nav">
                <button class="btn btn-outline btn-small">Previous</button>
                <h3>June 2025</h3>
                <button class="btn btn-outline btn-small">Next</button>
              </div>
            </div>
            <div class="availability-grid">
              <div class="availability-day available">1</div>
              <div class="availability-day available">2</div>
              <div class="availability-day unavailable">3</div>
              <div class="availability-day partial">4</div>
              <div class="availability-day available">5</div>
              <div class="availability-day available">6</div>
              <div class="availability-day available">7</div>
              <!-- Add more days as needed -->
            </div>
          </div>
        </div>
      </div>

      <div class="venue-detail-sidebar">
        <div class="card">
          <h2>Book Now</h2>
          <form>
            <div class="form-group">
              <label for="booking-date">Date</label>
              <input type="date" id="booking-date" class="form-control">
            </div>
            <div class="form-group">
              <label for="booking-time">Time</label>
              <select id="booking-time" class="form-control">
                <option>9:00 AM - 5:00 PM</option>
                <option>1:00 PM - 5:00 PM</option>
                <option>6:00 PM - 10:00 PM</option>
              </select>
            </div>
            <div class="form-group">
              <label for="booking-guests">Guests</label>
              <input type="number" id="booking-guests" class="form-control" min="1" max="100">
            </div>
            <button type="submit" class="btn">Book Venue</button>
          </form>
        </div>
      </div>
    </div>
  </section></template>

<style scoped>

</style>
