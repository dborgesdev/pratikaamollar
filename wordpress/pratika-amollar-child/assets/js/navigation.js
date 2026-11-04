/* global document, window */
(() => {
  'use strict';
  const header = document.querySelector('[data-pa-header]');
  if (!header) return;
  const button = header.querySelector('.pa-menu-toggle');
  const nav = header.querySelector('#pa-main-navigation');
  if (!button || !nav) return;
  const mobile = window.matchMedia('(max-width: 767px)');
  const setOpen = (open, restoreFocus = false) => {
    header.classList.toggle('pa-menu-is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.hidden = mobile.matches && !open;
    if (restoreFocus) button.focus();
  };
  button.hidden = false;
  header.classList.add('pa-navigation-ready');
  setOpen(false);
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener('change', () => {
    const focusWillHide = mobile.matches && nav.contains(document.activeElement);
    setOpen(false, focusWillHide);
  });
})();
