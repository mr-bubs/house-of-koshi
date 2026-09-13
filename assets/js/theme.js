(function () {
  "use strict";

  const STORAGE_KEY = "house-of-koshi-theme";
  const root = document.documentElement;

  const systemTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function getSystemTheme() {
    return systemTheme.matches ? "dark" : "light";
  }

  function getActiveTheme() {
    const explicitTheme = root.getAttribute("data-theme");

    if (explicitTheme === "light" || explicitTheme === "dark") {
      return explicitTheme;
    }

    return getSystemTheme();
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      /* Theme still works during the current visit. */
    }
  }

  function updateToggle(button) {
    if (!button) {
      return;
    }

    const activeTheme = getActiveTheme();
    const darkModeActive = activeTheme === "dark";

    button.textContent = darkModeActive ? "☀︎" : "☾";

    button.setAttribute(
      "aria-label",
      darkModeActive
        ? "Switch to light mode"
        : "Switch to dark mode"
    );

    button.setAttribute(
      "title",
      darkModeActive
        ? "Switch to light mode"
        : "Switch to dark mode"
    );

    button.setAttribute(
      "aria-pressed",
      darkModeActive ? "true" : "false"
    );
  }

  function createToggle() {
    const nav = document.querySelector(".nav");

    if (!nav) {
      return null;
    }

    const existingToggle = nav.querySelector(".theme-toggle");

    if (existingToggle) {
      return existingToggle;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.className = "theme-toggle";

    nav.appendChild(button);

    updateToggle(button);

    button.addEventListener("click", function () {
      const currentTheme = getActiveTheme();
      const nextTheme =
        currentTheme === "dark" ? "light" : "dark";

      applyTheme(nextTheme);
      saveTheme(nextTheme);
      updateToggle(button);
    });

    return button;
  }

  const savedTheme = getSavedTheme();

  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(getSystemTheme());
  }

  function initialiseThemeControls() {
    const button = createToggle();
    updateToggle(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseThemeControls
    );
  } else {
    initialiseThemeControls();
  }

  function handleSystemThemeChange() {
    const savedPreference = getSavedTheme();

    if (savedPreference) {
      return;
    }

    applyTheme(getSystemTheme());

    const button =
      document.querySelector(".theme-toggle");

    updateToggle(button);
  }

  if (typeof systemTheme.addEventListener === "function") {
    systemTheme.addEventListener(
      "change",
      handleSystemThemeChange
    );
  } else if (typeof systemTheme.addListener === "function") {
    systemTheme.addListener(
      handleSystemThemeChange
    );
  }
})();