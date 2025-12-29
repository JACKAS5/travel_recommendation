document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // DOM Elements
  // -------------------------------
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

  const searchInputMobile = document.getElementById("searchInputMobile");
  const searchBtnMobile = document.getElementById("searchBtnMobile");
  const clearBtnMobile = document.getElementById("clearBtnMobile");

  const API = "travel_recommendation_api.json";
  let data = [];

  // -------------------------------
  // Timezone Mapping
  // -------------------------------
  const timezoneMap = {
    sydney: "Australia/Sydney",
    melbourne: "Australia/Melbourne",
    tokyo: "Asia/Tokyo",
    kyoto: "Asia/Tokyo",
    rio: "America/Sao_Paulo",
    "são paulo": "America/Sao_Paulo",
    "sao paulo": "America/Sao_Paulo",
    angkor: "Asia/Phnom_Penh",
    "taj mahal": "Asia/Kolkata",
    "bora bora": "Pacific/Tahiti",
    copacabana: "America/Sao_Paulo",
  };

  // -------------------------------
  // Utility Functions
  // -------------------------------
  function guessTimezone(name) {
    if (!name) return "UTC";
    const n = name.toLowerCase();
    for (const key in timezoneMap) {
      if (n.includes(key)) return timezoneMap[key];
    }
    return "UTC";
  }

  function updateTime(timezone) {
    try {
      const now = new Date();
      const opts = {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      timeBadge.textContent = `Current Local Time (${timezone}): ${new Intl.DateTimeFormat([], opts).format(now)}`;
    } catch {
      timeBadge.textContent = `Current Local Time: ${new Date().toLocaleTimeString()}`;
    }
  }

  function showEntry(entry) {
    if (!entry) return;

    // Parse city and country
    let city = entry.city || "";
    let country = entry.country || "";
    if (!city && entry.name) {
      const parts = entry.name.split(",");
      city = parts[0].trim();
      country = (parts[1] || "").trim();
    }

    // Update card content
    cardTitle.textContent = city && country ? `${city}, ${country}` : entry.name || city || country;
    cardDescription.textContent = entry.description || "";
    cardImage.style.backgroundImage = entry.imageUrl ? `url('${entry.imageUrl}')` : "";

    // Add dynamic visit link
    visitBtn.href = entry.id && entry.type ? `visit.html?type=${entry.type}&id=${entry.id}` : "#";

    // Update local time
    const tz = entry.timezone || guessTimezone(entry.name || city);
    updateTime(tz);
    if (window._timeInterval) clearInterval(window._timeInterval);
    window._timeInterval = setInterval(() => updateTime(tz), 1000);
  }

  function findMatch(query) {
    if (!query) return data[0];
    const q = query.trim().toLowerCase();
    return (
      data.find(
        (it) =>
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.city && it.city.toLowerCase().includes(q)) ||
          (it.country && it.country.toLowerCase().includes(q))
      ) || null
    );
  }

  // -------------------------------
  // Search Handlers
  // -------------------------------
  function handleSearch(inputEl) {
    const q = (inputEl && inputEl.value) || "";
    const match = findMatch(q);

    if (match) {
      showEntry(match);
    } else {
      cardTitle.textContent = "No results";
      cardDescription.textContent = `No destinations found for "${q}".`;
      cardImage.style.backgroundImage = "";
      timeBadge.textContent = "Current Local Time: --:--:--";
      if (window._timeInterval) clearInterval(window._timeInterval);
    }
  }

  function handleClear(inputEl) {
    if (inputEl) inputEl.value = "";
    showEntry(data[0]);
  }

  // -------------------------------
  // Mobile Navigation
  // -------------------------------
  function openMobileNav() {
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    mobileBackdrop.hidden = false;
    document.body.classList.add("lock-scroll");
  }

  function closeMobileNav() {
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileBackdrop.hidden = true;
    document.body.classList.remove("lock-scroll");
  }

  // -------------------------------
  // Event Listeners
  // -------------------------------
  // Desktop search
  searchBtn?.addEventListener("click", () => handleSearch(searchInput));
  clearBtn?.addEventListener("click", () => handleClear(searchInput));
  searchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch(searchInput);
  });

  // Mobile search
  searchBtnMobile?.addEventListener("click", () => {
    handleSearch(searchInputMobile);
    closeMobileNav();
  });
  clearBtnMobile?.addEventListener("click", () => {
    handleClear(searchInputMobile);
    closeMobileNav();
  });

  // Mobile nav toggle
  menuToggle?.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    expanded ? closeMobileNav() : openMobileNav();
  });

  mobileBackdrop?.addEventListener("click", closeMobileNav);
  mobileClose?.addEventListener("click", closeMobileNav);
  mobileNav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });

  // -------------------------------
  // Fetch API Data
  // -------------------------------
  fetch(API)
    .then((res) => res.json())
    .then((json) => {
      const list = [];
      let idCounter = 1;

      // Normalize countries -> cities
      json.countries?.forEach((c) =>
        c.cities?.forEach((city) => {
          list.push({
            id: idCounter++,
            type: "city",
            name: city.name || "",
            city: (city.name || "").split(",")[0].trim(),
            country: (city.name || "").split(",")[1]?.trim() || c.name || "",
            imageUrl: city.imageUrl || city.image || "",
            description: city.description || "",
            timezone: city.timezone || guessTimezone(city.name || ""),
          });
        })
      );

      // Normalize temples
      json.temples?.forEach((t) => {
        list.push({
          id: idCounter++,
          type: "temple",
          name: t.name || "",
          imageUrl: t.imageUrl || "",
          description: t.description || "",
          timezone: t.timezone || guessTimezone(t.name || ""),
        });
      });

      // Normalize beaches
      json.beaches?.forEach((b) => {
        list.push({
          id: idCounter++,
          type: "beach",
          name: b.name || "",
          imageUrl: b.imageUrl || "",
          description: b.description || "",
          timezone: b.timezone || guessTimezone(b.name || ""),
        });
      });

      data = list;
      if (data.length > 0) showEntry(data[0]);
    })
    .catch((err) => {
      console.error("Failed to load API JSON", err);
      cardTitle.textContent = "Data unavailable";
      cardDescription.textContent = "Unable to load destinations. Serve this page via a local HTTP server.";
    });
});



document.addEventListener("DOMContentLoaded", () => {
  const API = "travel_recommendation_api.json";

  // --- Elements for travel recommendation page ---
  const cardTitle = document.getElementById("cardTitle");
  const cardDescription = document.getElementById("cardDescription");
  const cardImage = document.getElementById("cardImage");
  const timeBadge = document.getElementById("timeBadge");

  // --- Element for destination grid page ---
  const destinationCards = document.getElementById("destinationCards");

  // Utility function to guess timezone
  const timezoneMap = { /* ... your mapping ... */ };
  function guessTimezone(name) {
    if (!name) return "UTC";
    const n = name.toLowerCase();
    for (const key in timezoneMap) if (n.includes(key)) return timezoneMap[key];
    return "UTC";
  }

  function updateTime(timezone) {
    if (!timeBadge) return;
    try {
      const now = new Date();
      const opts = { timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
      timeBadge.textContent = `Current Local Time (${timezone}): ${new Intl.DateTimeFormat([], opts).format(now)}`;
    } catch {
      timeBadge.textContent = `Current Local Time: ${new Date().toLocaleTimeString()}`;
    }
  }

  function showEntry(entry) {
    if (!entry || !cardTitle) return;
    let city = entry.city || "";
    let country = entry.country || "";
    if (!city && entry.name) {
      const parts = entry.name.split(",");
      city = parts[0].trim();
      country = (parts[1] || "").trim();
    }
    cardTitle.textContent = city && country ? `${city}, ${country}` : entry.name || city || country;
    cardDescription.textContent = entry.description || "";
    cardImage.style.backgroundImage = entry.imageUrl ? `url('${entry.imageUrl}')` : "";
    const tz = entry.timezone || guessTimezone(entry.name || city);
    updateTime(tz);
    if (window._timeInterval) clearInterval(window._timeInterval);
    window._timeInterval = setInterval(() => updateTime(tz), 1000);
  }

  // --- Fetch API and populate ---
  fetch(API)
    .then(res => res.json())
    .then(json => {
      const list = [];
      let idCounter = 1;

      // countries -> cities
      json.countries?.forEach(c =>
        c.cities?.forEach(city =>
          list.push({
            id: idCounter++,
            type: "city",
            name: city.name || "",
            city: (city.name || "").split(",")[0].trim(),
            country: (city.name || "").split(",")[1]?.trim() || c.name || "",
            imageUrl: city.imageUrl || city.image || "",
            description: city.description || "",
            timezone: city.timezone || guessTimezone(city.name || ""),
          })
        )
      );

      // temples
      json.temples?.forEach(t =>
        list.push({
          id: idCounter++,
          type: "temple",
          name: t.name || "",
          imageUrl: t.imageUrl || "",
          description: t.description || "",
          timezone: t.timezone || guessTimezone(t.name || ""),
        })
      );

      // beaches
      json.beaches?.forEach(b =>
        list.push({
          id: idCounter++,
          type: "beach",
          name: b.name || "",
          imageUrl: b.imageUrl || "",
          description: b.description || "",
          timezone: b.timezone || guessTimezone(b.name || ""),
        })
      );

      // --- Show first card if on travel_recommendation.html ---
      if (cardTitle) showEntry(list[0]);

      // --- Render grid if on destination.html ---
      if (destinationCards) {
        destinationCards.innerHTML = "";
        list.forEach(entry => {
          const card = document.createElement("div");
          card.className = "destination-card";
          card.innerHTML = `
            <div class="card-image" style="background-image: url('${entry.imageUrl}')"></div>
            <div class="card-content">
              <h2>${entry.name}</h2>
              <p>${entry.description}</p>
            </div>
          `;
          destinationCards.appendChild(card);
        });
      }
    })
    .catch(err => {
      console.error("Failed to load API JSON", err);
      if (cardTitle) {
        cardTitle.textContent = "Data unavailable";
        cardDescription.textContent = "Unable to load destinations. Serve this page via a local HTTP server.";
      }
      if (destinationCards) {
        destinationCards.textContent =
          "Unable to load destinations. Serve this page via a local HTTP server.";
      }
    });
});
