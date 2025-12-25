// ==UserScript==
// @name         FUCK YOU DELHI
// @namespace    MY DISCORD ID - 1185361879011434611 (or "wreg")
// @match        https://www.youtube.com/*
// @license      MIT
// @grant        none
// @run-at       document-start
// @description  Restores old YouTube player UI, but no lags
// @version      2.1.0
// ==/UserScript==

(function () {
  'use strict';

  console.log('[FXCKYOUDELHI] Starting optimized version');

  let cssInjected = false;
  let configCleaned = false;

  /* ==================== ONE-TIME CSS INJECTION =============== */
  function injectCSS() {
    if (cssInjected) return;

    const css = `
      .ytp-fullscreen-grid,
      .ytp-fullscreen-quick-actions {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      #movie_player.ytp-delhi-modern {
        --ytp-grid-scroll-percentage: 0 !important;
      }

      .ytp-chrome-bottom {
        bottom: 0 !important;
        opacity: 1 !important;
      }

      .ytp-gradient-bottom {
        display: none !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'yt-old-ui-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);

    cssInjected = true;
    console.log('[FXCKYOUDELHI] CSS injected');
  }

  /* ==================== CONFIG CLEANING =============== */
  function cleanYTConfig() {
    if (!window.yt || !window.yt.config_ || !window.yt.config_.WEB_PLAYER_CONTEXT_CONFIGS) {
      return false;
    }

    const configs = window.yt.config_.WEB_PLAYER_CONTEXT_CONFIGS;
    let cleaned = 0;

    for (const key in configs) {
      const cfg = configs[key];
      if (cfg && cfg.serializedExperimentFlags) {
        const original = cfg.serializedExperimentFlags;

        if (original.includes('delhi')) {
          cfg.serializedExperimentFlags = original
            .replace(/delhi_modern_web_player[^&]*/g, '')
            .replace(/&&+/g, '&')
            .replace(/^&|&$/g, '');
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log('[FXCKYOUDELHI] Cleaned', cleaned, 'configs');
      return true;
    }
    return false;
  }

  /* ==================== SMART OBSERVER =============== */
  let observer = null;

  function setupObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      let needsCleanup = false;

      for (const mutation of mutations) {
        // Check for class changes on player
        if (mutation.type === 'attributes' &&
            mutation.attributeName === 'class' &&
            mutation.target.id === 'movie_player') {

          const player = mutation.target;
          if (player.classList.contains('ytp-delhi-modern')) {
            player.classList.remove('ytp-delhi-modern');
            console.log('[FXCKYOUDELHI] Removed delhi-modern class');
          }
        }

        // Check for new Delhi elements
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const el = node;

              // Check if it's a Delhi element
              if (el.classList && (
                  el.classList.contains('ytp-fullscreen-quick-actions') ||
                  el.classList.contains('ytp-fullscreen-grid'))) {
                el.remove();
                console.log('[FXCKYOUDELHI] Blocked Delhi element');
                needsCleanup = true;
              }

              // Check descendants
              const delhiChildren = el.querySelectorAll && el.querySelectorAll(
                '.ytp-fullscreen-quick-actions, .ytp-fullscreen-grid'
              );
              if (delhiChildren && delhiChildren.length > 0) {
                delhiChildren.forEach(child => child.remove());
                console.log('[FXCKYOUDELHI] Removed', delhiChildren.length, 'Delhi elements');
                needsCleanup = true;
              }
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });

    console.log('[FXCKYOUDELHI] Observer started');
  }

  /* ==================== INITIALIZATION =============== */

  // Inject CSS immediately
  injectCSS();

  // Clean config once on load
  const configInterval = setInterval(() => {
    if (cleanYTConfig()) {
      configCleaned = true;
      clearInterval(configInterval);
    }
  }, 200);

  // Stop trying after 10 seconds
  setTimeout(() => {
    clearInterval(configInterval);
  }, 10000);

  // Setup observer when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }

  // Clean on YouTube navigation
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      injectCSS();
      cleanYTConfig();

      // One-time cleanup after navigation
      const player = document.getElementById('movie_player');
      if (player && player.classList.contains('ytp-delhi-modern')) {
        player.classList.remove('ytp-delhi-modern');
      }

      document.querySelectorAll('.ytp-fullscreen-quick-actions, .ytp-fullscreen-grid')
        .forEach(el => el.remove());
    }, 100);
  }, true);

  console.log('[FXCKYOUDELHI] Initialized (optimized mode)');

})();