document.addEventListener("DOMContentLoaded", () => {
  const API = "travel_recommendation_api.json";
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");
  const cardTitle = document.getElementById("cardTitle");
  const cardDescription = document.getElementById("cardDescription");
  const cardImage = document.getElementById("cardImage");
  const visitBtn = document.getElementById("visitBtn");
  const timeBadge = document.getElementById("timeBadge");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobileNav");
  const mobileBackdrop = document.getElementById("mobileBackdrop");
  const mobileClose = document.querySelector(".mobile-close");

  let data = [];
  let active = null;

  function updateTime(tz) {
    try {
      const now = new Date();
      const opts = {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const parts = new Intl.DateTimeFormat([], opts).format(now);
      timeBadge.textContent = `Current Local Time (${tz}): ${parts}`;
    } catch (e) {
      timeBadge.textContent = `Current Local Time: ${new Date().toLocaleTimeString()}`;
    }
  }

  function showEntry(entry) {
    if (!entry) return;
    active = entry;
    cardTitle.textContent = `${entry.city}, ${entry.country}`;
    cardDescription.textContent = entry.description;
    cardImage.style.backgroundImage = `url('${entry.image}')`;
    visitBtn.href = entry.url || "#";
    updateTime(entry.timezone || "UTC");
    if (window._timeInterval) clearInterval(window._timeInterval);
    window._timeInterval = setInterval(
      () => updateTime(entry.timezone || "UTC"),
      1000
    );
  }

  function findMatch(query) {
    if (!query) return data[0];
    const q = query.trim().toLowerCase();
    return (
      data.find(
        (it) =>
          (it.city && it.city.toLowerCase().includes(q)) ||
          (it.country && it.country.toLowerCase().includes(q))
      ) || null
    );
  }

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    if (mobileBackdrop) mobileBackdrop.hidden = false;
    document.body.classList.add("lock-scroll");
  }

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (mobileBackdrop) mobileBackdrop.hidden = true;
    document.body.classList.remove("lock-scroll");
  }

  // fetch data
  fetch(API)
    .then((r) => r.json())
    .then((json) => {
      data = json.cities || [];
      const defaultEntry =
        data.find((e) => e.city && e.city.toLowerCase().includes("toronto")) ||
        data[0];
      showEntry(defaultEntry);
    })
    .catch((err) => {
      console.error("Failed to load API JSON", err);
      cardTitle.textContent = "Data unavailable";
      cardDescription.textContent =
        "Unable to load destinations. Serve this page with a local HTTP server to allow fetching the JSON file.";
    });

  // search handlers
  if (searchBtn)
    searchBtn.addEventListener("click", () => {
      const q = searchInput.value;
      const match = findMatch(q);
      if (match) showEntry(match);
      else {
        cardTitle.textContent = "No results";
        cardDescription.textContent = `No destinations found for "${q}".`;
        cardImage.style.backgroundImage = "";
        timeBadge.textContent = "Current Local Time: --:--:--";
        if (window._timeInterval) clearInterval(window._timeInterval);
      }
    });
  if (clearBtn)
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      const fallback =
        data.find((e) => e.city && e.city.toLowerCase().includes("toronto")) ||
        data[0];
      showEntry(fallback);
    });

  if (searchInput)
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") searchBtn.click();
    });

  // Mobile nav handlers
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      if (expanded) closeMobileNav();
      else openMobileNav();
    });
  }

  // Mobile search controls inside the mobile nav
  const searchInputMobile = document.getElementById("searchInputMobile");
  const searchBtnMobile = document.getElementById("searchBtnMobile");
  const clearBtnMobile = document.getElementById("clearBtnMobile");

  if (searchBtnMobile) {
    searchBtnMobile.addEventListener("click", () => {
      const q = (searchInputMobile && searchInputMobile.value) || "";
      // mirror into main input for consistency
      if (searchInput) searchInput.value = q;
      const match = findMatch(q);
      if (match) showEntry(match);
      else {
        cardTitle.textContent = "No results";
        cardDescription.textContent = `No destinations found for "${q}".`;
        cardImage.style.backgroundImage = "";
        timeBadge.textContent = "Current Local Time: --:--:--";
        if (window._timeInterval) clearInterval(window._timeInterval);
      }
      // close menu after searching
      closeMobileNav();
    });
  }

  if (clearBtnMobile) {
    clearBtnMobile.addEventListener("click", () => {
      if (searchInputMobile) searchInputMobile.value = "";
      if (searchInput) searchInput.value = "";
      const fallback =
        data.find((e) => e.city && e.city.toLowerCase().includes("toronto")) ||
        data[0];
      showEntry(fallback);
      closeMobileNav();
    });
  }

  if (mobileBackdrop) mobileBackdrop.addEventListener("click", closeMobileNav);
  if (mobileClose) mobileClose.addEventListener("click", closeMobileNav);
  // close when nav link clicked
  if (mobileNav) {
    mobileNav
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", closeMobileNav));
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });
});
