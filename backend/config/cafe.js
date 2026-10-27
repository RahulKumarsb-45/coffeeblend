/**
 * CoffeeBlend - Mumbai Café Configuration
 * Configurable café settings, operating hours, delivery radius, and distance calculation.
 */

// Café Coordinates (Bandra West, Mumbai)
const CAFE_LOCATION = {
  name: 'CoffeeBlend Mumbai',
  address: 'Hill Road, Bandra West, Mumbai, Maharashtra 400050',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  phone: '+91 98200 12345',
  email: 'hello@coffeeblend.in',
  latitude: parseFloat(process.env.CAFE_LATITUDE || '19.0596'),
  longitude: parseFloat(process.env.CAFE_LONGITUDE || '72.8295')
};

// Operating hours (24h format: 08:00 to 23:00)
const OPERATING_HOURS = {
  openHour: parseInt(process.env.CAFE_OPEN_HOUR || '8', 10),
  openMinute: 0,
  closeHour: parseInt(process.env.CAFE_CLOSE_HOUR || '23', 10),
  closeMinute: 0,
  displayText: 'Monday - Sunday: 8:00 AM - 11:00 PM'
};

// Delivery limits
const DELIVERY_CONFIG = {
  maxRadiusKm: parseFloat(process.env.MAX_DELIVERY_RADIUS_KM || '10.0'),
  baseDeliveryFee: parseFloat(process.env.BASE_DELIVERY_FEE || '40'), // ₹40 up to 4 km
  baseKm: 4.0,
  perKmFeeAboveBase: parseFloat(process.env.PER_KM_FEE || '10'), // ₹10 per km beyond 4 km
  freeDeliveryThreshold: parseFloat(process.env.FREE_DELIVERY_THRESHOLD || '500'), // free delivery over ₹500
  targetDeliveryMinutes: 30, // targeting ~30 mins
  advanceOrderLeadMinutes: 20 // Advance coffee orders ~20 mins before arrival
};

/**
 * Known Mumbai areas and pincodes with approximate distance from Bandra West café.
 * Used for reliable distance calculation if external geocoding API credentials are not provided.
 */
const MUMBAI_NEIGHBORHOODS = [
  { name: 'bandra west', pincode: '400050', distanceKm: 1.0 },
  { name: 'bandra east', pincode: '400051', distanceKm: 2.8 },
  { name: 'khar west', pincode: '400052', distanceKm: 2.0 },
  { name: 'khar east', pincode: '400052', distanceKm: 3.2 },
  { name: 'santacruz west', pincode: '400054', distanceKm: 3.8 },
  { name: 'santacruz east', pincode: '400055', distanceKm: 4.5 },
  { name: 'mahim', pincode: '400016', distanceKm: 3.5 },
  { name: 'matunga', pincode: '400019', distanceKm: 5.2 },
  { name: 'dadar west', pincode: '400028', distanceKm: 5.5 },
  { name: 'dadar east', pincode: '400014', distanceKm: 6.2 },
  { name: 'bkc', alias: 'bandra kurla complex', pincode: '400051', distanceKm: 4.2 },
  { name: 'kurla west', pincode: '400070', distanceKm: 6.8 },
  { name: 'vile parle west', pincode: '400056', distanceKm: 5.8 },
  { name: 'vile parle east', pincode: '400057', distanceKm: 6.5 },
  { name: 'juhu', pincode: '400049', distanceKm: 5.0 },
  { name: 'andheri west', pincode: '400058', distanceKm: 8.5 },
  { name: 'andheri east', pincode: '400069', distanceKm: 9.2 },
  { name: 'prabhadevi', pincode: '400025', distanceKm: 6.8 },
  { name: 'worli', pincode: '400018', distanceKm: 8.2 },
  { name: 'lower parel', pincode: '400013', distanceKm: 8.0 },
  { name: 'elphinstone', pincode: '400012', distanceKm: 7.2 },
  { name: 'charni road', pincode: '400004', distanceKm: 13.5 }, // Beyond 10km
  { name: 'colaba', pincode: '400005', distanceKm: 18.0 }, // Beyond 10km
  { name: 'thane', pincode: '400601', distanceKm: 28.0 }, // Beyond 10km
  { name: 'borivali', pincode: '400092', distanceKm: 20.0 }, // Beyond 10km
  { name: 'kandivali', pincode: '400067', distanceKm: 17.5 }, // Beyond 10km
  { name: 'malad', pincode: '400064', distanceKm: 15.0 }, // Beyond 10km
  { name: 'goregaon', pincode: '400062', distanceKm: 12.0 }, // Beyond 10km
  { name: 'powai', pincode: '400076', distanceKm: 13.5 } // Beyond 10km
];

/**
 * Calculate distance between two lat/lng points using Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Determine delivery distance and eligibility for a given address and/or pincode/coordinates.
 */
function estimateDeliveryDistance({ address = '', pincode = '', lat, lng }) {
  // If coordinates provided, use Haversine
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    const distanceKm = calculateHaversineDistance(
      CAFE_LOCATION.latitude, CAFE_LOCATION.longitude,
      parseFloat(lat), parseFloat(lng)
    );
    return {
      distanceKm,
      isEligible: distanceKm <= DELIVERY_CONFIG.maxRadiusKm,
      method: 'coordinates'
    };
  }

  const cleanAddr = (address || '').toLowerCase();
  const cleanPin = (pincode || '').trim();

  // Try matching Mumbai pincode first
  if (cleanPin) {
    const matchByPin = MUMBAI_NEIGHBORHOODS.find(n => n.pincode === cleanPin);
    if (matchByPin) {
      return {
        distanceKm: matchByPin.distanceKm,
        isEligible: matchByPin.distanceKm <= DELIVERY_CONFIG.maxRadiusKm,
        area: matchByPin.name,
        method: 'pincode'
      };
    }
  }

  // Try matching neighborhood names in address string
  for (const n of MUMBAI_NEIGHBORHOODS) {
    if (cleanAddr.includes(n.name) || (n.alias && cleanAddr.includes(n.alias))) {
      return {
        distanceKm: n.distanceKm,
        isEligible: n.distanceKm <= DELIVERY_CONFIG.maxRadiusKm,
        area: n.name,
        method: 'neighborhood'
      };
    }
  }

  // If address explicitly contains "mumbai" but no neighborhood matched, estimate default in-bandra or unverified
  if (cleanAddr.includes('mumbai') || cleanAddr.includes('bombay')) {
    // If not matched, default to conservative estimate within central zone
    return {
      distanceKm: 4.5,
      isEligible: true,
      area: 'Mumbai Central Zone',
      method: 'fallback_mumbai'
    };
  }

  // Outside Mumbai or unknown
  return {
    distanceKm: 25.0,
    isEligible: false,
    area: 'Outside Mumbai delivery area',
    method: 'unknown'
  };
}

/**
 * Calculate delivery charge based on distance and order subtotal
 */
function calculateDeliveryFee(distanceKm, subtotal = 0) {
  if (subtotal >= DELIVERY_CONFIG.freeDeliveryThreshold) {
    return 0; // Free delivery above threshold
  }
  if (distanceKm <= DELIVERY_CONFIG.baseKm) {
    return DELIVERY_CONFIG.baseDeliveryFee;
  }
  const extraKm = Math.ceil(distanceKm - DELIVERY_CONFIG.baseKm);
  return Math.round(DELIVERY_CONFIG.baseDeliveryFee + (extraKm * DELIVERY_CONFIG.perKmFeeAboveBase));
}

/**
 * Calculate estimated delivery duration targeting ~30 mins
 */
function calculateEstimatedDeliveryMinutes(distanceKm) {
  // Base 20 mins preparation + ~2-3 mins per km in Mumbai traffic
  const estimated = Math.round(20 + (distanceKm * 2.2));
  return Math.max(25, Math.min(60, estimated)); // Between 25 and 60 minutes
}

/**
 * Check if the given date & time is within operating hours
 */
function isWithinOperatingHours(dateObj) {
  const d = new Date(dateObj);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = OPERATING_HOURS.openHour * 60 + OPERATING_HOURS.openMinute;
  const closeMinutes = OPERATING_HOURS.closeHour * 60 + OPERATING_HOURS.closeMinute;

  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

module.exports = {
  CAFE_LOCATION,
  OPERATING_HOURS,
  DELIVERY_CONFIG,
  estimateDeliveryDistance,
  calculateDeliveryFee,
  calculateEstimatedDeliveryMinutes,
  isWithinOperatingHours
};
