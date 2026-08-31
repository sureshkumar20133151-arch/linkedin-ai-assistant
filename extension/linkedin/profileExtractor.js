/**
 * LinkedIn Profile Context Extractor
 * Extracts headline, location, about text, and experience entries from a profile page DOM.
 * Used when the user clicks 'Analyze Profile' to classify author role (Founder / Recruiter / HR).
 */
function extractProfileContext(doc = document) {
  if (!doc) return null;

  // Extract headline
  let headline = '';
  const headlineEl = doc.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium');
  if (headlineEl) {
    headline = (headlineEl.innerText || headlineEl.textContent || '').trim();
  }

  // Extract location
  let location = '';
  const locationEl = doc.querySelector('.text-body-small.inline.t-black--light, .pv-text-details__left-panel .text-body-small');
  if (locationEl) {
    location = (locationEl.innerText || locationEl.textContent || '').trim();
  }

  // Extract About section text
  let aboutText = '';
  const aboutSection = doc.querySelector('#about ~ div .display-flex, #about ~ div span[aria-hidden="true"]');
  if (aboutSection) {
    aboutText = (aboutSection.innerText || aboutSection.textContent || '').trim();
  }

  // Extract Experience entries
  const experienceEntries = [];
  const expItems = doc.querySelectorAll('#experience ~ div li.artdeco-list__item, section.experience-section li');
  expItems.forEach(item => {
    const titleEl = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .t-16.t-bold span[aria-hidden="true"]');
    const companyEl = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');

    const title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : '';
    const company = companyEl ? (companyEl.innerText || companyEl.textContent || '').trim() : '';

    if (title || company) {
      experienceEntries.push({ title, company });
    }
  });

  return {
    headline,
    location,
    aboutText: aboutText.substring(0, 300),
    experienceEntries: experienceEntries.slice(0, 3),
    extractedAt: Date.now()
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractProfileContext };
}
