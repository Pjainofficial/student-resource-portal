let allSubjects = [];
let filteredSubjects = [];

let currentPage = 1;

const PAGE_SIZE = 12;

/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();
});

/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {
  const params = new URLSearchParams(window.location.search);

  const topicId = params.get("topic");

  if (!topicId) {
    document.getElementById("subjectsGrid").innerHTML = `
      <div class="loading-card">
        Invalid Topic
      </div>
    `;

    return;
  }

  try {
    /* -----------------------------------------
       LOAD TOPIC
    ----------------------------------------- */

    const { data: topic, error: topicError } = await supabaseClient

      .from("topics")

      .select("*")

      .eq("id", topicId)

      .single();

    if (topicError) {
      throw topicError;
    }

    if (topic) {
      document.getElementById("topicTitle").innerText = topic.name;

      const description =
        topic.description ||
        "Explore subjects and learning resources available under this topic.";

      const descriptionElement = document.getElementById("topicDescription");

      const descriptionButton = document.getElementById("topicDescriptionBtn");

      descriptionElement.innerText = description;

      /*
       * Show more only for long descriptions
       */

      if (description.length > 180) {
        descriptionElement.classList.add("collapsed");

        descriptionButton.style.display = "inline-flex";

        descriptionButton.innerText = "Show more ↓";
      } else {
        descriptionElement.classList.remove("collapsed");

        descriptionButton.style.display = "none";
      }

      /*
       * Browser title
       */

      document.title = `${topic.name} | E-Gyaan`;
    }

    /* -----------------------------------------
       LOAD SUBJECTS
    ----------------------------------------- */

    const { data: subjects, error } = await supabaseClient

      .from("subjects")

      .select(
        `
        *,
        resources(
          id,
          year
        )
      `
      )

      .eq("topic_id", topicId)

      .order("name");

    if (error) {
      throw error;
    }

    allSubjects = subjects || [];

    filteredSubjects = [...allSubjects];

    populateSubjectDropdown();

    renderPage();
  } catch (error) {
    console.error("SUBJECT LOAD ERROR:", error);

    document.getElementById("subjectsGrid").innerHTML = `
      <div class="loading-card">
        Failed to load subjects.
      </div>
    `;
  }
}

/* =========================================================
   TOPIC DESCRIPTION SHOW MORE
========================================================= */

function toggleTopicDescription() {
  const description = document.getElementById("topicDescription");

  const button = document.getElementById("topicDescriptionBtn");

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
   SEARCH
========================================================= */

function filterSubjects() {
  const search = document
    .getElementById("searchSubject")
    .value.toLowerCase()
    .trim();

  filteredSubjects = allSubjects.filter(
    (subject) =>
      (subject.name || "").toLowerCase().includes(search) ||
      (subject.description || "").toLowerCase().includes(search)
  );

  document.getElementById("subjectDropdown").value = "";

  currentPage = 1;

  renderPage();
}

/* =========================================================
   DROPDOWN FILTER
========================================================= */

function filterByDropdown() {
  const id = document.getElementById("subjectDropdown").value;

  if (!id) {
    filteredSubjects = [...allSubjects];
  } else {
    filteredSubjects = allSubjects.filter(
      (subject) => String(subject.id) === String(id)
    );
  }

  document.getElementById("searchSubject").value = "";

  currentPage = 1;

  renderPage();
}

/* =========================================================
   RENDER PAGE
========================================================= */

function renderPage() {
  document.getElementById("subjectCount").innerText = filteredSubjects.length;

  const start = (currentPage - 1) * PAGE_SIZE;

  const pageSubjects = filteredSubjects.slice(start, start + PAGE_SIZE);

  renderSubjects(pageSubjects);

  renderPagination();
}

/* =========================================================
   RENDER SUBJECT CARDS
========================================================= */

function renderSubjects(subjects) {
  const grid = document.getElementById("subjectsGrid");

  grid.innerHTML = "";

  if (!subjects.length) {
    grid.innerHTML = `
      <div class="loading-card">
        🔍 No Subject Found
      </div>
    `;

    return;
  }

  subjects.forEach((subject) => {
    const resourceCount = subject.resources?.length || 0;

    const years = subject.resources
      ? [...new Set(subject.resources.map((r) => r.year).filter(Boolean))]
      : [];

    const description =
      subject.description ||
      "Explore learning resources, study material and academic content for this subject.";

    const card = document.createElement("div");

    card.className = "subject-card";

    card.innerHTML = `

      <div class="subject-top">

        <div class="subject-icon">
          📚
        </div>

        <div class="subject-arrow">
          →
        </div>

      </div>


      <div class="subject-content">

        <h2>
          ${escapeHtml(subject.name)}
        </h2>


        <div class="subject-description">

          <p class="description-text">
            ${escapeHtml(description)}
          </p>

          ${
            description.length > 150
              ? `
                <button
                  class="show-more-btn"
                  type="button"
                >
                  Show more ↓
                </button>
              `
              : ""
          }

        </div>


        <div class="subject-meta">

          <span>
            📄 ${resourceCount}
            ${resourceCount === 1 ? "Resource" : "Resources"}
          </span>

          <span>
            📅 ${years.length}
            ${years.length === 1 ? "Year" : "Years"}
          </span>

        </div>

      </div>
    `;

    /* -----------------------------------------
       CARD CLICK
    ----------------------------------------- */

    card.addEventListener("click", (event) => {
      if (event.target.closest(".show-more-btn")) {
        return;
      }

      window.location.href = `resources.html?subject=${subject.id}`;
    });

    /* -----------------------------------------
       SHOW MORE
    ----------------------------------------- */

    const button = card.querySelector(".show-more-btn");

    const descriptionText = card.querySelector(".description-text");

    if (button) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        const expanded = descriptionText.classList.contains("expanded");

        if (expanded) {
          descriptionText.classList.remove("expanded");

          descriptionText.classList.add("collapsed");

          button.innerText = "Show more ↓";
        } else {
          descriptionText.classList.remove("collapsed");

          descriptionText.classList.add("expanded");

          button.innerText = "Show less ↑";
        }
      });
    }

    grid.appendChild(card);
  });
}

/* =========================================================
   PAGINATION
========================================================= */

function renderPagination() {
  const pagination = document.getElementById("pagination");

  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredSubjects.length / PAGE_SIZE);

  if (totalPages <= 1) {
    return;
  }

  pagination.innerHTML += `
    <button
      ${currentPage === 1 ? "disabled" : ""}
      onclick="goPage(${currentPage - 1})"
    >
      ◀
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      pagination.innerHTML += `
        <button
          class="${currentPage === i ? "active-page" : ""}"
          onclick="goPage(${i})"
        >
          ${i}
        </button>
      `;
    }
  }

  pagination.innerHTML += `
    <button
      ${currentPage === totalPages ? "disabled" : ""}
      onclick="goPage(${currentPage + 1})"
    >
      ▶
    </button>
  `;
}

function goPage(page) {
  currentPage = page;

  renderPage();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================================
   DROPDOWN
========================================================= */

function populateSubjectDropdown() {
  const dropdown = document.getElementById("subjectDropdown");

  dropdown.innerHTML = `
    <option value="">
      📚 Browse Subjects
    </option>
  `;

  allSubjects.forEach((subject) => {
    dropdown.innerHTML += `
        <option value="${subject.id}">
          ${escapeHtml(subject.name)}
        </option>
      `;
  });
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
