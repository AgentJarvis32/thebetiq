// BetAuthority Geo Detection
// Uses ipapi.co (free, no key needed, 30k/month)

const GEO_OVERRIDES = {
  'GB': { name: 'United Kingdom', flag: '🇬🇧', page: 'countries/uk.html', tab: 'uk', currency: '£', helpline: 'GamCare: 0808 8020 133' },
  'CA': { name: 'Canada',         flag: '🇨🇦', page: 'countries/canada.html', tab: 'ca', currency: 'C$', helpline: 'ConnexOntario: 1-866-531-2600' },
  'AU': { name: 'Australia',      flag: '🇦🇺', page: 'countries/australia.html', tab: 'au', currency: 'A$', helpline: 'Gambling Help: 1800 858 858' },
  'IN': { name: 'India',          flag: '🇮🇳', page: 'countries/india.html', tab: 'in', currency: '₹', helpline: 'iCall: 9152987821' },
  'NZ': { name: 'New Zealand',    flag: '🇳🇿', page: 'countries/newzealand.html', tab: 'nz', currency: 'NZ$', helpline: 'Problem Gambling: 0800 654 655' },
  'DE': { name: 'Germany',        flag: '🇩🇪', page: 'countries/germany.html', tab: 'de', currency: '€', helpline: 'BZgA: 0800 137 2700' },
  'IE': { name: 'Ireland',        flag: '🇮🇪', page: 'countries/index.html', tab: 'ie', currency: '€', helpline: 'Problem Gambling Ireland: 1800 753 753' },
  'ZA': { name: 'South Africa',   flag: '🇿🇦', page: 'countries/index.html', tab: 'za', currency: 'R', helpline: 'NRGP: 0800 006 008' },
  'SE': { name: 'Sweden',         flag: '🇸🇪', page: 'countries/index.html', tab: 'se', currency: 'kr', helpline: 'Stödlinjen: 020-819 100' },
  'US': { name: 'United States',  flag: '🇺🇸', page: 'countries/usa.html', tab: 'us', currency: '$', helpline: '1-800-GAMBLER' },
};

const DEFAULT = { name: 'your country', flag: '🌍', page: 'countries/index.html', tab: 'global', currency: '$', helpline: 'gamblingtherapy.org' };

function getCountryData(code) {
  return GEO_OVERRIDES[code] || DEFAULT;
}

function applyGeo(countryCode, countryName, manual) {
  const data = getCountryData(countryCode);

  // Update geo bar
  const bar = document.getElementById('geo-bar');
  if (bar) {
    const isUS = countryCode === 'US';
    bar.innerHTML = `
      <span class="geo-flag">${data.flag}</span>
      <span class="geo-text">
        ${manual ? 'Showing results for' : 'We detected you\'re in'} <strong>${countryName || data.name}</strong>.
        ${isUS ? 'Select your state for local options.' : ''}
      </span>
      <a href="${getRootPrefix()}${data.page}" class="geo-btn">See ${data.name} Guide →</a>
      <button class="geo-change" onclick="showCountryPicker()">Change Country</button>
    `;
    bar.style.display = 'flex';
  }

  // Highlight correct country tab
  document.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.ctab[data-geo="${data.tab}"]`);
  if (activeTab) activeTab.classList.add('active');

  // Update responsible gambling helpline in sidebar
  const rgEl = document.getElementById('rg-helpline');
  if (rgEl) rgEl.textContent = data.helpline;

  // Show/hide geo sections
  document.querySelectorAll('[data-show-for]').forEach(el => {
    const codes = el.getAttribute('data-show-for').split(',');
    el.style.display = (codes.includes(countryCode) || codes.includes('ALL')) ? '' : 'none';
  });

  // Store selection
  try { localStorage.setItem('ba_country', countryCode); localStorage.setItem('ba_country_name', countryName || data.name); } catch(e) {}
}

function getRootPrefix() {
  // Figure out how many levels deep we are
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length - 1;
  return depth <= 1 ? '' : '../'.repeat(depth - 1);
}

function showCountryPicker() {
  const modal = document.getElementById('country-modal');
  if (modal) modal.style.display = 'flex';
}

function hideCountryPicker() {
  const modal = document.getElementById('country-modal');
  if (modal) modal.style.display = 'none';
}

function selectCountry(code, name) {
  hideCountryPicker();
  applyGeo(code, name, true);
}

function initGeo() {
  // Check for manual override first
  try {
    const stored = localStorage.getItem('ba_country');
    const storedName = localStorage.getItem('ba_country_name');
    if (stored) {
      applyGeo(stored, storedName, true);
      return;
    }
  } catch(e) {}

  // Check URL param ?country=GB
  const params = new URLSearchParams(window.location.search);
  const urlCountry = params.get('country');
  if (urlCountry) {
    const data = getCountryData(urlCountry.toUpperCase());
    applyGeo(urlCountry.toUpperCase(), data.name, true);
    return;
  }

  // Fetch from ipapi
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
      applyGeo(data.country_code, data.country_name, false);
    })
    .catch(() => {
      // Fallback — show global
      applyGeo('GLOBAL', 'your region', false);
    });
}

document.addEventListener('DOMContentLoaded', initGeo);
