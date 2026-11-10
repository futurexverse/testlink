/* ============================================================
   TESLA × SPACEX — BELL INVEST TEMPORARY REBRAND
   Shared behaviour: navigation, reveals, counters, tape
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation: transparent → solid on scroll ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.nav__burger');
  var mobile = document.querySelector('.nav__mobile');
  if (burger && mobile) {
    var setOpen = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      mobile.classList.toggle('is-open', open);
      if (nav) nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    mobile.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Stat count-up (actual values only) ---------- */
  var stats = document.querySelectorAll('[data-count]');
  if (stats.length) {
    var animate = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduceMotion) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      var duration = 1600;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4); /* easeOutQuart */
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      stats.forEach(animate);
    } else {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            sio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      stats.forEach(function (el) { sio.observe(el); });
    }
  }

  /* ---------- Sparkline drawing (progressive stroke) ---------- */
  window.drawSparkline = function (svg, points, positive) {
    if (!svg || !points || points.length < 2) return;
    var w = 130, h = 36, pad = 3;
    var min = Math.min.apply(null, points);
    var max = Math.max.apply(null, points);
    var range = max - min || 1;
    var d = '';
    for (var i = 0; i < points.length; i++) {
      var x = pad + (i / (points.length - 1)) * (w - pad * 2);
      var y = h - pad - ((points[i] - min) / range) * (h - pad * 2);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.innerHTML = '<path d="' + d + '" stroke="' +
      (positive ? '#4ade80' : '#f87171') + '" />';
    var path = svg.querySelector('path');
    if (path && !reduceMotion) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
      });
    }
  };

  /* ---------- Helpers shared with page scripts ---------- */
  window.BellUtils = {
    reduceMotion: reduceMotion,
    fmtUSD: function (n) {
      return '$' + n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    fmtCompact: function (n) {
      if (!n && n !== 0) return '—';
      if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
      if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
      return '$' + n.toFixed(2);
    },
    fmtChange: function (n) {
      var v = (n || 0).toFixed(2) + '%';
      return (n >= 0 ? '+' : '') + v;
    },
    setChange: function (el, value) {
      if (!el) return;
      el.textContent = window.BellUtils.fmtChange(value);
      el.classList.toggle('is-up', value >= 0);
      el.classList.toggle('is-down', value < 0);
    },
    flash: function (el, up) {
      if (!el || reduceMotion) return;
      var cls = up ? 'tick-up' : 'tick-down';
      el.classList.remove('tick-up', 'tick-down');
      void el.offsetWidth; /* restart animation */
      el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, 950);
    }
  };
})();
