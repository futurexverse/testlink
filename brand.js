/*
 * ============================================================
 * BELL INVEST — TEMPORARY TESLA × SPACEX REBRAND
 * Modular brand configuration
 * ------------------------------------------------------------
 * This file is the single source of truth for the temporary
 * brand identity applied across the prototype.
 *
 * TO RESTORE BELL INVEST BRANDING LATER:
 *   1. Set primary/secondary entries below back to Bell Invest
 *      (point logo at ../../assets/img/bell-invest-logo.png or
 *      the original storage/settings logo URL).
 *   2. Update the `names`, `alt`, `titles` and `copyright`
 *      fields.
 *   3. Remove the second brand (secondary) if only one lockup
 *      is wanted, or keep both slots for a co-brand arrangement.
 *   4. See README.md → "Restoring Bell Invest branding".
 *
 * The HTML already contains these values inline (so the site
 * renders correctly without JavaScript); this module hydrates
 * every [data-brand] hook from one place, which makes the
 * swap a single-file edit.
 * ============================================================
 */
(function () {
  'use strict';

  var BRAND = {
    /* ---- Primary brand (left side of the lockup) ---- */
    primary: {
      name: 'TESLA',
      logo: '/assets/brand/tesla-wordmark.svg',
      emblem: '/assets/brand/tesla-emblem.svg',
      alt: 'Tesla',
      url: 'https://www.tesla.com'
    },
    /* ---- Secondary brand (right side of the lockup) ---- */
    secondary: {
      name: 'SPACEX',
      logo: '/assets/brand/spacex-wordmark.svg',
      emblem: null,
      alt: 'SpaceX',
      url: 'https://www.spacex.com'
    },
    /* ---- Document metadata ---- */
    titles: {
      home: 'Home | Tesla × SpaceX',
      markets: 'Markets | Tesla × SpaceX',
      contact: 'Contact | Tesla × SpaceX'
    },
    /* ---- Footer copyright line ---- */
    copyright: '© 2026 Tesla × SpaceX. All rights reserved.',
    /* ---- Site-wide strings that reference the brand ---- */
    tagline: 'Advanced trading infrastructure for digital markets.'
  };

  /* Expose for other scripts / debugging */
  window.BELL_BRAND = BRAND;

  /* Hydrate every marked hook as soon as the DOM is ready */
  function hydrate() {
    var i, el, role, value;

    var nodes = document.querySelectorAll('[data-brand]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      role = el.getAttribute('data-brand');       /* primary | secondary */
      value = BRAND[role];
      if (!value) continue;

      var field = el.getAttribute('data-brand-field') || 'name';
      if (field === 'name') {
        el.textContent = value.name;
      } else if (field === 'logo') {
        el.setAttribute('src', value.logo);
        el.setAttribute('alt', value.alt);
      } else if (field === 'emblem' && value.emblem) {
        el.setAttribute('src', value.emblem);
        el.setAttribute('alt', value.alt);
      } else if (field === 'href' && value.url) {
        el.setAttribute('href', value.url);
      }
    }

    /* Copyright line */
    var copy = document.querySelectorAll('[data-brand-copyright]');
    for (i = 0; i < copy.length; i++) copy[i].textContent = BRAND.copyright;

    /* Document title (only if the page declares a brand title slot) */
    if (document.body && document.body.getAttribute('data-brand-title')) {
      var key = document.body.getAttribute('data-brand-title');
      if (BRAND.titles[key]) document.title = BRAND.titles[key];
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
