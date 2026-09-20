let currentSubject = null;
let allResources = [];

/* =========================================================
   LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", loadResources);

async function loadResources() {
  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("subject");

  if (!subjectId) {
    document.getElementById("resourcesContainer").innerHTML = `
      <div class="loading-card">
        Invalid Subject
      </div>
    `;
    return;
  }

  try {
    /* =====================================================
       SUBJECT
    ===================================================== */

    const { data: subject, error: subjectError } = await supabaseClient
      .from("subjects")
      .select(
        `
        id,
        name,
        description
      `
      )
      .eq("id", subjectId)
      .single();

    if (subjectError) {
      throw subjectError;
    }

    currentSubject = subject;

    document.getElementById("subjectTitle").innerText =
      subject.name || "Subject";

    document.title = `${subject.name || "Subject"} | E-Gyan`;

    /* =====================================================
       SUBJECT DESCRIPTION
    ===================================================== */

    const description =
      subject.description ||
      "Explore all available learning resources for this subject.";

    const descriptionElement = document.getElementById("subjectDescription");

    const descriptionButton = document.getElementById("subjectDescriptionBtn");

    descriptionElement.innerText = description;

    if (description.length > 180) {
      descriptionElement.classList.add("collapsed");

      descriptionButton.style.display = "inline-flex";

      descriptionButton.innerText = "Show more ↓";
    } else {
      descriptionElement.classList.remove("collapsed");

      descriptionButton.style.display = "none";
    }

    /* =====================================================
       LOAD RESOURCES
    ===================================================== */

    const { data: resources, error: resourceError } = await supabaseClient
      .from("resources")
      .select("*")
      .eq("subject_id", subjectId)
      .order("year", {
        ascending: false,
      })
      .order("upload_date", {
        ascending: false,
      })
      .order("display_order", {
        ascending: true,
      });

    if (resourceError) {
      throw resourceError;
    }

    allResources = resources || [];

    /* =====================================================
       BUILD FILTERS
    ===================================================== */

    buildFilters(allResources);

    /* =====================================================
       RENDER
    ===================================================== */

    renderResources(allResources);
  } catch (error) {
    console.error("RESOURCE PAGE ERROR:", error);

    document.getElementById("resourcesContainer").innerHTML = `
      <div class="loading-card">
        Failed to load resources.
      </div>
    `;
  }
}

/* =========================================================
   SUBJECT DESCRIPTION SHOW MORE
========================================================= */

function toggleSubjectDescription() {
  const description = document.getElementById("subjectDescription");

  const button = document.getElementById("subjectDescriptionBtn");

  if (!description || !button) {
    return;
  }

  const expanded = description.classList.contains("expanded");

  if (expanded) {
    description.classList.remove("expanded");
    description.classList.add("collapsed");

    button.innerText = "Show more ↓";
  } else {
    description.classList.remove("collapsed");
    description.classList.add("expanded");

    button.innerText = "Show less ↑";
  }
}

/* =========================================================
   BUILD FILTERS
========================================================= */

function buildFilters(resources) {
  const yearFilter = document.getElementById("resourceYearFilter");

  const categoryFilter = document.getElementById("resourceCategoryFilter");

  if (!yearFilter || !categoryFilter) {
    return;
  }

  /* -------------------------------------------------------
     YEARS
  ------------------------------------------------------- */

  const years = [
    ...new Set(
      resources
        .map((resource) => resource.year)
        .filter((year) => year !== null && year !== undefined && year !== "")
    ),
  ].sort((a, b) => Number(b) - Number(a));

  yearFilter.innerHTML = `
    <option value="all">All Years</option>
  `;

  years.forEach((year) => {
    yearFilter.innerHTML += `
      <option value="${escapeAttribute(year)}">
        ${escapeHtml(year)}
      </option>
    `;
  });

  /* -------------------------------------------------------
     CATEGORIES
  ------------------------------------------------------- */

  const categories = [
    ...new Set(
      resources
        .map((resource) => resource.category)
        .filter(
          (category) =>
            category !== null && category !== undefined && category !== ""
        )
    ),
  ].sort();

  categoryFilter.innerHTML = `
    <option value="all">All Resources</option>
  `;

  categories.forEach((category) => {
    categoryFilter.innerHTML += `
      <option value="${escapeAttribute(category)}">
        ${escapeHtml(category)}
      </option>
    `;
  });
}

/* =========================================================
   APPLY FILTERS
========================================================= */

function applyResourceFilters() {
  const searchInput = document.getElementById("resourceSearch");

  const yearFilter = document.getElementById("resourceYearFilter");

  const typeFilter = document.getElementById("resourceTypeFilter");

  const categoryFilter = document.getElementById("resourceCategoryFilter");

  const sortFilter = document.getElementById("resourceSortFilter");

  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const selectedYear = yearFilter ? yearFilter.value : "all";

  const selectedType = typeFilter ? typeFilter.value : "all";

  const selectedCategory = categoryFilter ? categoryFilter.value : "all";

  const selectedSort = sortFilter ? sortFilter.value : "newest";

  let filtered = [...allResources];

  /* =====================================================
     SEARCH
  ===================================================== */

  if (search) {
    filtered = filtered.filter((resource) => {
      const title = String(resource.title || "").toLowerCase();

      const category = String(resource.category || "").toLowerCase();

      const type = String(resource.type || "").toLowerCase();

      return (
        title.includes(search) ||
        category.includes(search) ||
        type.includes(search)
      );
    });
  }

  /* =====================================================
     YEAR
  ===================================================== */

  if (selectedYear !== "all") {
    filtered = filtered.filter(
      (resource) => String(resource.year || "") === selectedYear
    );
  }

  /* =====================================================
     TYPE
  ===================================================== */

  if (selectedType !== "all") {
    filtered = filtered.filter((resource) => {
      const type = String(resource.type || "").toLowerCase();

      if (selectedType === "pdf") {
        return type === "pdf";
      }

      if (selectedType === "link") {
        return type !== "pdf";
      }

      return true;
    });
  }

  /* =====================================================
     CATEGORY
  ===================================================== */

  if (selectedCategory !== "all") {
    filtered = filtered.filter(
      (resource) => String(resource.category || "") === selectedCategory
    );
  }

  /* =====================================================
     SORT
  ===================================================== */

  filtered.sort((a, b) => {
    const dateA = getResourceDate(a);
    const dateB = getResourceDate(b);

    if (selectedSort === "oldest") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });

  renderResources(filtered);
}

/* =========================================================
   RESET FILTERS
========================================================= */

function resetResourceFilters() {
  const searchInput = document.getElementById("resourceSearch");

  const yearFilter = document.getElementById("resourceYearFilter");

  const typeFilter = document.getElementById("resourceTypeFilter");

  const categoryFilter = document.getElementById("resourceCategoryFilter");

  const sortFilter = document.getElementById("resourceSortFilter");

  if (searchInput) {
    searchInput.value = "";
  }

  if (yearFilter) {
    yearFilter.value = "all";
  }

  if (typeFilter) {
    typeFilter.value = "all";
  }

  if (categoryFilter) {
    categoryFilter.value = "all";
  }

  if (sortFilter) {
    sortFilter.value = "newest";
  }

  renderResources(allResources);
}

/* =========================================================
   GET RESOURCE DATE
========================================================= */

function getResourceDate(resource) {
  if (resource.upload_date) {
    const date = new Date(resource.upload_date).getTime();

    if (!isNaN(date)) {
      return date;
    }
  }

  if (resource.year) {
    const yearDate = new Date(Number(resource.year), 0, 1).getTime();

    if (!isNaN(yearDate)) {
      return yearDate;
    }
  }

  return 0;
}

/* =========================================================
   RENDER RESOURCES
========================================================= */

function renderResources(resources) {
  const container = document.getElementById("resourcesContainer");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  /* -------------------------------------------------------
     NO RESULTS
  ------------------------------------------------------- */

  if (!resources || resources.length === 0) {
    container.innerHTML = `
      <div class="empty-resource">
        <div class="empty-icon">
          🔍
        </div>

        <h3>
          No Resources Found
        </h3>

        <p>
          Try changing your search or filters.
        </p>

        <button
          class="reset-empty-btn"
          onclick="resetResourceFilters()"
        >
          Clear Filters
        </button>
      </div>
    `;

    return;
  }

  /* -------------------------------------------------------
     GROUP BY YEAR
  ------------------------------------------------------- */

  const grouped = {};

  resources.forEach((resource) => {
    const year = resource.year || "Other";

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(resource);
  });

  Object.keys(grouped)
    .sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;

      return Number(b) - Number(a);
    })
    .forEach((year) => {
      const yearSection = document.createElement("div");

      yearSection.className = "year-section";

      yearSection.innerHTML = `
        <div class="year-heading">
          <span>📅</span>
          ${escapeHtml(year)}
        </div>
      `;

      grouped[year].forEach((resource) => {
        const card = createResourceCard(resource);

        yearSection.appendChild(card);
      });

      container.appendChild(yearSection);
    });
}

/* =========================================================
   RESOURCE CARD
========================================================= */

function createResourceCard(resource) {
  const card = document.createElement("div");

  card.className = "resource-card";

  const isPdf = String(resource.type || "").toLowerCase() === "pdf";

  const typeLabel = isPdf ? "PDF" : "LINK";

  const actionText = isPdf ? "Open PDF" : "Open Resource";

  /* -------------------------------------------------------
     COVER IMAGE
  ------------------------------------------------------- */

  let imageHTML = "";

  if (resource.cover_image) {
    imageHTML = `
      <div class="resource-cover-wrapper">
        <img
          class="resource-cover"
          src="${escapeAttribute(resource.cover_image)}"
          alt="${escapeAttribute(resource.title || "Book")}"
          loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=&quot;resource-cover-placeholder&quot;>📚</div>'"
        />
      </div>
    `;
  } else {
    imageHTML = `
      <div class="resource-cover-wrapper">
        <div class="resource-cover-placeholder">
          ${isPdf ? "📄" : "📚"}
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------
     DATE
  ------------------------------------------------------- */

  let dateHTML = "";

  if (resource.upload_date) {
    const date = new Date(resource.upload_date);

    if (!isNaN(date.getTime())) {
      dateHTML = `
        <span>
          📅 ${date.toLocaleDateString()}
        </span>
      `;
    }
  }

  /* -------------------------------------------------------
     CARD
  ------------------------------------------------------- */

  card.innerHTML = `
    ${imageHTML}

    <div class="resource-info">

      <h3>
        ${escapeHtml(resource.title || "Untitled Resource")}
      </h3>

      <div class="resource-meta">

        <span class="${isPdf ? "pdf-label" : "link-label"}">
          ${isPdf ? "📄 PDF" : "🔗 LINK"}
        </span>

        ${
          resource.category
            ? `
              <span>
                📚 ${escapeHtml(resource.category)}
              </span>
            `
            : ""
        }

        ${dateHTML}

      </div>

      ${
        resource.description
          ? `
            <p class="resource-description">
              ${escapeHtml(resource.description)}
            </p>
          `
          : ""
      }

    </div>

    <a
      class="resource-btn"
      href="${escapeAttribute(resource.file_url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${actionText}
      →
    </a>
  `;

  return card;
}

/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
