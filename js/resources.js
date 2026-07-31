let allResources = [];
document.addEventListener("DOMContentLoaded", () => {
  loadResources();
});

async function loadResources() {
  const params = new URLSearchParams(window.location.search);

  const subjectId = params.get("subject");

  const container = document.getElementById("resourcesContainer");

  const title = document.getElementById("subjectTitle");

  if (!subjectId) {
    container.innerHTML = "<div class='loading-card'>Invalid Subject</div>";

    return;
  }

  try {
    // Subject Name

    const { data: subject } = await supabaseClient
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (subject) {
      // title.innerText = subject.name;

      document.getElementById("subjectTitle").innerText = subject.name;

      document.getElementById("subjectDescription").innerText =
        subject.description ||
        "Explore books, journals, PDFs and academic resources available for this subject.";
    }

    // Resources

    const { data, error } = await supabaseClient
      .from("resources")
      .select(
        `
      id,
      title,
      year,
      type,
      file_url,
      category,
      upload_date,
      cover_image
  `
      )
      .eq("subject_id", subjectId)
      .order("year", {
        ascending: false,
      });

    if (error) throw error;

    allResources = data;

    populateYearFilter();
    populateCategoryFilter();

    applyFilters();

    return;
  } catch (err) {
    console.error(err);

    container.innerHTML = `
            <div class="loading-card">
                Failed to load resources
            </div>
        `;
  }
}

function populateYearFilter() {
  const select = document.getElementById("yearFilter");

  if (!select) return;

  select.innerHTML = `<option value="">All Years</option>`;

  const years = [...new Set(allResources.map((r) => r.year))];

  years.sort((a, b) => b - a);

  years.forEach((year) => {
    select.innerHTML += `<option value="${year}">${year}</option>`;
  });
}
function populateCategoryFilter() {
  const select = document.getElementById("categoryFilter");

  if (!select) return;

  select.innerHTML = `<option value="">📚 All Categories</option>`;

  const categories = [...new Set(allResources.map((r) => r.category))]
    .filter(Boolean)
    .sort();

  categories.forEach((category) => {
    select.innerHTML += `
      <option value="${category}">
          ${category}
      </option>`;
  });
}
function renderResources(resources) {
  const container = document.getElementById("resourcesContainer");

  container.innerHTML = "";

  if (resources.length === 0) {
    container.innerHTML = `
      <div class="loading-card">
        No Resources Found
      </div>
    `;
    return;
  }

  const grouped = {};

  resources.forEach((resource) => {
    if (!grouped[resource.year]) {
      grouped[resource.year] = [];
    }

    grouped[resource.year].push(resource);
  });

  Object.keys(grouped)
    .sort((a, b) => b - a)
    .forEach((year) => {
      const section = document.createElement("div");

      const heading = document.createElement("h2");
      heading.className = "year-heading";
      heading.textContent = year;

      section.appendChild(heading);

      grouped[year].forEach((resource, index) => {
        const card = document.createElement("div");

        card.className = "resource-card";

        card.style.animationDelay = `${index * 120}ms`;

        card.innerHTML = `

        ${
          resource.cover_image
            ? `<img class="resource-cover"
                    src="${resource.cover_image}">`
            : `<div class="resource-cover placeholder">📚</div>`
        }

        <div class="resource-content">

            <span class="resource-badge">

                ${resource.category || "Resource"}

            </span>

            <h3>${resource.title}</h3>

            <p>

                ${resource.type.toUpperCase()} • ${resource.year}

            </p>

            ${
              resource.type === "pdf" && resource.upload_date
                ? `
                <small class="upload-date">

                    📅 ${new Date(resource.upload_date).toLocaleDateString()}

                </small>
                `
                : ""
            }

            <div class="resource-actions">

                ${
                  resource.type === "pdf"
                    ? `
                    <a class="resource-btn"
                       href="viewer.html?pdf=${encodeURIComponent(
                         resource.file_url
                       )}">
                        👁 Read
                    </a>

                    <a class="resource-btn"
                       target="_blank"
                       href="${resource.file_url}">
                        ⬇ Download
                    </a>
                    `
                    : `
                    <a class="resource-btn"
                       target="_blank"
                       href="${resource.file_url}">
                        🔗 Open
                    </a>
                    `
                }

            </div>

        </div>
        `;

        section.appendChild(card);
      });

      container.appendChild(section);
    });
}
function searchResources() {
  applyFilters();
}
function filterResources() {
  applyFilters();
}

function applyFilters() {
  const search =
    document.getElementById("searchResource")?.value?.toLowerCase()?.trim() ||
    "";

  const year = document.getElementById("yearFilter")?.value || "";

  const category = document.getElementById("categoryFilter")?.value || "";

  const type = document.getElementById("typeFilter")?.value || "";

  const sort = document.getElementById("sortFilter")?.value || "latest";

  let filtered = [...allResources];

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(search) ||
        (r.category || "").toLowerCase().includes(search) ||
        r.type.toLowerCase().includes(search) ||
        String(r.year).includes(search)
    );
  }

  if (year) {
    filtered = filtered.filter((r) => String(r.year) === year);
  }

  if (category) {
    filtered = filtered.filter((r) => r.category === category);
  }

  if (type) {
    filtered = filtered.filter((r) => r.type === type);
  }

  switch (sort) {
    case "latest":
      filtered.sort(
        (a, b) => new Date(b.upload_date) - new Date(a.upload_date)
      );
      break;

    case "oldest":
      filtered.sort(
        (a, b) => new Date(a.upload_date) - new Date(b.upload_date)
      );
      break;

    case "az":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;

    case "za":
      filtered.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }

  const counter = document.getElementById("resourceCount");

  if (counter) {
    counter.innerText = `${filtered.length} Resources`;
  }

  renderResources(filtered);
}
