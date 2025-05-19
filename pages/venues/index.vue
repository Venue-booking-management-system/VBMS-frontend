<script setup>

</script>

<template>
  <section id="venues-page" class="container page-section">
    <h1 class="section-title">Browse Venues</h1>

    <div class="search-filters">
      <div class="filter">
        <label for="venue-search">Search:</label>
        <input type="text" id="venue-search" placeholder="Search venues...">
      </div>
      <div class="filter">
        <label for="venue-type">Type:</label>
        <select id="venue-type">
          <option value="">All Types</option>
          <option value="conference">Conference Rooms</option>
          <option value="meeting">Meeting Rooms</option>
          <option value="event">Event Spaces</option>
        </select>
      </div>
      <div class="filter">
        <label for="venue-capacity">Capacity:</label>
        <select id="venue-capacity">
          <option value="">Any Capacity</option>
          <option value="small">Small (up to 20)</option>
          <option value="medium">Medium (21-50)</option>
          <option value="large">Large (51-100)</option>
          <option value="xl">Extra Large (100+)</option>
        </select>
      </div>
      <div class="filter">
        <label for="venue-date">Date:</label>
        <input type="date" id="venue-date">
      </div>
    </div>
    <div class="list-controls">
      <div class="view-options">
        <button class="view-option active">Grid</button>
        <button class="view-option">List</button>
        <button class="view-option">Map</button>
      </div>
      <div class="sort-filter">
        <label for="venue-sort">Sort by:</label>
        <select id="venue-sort">
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>
    </div>
    <!---->
    <div class="venues-grid">
      <!-- Venue Card 1 -->
      <div class="venue-card">
        <img src="../assets/images/venuePic.jpeg" alt="Conference Hall A" class="venue-image">
        <div class="venue-details">
          <h3 class="venue-title">Conference Hall A</h3>
          <p class="venue-location">Downtown Business Center</p>
          <div class="venue-features">
            <span class="badge badge-primary">Capacity: 100</span>
            <span class="badge badge-primary">Projector</span>
            <span class="badge badge-primary">Wi-Fi</span>
          </div>
          <div class="venue-price">$500 / day</div>
          <div class="venue-card-footer">
            <div class="venue-rating">★★★★☆ 4.5</div>
            <button class="btn btn-small" onclick="showVenueDetail()">Book Now</button>
          </div>
        </div>
      </div>
      <!---->
      <!-- Venue Card 2 -->
      <div class="venue-card">
        <img src="../assets/images/venuePic.jpeg" alt="Meeting Room 3" class="venue-image">
        <div class="venue-details">
          <h3 class="venue-title">Meeting Room 3</h3>
          <p class="venue-location">Tech Hub Building</p>
          <div class="venue-features">
            <span class="badge badge-primary">Capacity: 20</span>
            <span class="badge badge-primary">Whiteboard</span>
            <span class="badge badge-primary">Video Conf</span>
          </div>
          <div class="venue-price">$150 / day</div>
          <div class="venue-card-footer">
            <div class="venue-rating">★★★★★ 5.0</div>
            <button class="btn btn-small" onclick="showVenueDetail()">Book Now</button>
          </div>
        </div>
      </div>
      <!---->
      <!-- Venue Card 3 -->
      <div class="venue-card">
        <img src="../assets/images/venuePic.jpeg" alt="Event Space" class="venue-image">
        <div class="venue-details">
          <h3 class="venue-title">Event Space</h3>
          <p class="venue-location">Creative District</p>
          <div class="venue-features">
            <span class="badge badge-primary">Capacity: 200</span>
            <span class="badge badge-primary">Stage</span>
            <span class="badge badge-primary">Sound System</span>
          </div>
          <div class="venue-price">$1200 / day</div>
          <div class="venue-card-footer">
            <div class="venue-rating">★★★★☆ 4.2</div>
            <button class="btn btn-small" onclick="showVenueDetail()">Book Now</button>
          </div>
        </div>
      </div>
      <!---->
      <!-- Venue Card 4 -->
      <div class="venue-card">
        <img src="../assets/images/venuePic.jpeg" alt="Boardroom" class="venue-image">
        <div class="venue-details">
          <h3 class="venue-title">Executive Boardroom</h3>
          <p class="venue-location">Financial District</p>
          <div class="venue-features">
            <span class="badge badge-primary">Capacity: 15</span>
            <span class="badge badge-primary">AV System</span>
            <span class="badge badge-primary">Catering</span>
          </div>
          <div class="venue-price">$300 / day</div>
          <div class="venue-card-footer">
            <div class="venue-rating">★★★★☆ 4.7</div>
            <button class="btn btn-small" onclick="showVenueDetail()">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>
