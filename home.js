/* ============================================================
   HOMEPAGE — live market data
   Preserves the original site's integrations:
   - CoinGecko simple/price (BTC, USDT) — 60s refresh
   - TradingView advanced chart (BINANCE:BTCUSDT)
   ============================================================ */
(function () {
  'use strict';

  var utils = window.BellUtils;
  if (!utils) return;

  /* Static fallback values = the actual values rendered by the
     original site before JS loads (never fabricated). */
  /* BTC + Tether stream live from CoinGecko. SpaceX and Tesla are
     concept tokens for this prototype — no public market data exists
     for them, so their tape/terminal values remain static. */
  var COINS = [
    {
      id: 'bitcoin', key: 'btc', pair: 'BTC/USDT', name: 'Bitcoin',
      priceEl: 'btc-market-price', changeEl: 'btc-market-change',
      volEl: 'btc-market-volume', highEl: 'btc-market-high',
      tape: 'tape-btc', spark: 'spark-btc',
      tradeUrl: 'https://bellbroker.ojojoarmanitech.com/user/trading/trade/BTCUSDT'
    },
    {
      id: 'tether', key: 'usdt', pair: 'USDT', name: 'Tether',
      priceEl: 'usdt-market-price', changeEl: 'usdt-market-change',
      volEl: 'usdt-market-volume', highEl: 'usdt-market-high',
      tape: 'tape-usdt', spark: 'spark-usdt',
      tradeUrl: 'https://bellbroker.ojojoarmanitech.com/user/trading'
    }
  ];

  var byId = {};
  COINS.forEach(function (c) { byId[c.id] = c; });

  function fmtVolume(v) {
    if (!v && v !== 0) return null;
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toLocaleString();
  }

  function render(coin, data) {
    var price = data.usd;
    var change = data.usd_24h_change || 0;
    var up = change >= 0;

    var priceEl = document.getElementById(coin.priceEl);
    var changeEl = document.getElementById(coin.changeEl);
    if (priceEl) {
      var prev = parseFloat((priceEl.textContent || '').replace(/[^0-9.]/g, ''));
      priceEl.textContent = utils.fmtUSD(price);
      if (!isNaN(prev) && prev !== price) utils.flash(priceEl, price > prev);
      priceEl.classList.toggle('is-up', up);
      priceEl.classList.toggle('is-down', !up);
    }
    utils.setChange(document.getElementById(coin.changeEl), change);

    var volEl = document.getElementById(coin.volEl);
    if (volEl && data.usd_24h_vol) {
      volEl.textContent = '24h Volume: $' + fmtVolume(data.usd_24h_vol);
    }
    var highEl = document.getElementById(coin.highEl);
    if (highEl && data.usd_24h_high) {
      highEl.textContent = '24h High: ' + utils.fmtUSD(data.usd_24h_high);
    }

    /* hero tape */
    var tape = document.getElementById(coin.tape);
    if (tape) {
      var px = tape.querySelector('.tape__px');
      var chg = tape.querySelector('.tape__chg');
      if (px) px.textContent = utils.fmtUSD(price);
      utils.setChange(chg, change);
    }
  }

  function fetchPrices() {
    var url = 'https://api.coingecko.com/api/v3/simple/price' +
      '?ids=bitcoin,tether' +
      '&vs_currencies=usd' +
      '&include_24hr_change=true' +
      '&include_24hr_vol=true' +
      '&include_24hr_high=true';
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        COINS.forEach(function (coin) {
          if (data[coin.id]) render(coin, data[coin.id]);
        });
      })
      .catch(function (err) { console.error('Price feed error:', err); });
  }

  /* 7-day sparklines (CoinGecko markets endpoint) */
  function fetchSparklines() {
    var url = 'https://api.coingecko.com/api/v3/coins/markets' +
      '?vs_currency=usd&ids=bitcoin,tether' +
      '&sparkline=true&price_change_percentage=24h';
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        (rows || []).forEach(function (row) {
          var coin = byId[row.id];
          if (!coin) return;
          var svg = document.querySelector('[data-spark="' + coin.key + '"]');
          if (svg && row.sparkline_in_7d && row.sparkline_in_7d.price) {
            /* downsample to ~40 points for a clean path */
            var pts = row.sparkline_in_7d.price;
            var step = Math.max(1, Math.floor(pts.length / 40));
            var sample = [];
            for (var i = 0; i < pts.length; i += step) sample.push(pts[i]);
            sample.push(pts[pts.length - 1]);
            window.drawSparkline(svg, sample, (row.price_change_percentage_24h || 0) >= 0);
          }
        });
      })
      .catch(function (err) { console.error('Sparkline feed error:', err); });
  }

  fetchPrices();
  fetchSparklines();
  setInterval(fetchPrices, 60000); /* same cadence as the original site */

  /* ---------- TradingView chart (original widget config) ---------- */
  function initChart() {
    var host = document.getElementById('tradingview_widget');
    if (!host || typeof TradingView === 'undefined') return;
    new TradingView.widget({
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_legend: true,
      save_image: false,
      container_id: 'tradingview_widget',
      backgroundColor: '#050505',
      gridColor: 'rgba(37,37,37,0.6)',
      studies: []
    });
  }
  if (document.readyState === 'complete') initChart();
  else window.addEventListener('load', initChart);
})();
