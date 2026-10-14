/* ==========================================================================
   Kanji — Developer Portfolio
   script.js
   --------------------------------------------------------------------------
   Table of contents
   1.  Setup & helpers
   2.  Copyright year
   3.  Header scroll state
   4.  Mobile navigation menu
   5.  Smooth scrolling with fixed-header offset
   6.  Active navigation link highlighting
   7.  Scroll-triggered reveal animations
   8.  Back-to-top button
   9.  Contact form validation & mailto workflow
   10. Initialisation
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     1. Setup & helpers
     ======================================================================== */

  /** Tracks the user's reduced-motion preference and stays up to date. */
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** True when the visitor has asked the OS/browser to reduce motion. */
  function prefersReducedMotion() {
    return motionQuery.matches;
  }

  /** Smooth-scroll duration used when motion is allowed. */
  const SCROLL_DURATION_MS = 650;

  /** Sections that participate in navigation and reveal animations. */
  const sectionSelectors = ['#home', '#about', '#skills', '#projects', '#services', '#contact'];

  /**
   * Eased scroll from the current position to a target Y offset.
   * Falls back to an instant jump when the user prefers reduced motion
   * or when the browser has no requestAnimationFrame.
   */
  function animateScrollTo(targetY) {
    const startY = window.scrollY;
    const distance = targetY - startY;

    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') {
      window.scrollTo(0, targetY);
      return;
    }

    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
      // easeInOutCubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  /**
   * Scrolls to a hash target, accounting for the fixed header.
   * Returns false when the target does not exist (so the browser can
   * handle the link normally).
   */
  function scrollToTarget(hash) {
    const target = document.querySelector(hash);
    if (!target) return false;

    const header = document.getElementById('site-header');
    const headerOffset = header ? header.offsetHeight + 12 : 0;
    const targetY = Math.max(
      target.getBoundingClientRect().top + window.scrollY - headerOffset,
      0
    );

    animateScrollTo(targetY);

    // Keep the URL in sync without adding extra history entries.
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', hash);
    }

    return true;
  }

  /* ========================================================================
     2. Copyright year
     ======================================================================== */
  function setCurrentYear() {
    const yearSlot = document.getElementById('year');
    if (yearSlot) {
      yearSlot.textContent = String(new Date().getFullYear());
    }
  }

  /* ========================================================================
     3. Header scroll state
     ======================================================================== */
  function initHeaderScrollState() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  /* ========================================================================
     4. Mobile navigation menu
     ======================================================================== */
  function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    const DESKTOP_BREAKPOINT = 900;

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      document.body.classList.add('menu-open');
    }

    function closeMenu(options) {
      const restoreFocus = options && options.restoreFocus;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      document.body.classList.remove('menu-open');
      if (restoreFocus) toggle.focus();
    }

    // Open / close from the hamburger button.
    toggle.addEventListener('click', function () {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close whenever a navigation link is chosen.
    nav.addEventListener('click', function (event) {
      const link = event.target.closest('a');
      if (link) closeMenu();
    });

    // Close on Escape and hand focus back to the button (keyboard support).
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        closeMenu({ restoreFocus: true });
      }
    });

    // Close when clicking/tapping outside the menu.
    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu();
      }
    });

    // Reset state when resizing past the mobile breakpoint.
    window.addEventListener('resize', function () {
      if (window.innerWidth > DESKTOP_BREAKPOINT && isOpen()) {
        closeMenu();
      }
    });
  }

  /* ========================================================================
     5. Smooth scrolling with fixed-header offset
     ======================================================================== */
  function initSmoothScrolling() {
    document.addEventListener('click', function (event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      // Only handle in-page anchors that point at real sections.
      if (!document.querySelector(hash)) return;

      event.preventDefault();
      scrollToTarget(hash);

      // Move focus to the target so keyboard and screen-reader users follow along.
      const target = document.querySelector(hash);
      const focusTarget = target.querySelector('h1, h2, [tabindex]')
        ? target.querySelector('h1, h2, [tabindex]')
        : target;
      if (focusTarget) {
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      }
    });

    // Handle a deep link present in the URL on first load.
    if (window.location.hash) {
      window.setTimeout(function () {
        scrollToTarget(window.location.hash);
      }, 60);
    }
  }

  /* ========================================================================
     6. Active navigation link highlighting
     ======================================================================== */
  function initActiveLinkHighlighting() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    if (!navLinks.length) return;

    const sections = sectionSelectors
      .map(function (selector) {
        return document.querySelector(selector);
      })
      .filter(Boolean);

    if (!sections.length || typeof IntersectionObserver !== 'function') return;

    function setActive(hashId) {
      navLinks.forEach(function (link) {
        const isCurrent = link.getAttribute('href') === '#' + hashId;
        link.classList.toggle('is-active', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      {
        // Focus on the middle band of the viewport so the switch feels natural.
        rootMargin: '-45% 0px -50% 0px',
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ========================================================================
     7. Scroll-triggered reveal animations
     ======================================================================== */
  function initRevealAnimations() {
    const revealElements = document.querySelectorAll('[data-reveal]');
    if (!revealElements.length) return;

    // Reduced motion (or no IntersectionObserver): show everything immediately.
    if (prefersReducedMotion() || typeof IntersectionObserver !== 'function') {
      revealElements.forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, currentObserver) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.12 }
    );

    revealElements.forEach(function (element) {
      observer.observe(element);
    });

    // If the visitor enables reduced motion later, stop hiding content.
    motionQuery.addEventListener('change', function (event) {
      if (event.matches) {
        revealElements.forEach(function (element) {
          element.classList.add('is-visible');
        });
        observer.disconnect();
      }
    });
  }

  /* ========================================================================
     8. Back-to-top button
     ======================================================================== */
  function initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    let ticking = false;

    function update() {
      button.classList.toggle('is-visible', window.scrollY > 600);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    button.addEventListener('click', function () {
      animateScrollTo(0);
      const logo = document.querySelector('.site-header .logo');
      if (logo) logo.focus({ preventScroll: true });
    });

    update();
  }

  /* ========================================================================
     9. Contact form validation & mailto workflow
     ------------------------------------------------------------------------
     NOTE — connecting a real back end
     ---------------------------------
     This is a static site, so there is no server. On a valid submission the
     form opens the visitor's email app (mailto:) with the message pre-filled
     for woselittle@gmail.com, and it says so honestly in the status message.

     To send messages straight from the page instead, sign up for a free form
     service (Formspree, Getform, Netlify Forms, EmailJS …) and replace the
     "mailto workflow" block below with a fetch() call, for example:

       await fetch('https://formspree.io/f/YOUR_FORM_ID', {
         method: 'POST',
         headers: { 'Accept': 'application/json' },
         body: new FormData(contactForm)
       });

     Then update the success message to confirm the real submission.
     ======================================================================== */

  const FORM_CONFIG = {
    recipient: 'woselittle@gmail.com',
    successMessage:
      'Your email app is opening with the message pre-filled — press Send there and it will reach me. ' +
      'If nothing opened, please email woselittle@gmail.com directly.',
    errorMessage:
      'Something went wrong opening your email app. Please email woselittle@gmail.com directly.'
  };

  /** Validation rules for each field, written as reusable functions. */
  const validators = {
    name: function (value) {
      if (!value) return 'Please enter your name.';
      if (value.length < 2) return 'Your name needs at least 2 characters.';
      return '';
    },
    email: function (value) {
      if (!value) return 'Please enter your email address.';
      // Practical email pattern: something@something.tld
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!pattern.test(value)) return 'Please enter a valid email address.';
      return '';
    },
    subject: function (value) {
      if (!value) return 'Please add a subject.';
      if (value.length < 3) return 'The subject needs at least 3 characters.';
      return '';
    },
    message: function (value) {
      if (!value) return 'Please write a message.';
      if (value.length < 10) return 'Please write at least 10 characters.';
      return '';
    }
  };

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitButton = document.getElementById('submit-btn');
    const statusBox = document.getElementById('form-status');
    const fields = Object.keys(validators)
      .map(function (name) {
        return form.elements.namedItem(name);
      })
      .filter(Boolean);

    /** Shows or clears the inline error for a single field. */
    function showFieldError(field, message) {
      const errorBox = document.getElementById(field.id + '-error');
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        if (errorBox) errorBox.textContent = message;
      } else {
        field.removeAttribute('aria-invalid');
        if (errorBox) errorBox.textContent = '';
      }
    }

    /** Validates one field and returns true when it is valid. */
    function validateField(field) {
      const rule = validators[field.name];
      if (!rule) return true;
      const message = rule(field.value.trim());
      showFieldError(field, message);
      return message === '';
    }

    /** Sets the accessible status message under the form. */
    function setStatus(message, type) {
      if (!statusBox) return;
      statusBox.textContent = message;
      statusBox.classList.remove('is-error', 'is-success');
      if (type) statusBox.classList.add(type === 'error' ? 'is-error' : 'is-success');
    }

    /** Builds a mailto: link containing the composed enquiry. */
    function buildMailtoLink(data) {
      const subject = encodeURIComponent('[' + data.subject + '] Enquiry from ' + data.name);
      const body = encodeURIComponent(
        'Name: ' + data.name + '\n' +
        'Email: ' + data.email + '\n\n' +
        data.message + '\n\n' +
        '— Sent from the kanji.dev portfolio contact form'
      );
      return 'mailto:' + FORM_CONFIG.recipient + '?subject=' + subject + '&body=' + body;
    }

    // Validate on blur; re-validate while fixing an existing error.
    fields.forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });

      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
        if (statusBox && statusBox.classList.contains('is-error')) {
          setStatus('');
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      let firstInvalidField = null;

      fields.forEach(function (field) {
        const isValid = validateField(field);
        if (!isValid && !firstInvalidField) {
          firstInvalidField = field;
        }
      });

      if (firstInvalidField) {
        setStatus('Please fix the highlighted fields and try again.', 'error');
        firstInvalidField.focus();
        return;
      }

      const data = {
        name: form.elements.namedItem('name').value.trim(),
        email: form.elements.namedItem('email').value.trim(),
        subject: form.elements.namedItem('subject').value.trim(),
        message: form.elements.namedItem('message').value.trim()
      };

      // Brief loading feedback before handing off to the email app.
      if (submitButton) submitButton.classList.add('is-loading');
      setStatus('Preparing your email…', null);

      window.setTimeout(function () {
        try {
          const mailtoLink = buildMailtoLink(data);
          window.location.href = mailtoLink;
          setStatus(FORM_CONFIG.successMessage, 'success');
        } catch (error) {
          setStatus(FORM_CONFIG.errorMessage, 'error');
        } finally {
          if (submitButton) submitButton.classList.remove('is-loading');
        }
      }, 500);
    });
  }

  /* ========================================================================
     10. Initialisation
     ======================================================================== */
  function init() {
    setCurrentYear();
    initHeaderScrollState();
    initMobileMenu();
    initSmoothScrolling();
    initActiveLinkHighlighting();
    initRevealAnimations();
    initBackToTop();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
