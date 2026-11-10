/* ============================================================
   MARKETS PAGE — full market table
   Preserves the original site's data pipeline exactly:
   - Huobi /v1/common/symbols → online USDT pairs
   - CoinGecko /coins/markets → prices, highs, lows, volume
   - Search, BTC/ETH/BNB filters, pagination (20/page)
   - 60 second auto-refresh
   Trade links → existing /user/trading/trade/{PAIR} route
   ============================================================ */
(function () {
  'use strict';

  var tableBody = document.getElementById('markets-table-body');
  var searchInput = document.getElementById('search');
  var filterButtons = document.querySelectorAll('.market-filter');
  var paginationContainer = document.getElementById('pagination');
  var countEl = document.getElementById('markets-count');
  var stateEl = document.getElementById('markets-state');
  if (!tableBody) return;

  var allMarkets = [];
  var displayedMarkets = [];
  var currentPage = 1;
  var pageSize = 20;
  var activeFilter = 'All';
  var TRADE_BASE = 'https://bellbroker.ojojoarmanitech.com/user/trading/trade/';

  function setState(msg, loading) {
    if (!stateEl) return;
    if (!msg) { stateEl.hidden = true; return; }
    stateEl.hidden = false;
    stateEl.innerHTML = (loading ? '<div class="spinner" aria-hidden="true"></div>' : '') +
      '<span>' + msg + '</span>';
  }

  async function fetchMarketData() {
    setState('Loading live market data…', true);
    try {
      var huobiResponse = await fetch('https://api.huobi.pro/v1/common/symbols');
      if (!huobiResponse.ok) throw new Error('Failed to fetch Huobi symbols');
      var huobiData = await huobiResponse.json();

      var validHuobiPairs = huobiData.data
        .filter(function (s) { return s['quote-currency'] === 'usdt' && s.state === 'online'; })
        .map(function (s) {
          return {
            symbol: s['base-currency'].toUpperCase(),
            pair: s['base-currency'].toUpperCase() + '/USDT'
          };
        });

      var coingeckoResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
      );
      var coingeckoData = await coingeckoResponse.json();

      var coingeckoMap = new Map(
        coingeckoData
          .filter(function (c) {
            var sym = c.symbol.toLowerCase();
            return ['wsteth', 'weth', 'steth'].indexOf(sym) === -1 && sym.indexOf('w') !== 0;
          })
          .map(function (c) { return [c.symbol.toUpperCase(), c]; })
      );

      allMarkets = validHuobiPairs
        .filter(function (p) { return coingeckoMap.has(p.symbol); })
        .map(function (p) {
          var c = coingeckoMap.get(p.symbol);
          return {
            id: c.id,
            pair: p.pair,
            name: c.name,
            price: c.current_price,
            priceLabel: c.current_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            change24h: c.price_change_percentage_24h || 0,
            high24h: c.high_24h,
            low24h: c.low_24h,
            volume24h: c.total_volume,
            volumeLabel: c.total_volume.toLocaleString('en-US', { notation: 'compact', compactDisplay: 'short' }),
            icon: c.image
          };
        });

      applyFilters();
      setState(null);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setState('Live data is temporarily unavailable. Please retry in a moment.', false);
    }
  }

  function applyFilters() {
    var term = (searchInput && searchInput.value ? searchInput.value : '').toLowerCase().trim();
    displayedMarkets = allMarkets.filter(function (m) {
      var matchesSearch = !term ||
        m.name.toLowerCase().indexOf(term) !== -1 ||
        m.pair.toLowerCase().indexOf(term) !== -1;
      var matchesFilter = activeFilter === 'All' || m.pair.indexOf(activeFilter) !== -1;
      return matchesSearch && matchesFilter;
    });
    currentPage = 1;
    renderMarkets();
  }

  function changeLabel(v) {
    return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
  }

  function renderMarkets() {
    var start = (currentPage - 1) * pageSize;
    var pageData = displayedMarkets.slice(start, start + pageSize);

    if (countEl) {
      countEl.textContent = displayedMarkets.length + ' pairs';
    }

    if (!pageData.length) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:2.5rem 1rem;">No markets match your search.</td></tr>';
      renderPagination();
      return;
    }

    tableBody.innerHTML = pageData.map(function (m) {
      var pairForUrl = m.pair.replace('/', '');
      var up = m.change24h >= 0;
      return `
        <tr>
          <td class="pair-td">
            <div class="pair-cell">
              <img src="${m.icon}" alt="" loading="lazy" width="30" height="30">
              <div>
                <div class="pair-name">${m.pair}</div>
                <div class="pair-full">${m.name}</div>
              </div>
            </div>
          </td>
          <td class="num" data-label="Price">${m.priceLabel}</td>
          <td class="num ${up ? 'is-up' : 'is-down'}" data-label="24h Change">${changeLabel(m.change24h)}</td>
          <td class="num" data-label="24h High">${m.high24h.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
          <td class="num" data-label="24h Low">${m.low24h.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
          <td class="num" data-label="24h Volume">${m.volumeLabel}</td>
          <td class="action-td" data-label="Action">
            <a class="trade-link" href="${TRADE_BASE}${pairForUrl}">Trade</a>
          </td>
        </tr>`;
    }).join('');

    renderPagination();
  }

  function renderPagination() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    var totalPages = Math.ceil(displayedMarkets.length / pageSize);
    if (totalPages <= 1) return;

    var mk = function (label, page, opts) {
      opts = opts || {};
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (opts.active) b.classList.add('is-active');
      if (opts.disabled) b.disabled = true;
      if (opts.aria) b.setAttribute('aria-label', opts.aria);
      b.addEventListener('click', function () {
        currentPage = page;
        renderMarkets();
        var el = document.querySelector('.table-wrap');
        if (el) el.scrollIntoView({ behavior: window.BellUtils.reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      return b;
    };

    paginationContainer.appendChild(
      mk('Prev', Math.max(1, currentPage - 1), { disabled: currentPage === 1, aria: 'Previous page' })
    );

    /* windowed page numbers: 1 … 4 5 6 … N */
    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      var from = Math.max(2, currentPage - 1);
      var to = Math.min(totalPages - 1, currentPage + 1);
      if (from > 2) pages.push('…');
      for (var p = from; p <= to; p++) pages.push(p);
      if (to < totalPages - 1) pages.push('…');
      pages.push(totalPages);
    }
    pages.forEach(function (pg) {
      if (pg === '…') {
        var span = document.createElement('span');
        span.textContent = '…';
        span.style.color = 'var(--text-2)';
        span.style.padding = '0 0.35rem';
        paginationContainer.appendChild(span);
      } else {
        paginationContainer.appendChild(
          mk(String(pg), pg, { active: pg === currentPage, aria: 'Page ' + pg })
        );
      }
    });

    paginationContainer.appendChild(
      mk('Next', Math.min(totalPages, currentPage + 1), {
        disabled: currentPage === totalPages, aria: 'Next page'
      })
    );
  }

  /* Search (debounced) */
  var debounce;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(applyFilters, 180);
    });
  }

  /* Filter chips */
  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      filterButtons.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
      activeFilter = button.getAttribute('data-filter') || 'All';
      applyFilters();
    });
  });

  fetchMarketData();
  setInterval(fetchMarketData, 60000); /* same cadence as the original site */
})();
