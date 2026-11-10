/* ============================================================
   CONTACT PAGE — form validation
   Preserves the original form's fields and required rules
   (name, email, message). Posts to the platform's /contact
   route when hosted on the application domain; otherwise
   falls back to a mailto: hand-off so the form still works
   as a standalone prototype.
   ============================================================ */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var endpoint = form.getAttribute('action') || '/contact';

  function showError(input, message) {
    input.setAttribute('aria-invalid', 'true');
    var err = document.getElementById(input.id + '-error');
    if (err) {
      err.textContent = message;
      err.classList.add('is-visible');
    }
  }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    var err = document.getElementById(input.id + '-error');
    if (err) err.classList.remove('is-visible');
  }

  function setStatus(msg, type) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status is-visible' + (type ? ' is-' + type : '');
  }

  function validate() {
    var ok = true;
    var name = form.elements.namedItem('name');
    var email = form.elements.namedItem('email');
    var message = form.elements.namedItem('message');

    if (!name.value.trim()) {
      showError(name, 'Please enter your name.');
      ok = false;
    } else clearError(name);

    if (!email.value.trim()) {
      showError(email, 'Please enter your email address.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      ok = false;
    } else clearError(email);

    if (!message.value.trim()) {
      showError(message, 'Please enter your message.');
      ok = false;
    } else clearError(message);

    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      return;
    }

    var data = new FormData(form);

    /* Same-origin deployment → real backend endpoint */
    if (window.location.hostname === 'bellbroker.ojojoarmanitech.com') {
      setStatus('Sending…');
      fetch(endpoint, { method: 'POST', body: data, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) {
          if (!r.ok) throw new Error('Request failed');
          form.reset();
          setStatus('Message sent. Our team will get back to you shortly.', 'success');
        })
        .catch(function () {
          setStatus('Your message could not be sent right now. Please email support@domain.com.', 'error');
        });
      return;
    }

    /* Standalone prototype → hand off to the platform inbox */
    var subject = encodeURIComponent('Bell Invest enquiry from ' + data.get('name'));
    var body = encodeURIComponent(
      'Name: ' + data.get('name') + '\n' +
      'Email: ' + data.get('email') + '\n\n' +
      data.get('message')
    );
    window.location.href = 'mailto:support@domain.com?subject=' + subject + '&body=' + body;
    setStatus('Opening your email client to deliver this message to support@domain.com…', 'success');
  });

  /* clear errors while typing */
  ['name', 'email', 'message'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { clearError(input); });
  });
})();
