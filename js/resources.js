let currentSubject = null;

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
    /* -----------------------------------------
       SUBJECT
    ----------------------------------------- */

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

    document.getElementById("subjectTitle").innerText = subject.name;

    document.title = `${subject.name} | E-Gyan`;

    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

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
      descriptionButton.style.display = "none";
    }

    /* -----------------------------------------
       RESOURCES
    ----------------------------------------- */

    const { data: resources, error: resourceError } = await supabaseClient

      .from("resources")

      .select("*")

      .eq("subject_id", subjectId)

      .order("year", {
        ascending: false,
      })

      .order("display_order", {
        ascending: true,
      });

    if (resourceError) {
      throw resourceError;
    }

    renderResources(resources || []);
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
   DESCRIPTION SHOW MORE
========================================================= */

function toggleSubjectDescription() {
  const description = document.getElementById("subjectDescription");

  const button = document.getElementById("subjectDescriptionBtn");

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
   RENDER RESOURCES
========================================================= */

function renderResources(resources) {
  const container = document.getElementById("resourcesContainer");

  container.innerHTML = "";

  if (!resources.length) {
    container.innerHTML = `
      <div class="empty-resource">
        <div class="empty-icon">
          📚
        </div>

        <h3>
          No Resources Available
        </h3>

        <p>
          Resources for this subject will appear here.
        </p>
      </div>
    `;

    return;
  }

  /* Group by year */

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
      if (a === "Other" || b === "Other") {
        return 0;
      }

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

  const isPdf = resource.type === "pdf";

  const typeLabel = isPdf ? "PDF" : "LINK";

  const actionText = isPdf ? "Open PDF" : "Open Resource";

  card.innerHTML = `

    <div class="resource-icon">
      ${isPdf ? "📄" : "🔗"}
    </div>


    <div class="resource-info">

      <h3>
        ${escapeHtml(resource.title)}
      </h3>


      <div class="resource-meta">

        <span>
          ${typeLabel}
        </span>

        ${
          resource.category
            ? `
              <span>
                ${escapeHtml(resource.category)}
              </span>
            `
            : ""
        }

      </div>

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
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
