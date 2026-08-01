let allSubjects = [];
let filteredSubjects = [];

let currentPage = 1;
const PAGE_SIZE = 12;

document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();
});

async function loadSubjects() {
  const params = new URLSearchParams(window.location.search);
  const topicId = params.get("topic");

  if (!topicId) {
    document.getElementById("subjectsGrid").innerHTML =
      "<div class='loading-card'>Invalid Topic</div>";
    return;
  }

  try {
    // Load Topic Details
    const { data: topic } = await supabaseClient
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topic) {
      document.getElementById("topicTitle").innerText = topic.name;
      document.getElementById("topicDescription").innerText =
        topic.description ||
        "Explore all available subjects and learning resources.";
    }

    // Load Subjects + Resources
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

    if (error) throw error;

    const grid = document.getElementById("subjectsGrid");

    grid.innerHTML = "";

    if (!subjects.length) {
      grid.innerHTML = `
              <div class="loading-card">
                  No subjects available.
              </div>
          `;

      return;
    }

    allSubjects = subjects;
    filteredSubjects = [...subjects];

    populateSubjectDropdown();

    renderPage();
  } catch (err) {
    console.error(err);

    document.getElementById("subjectsGrid").innerHTML =
      "<div class='loading-card'>Failed to load subjects.</div>";
  }
}
function filterSubjects() {
  const search = document
    .getElementById("searchSubject")
    .value.toLowerCase()
    .trim();

  filteredSubjects = allSubjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(search) ||
      (subject.description || "").toLowerCase().includes(search)
  );

  document.getElementById("subjectDropdown").value = "";

  currentPage = 1;

  renderPage();
}
function filterByDropdown() {
  const id = document.getElementById("subjectDropdown").value;

  if (!id) {
    filteredSubjects = [...allSubjects];
  } else {
    filteredSubjects = allSubjects.filter((s) => s.id == id);
  }

  document.getElementById("searchSubject").value = "";

  currentPage = 1;

  renderPage();
}
function renderPage() {
  document.getElementById(
    "subjectCount"
  ).innerText = `${filteredSubjects.length} Subjects`;

  const start = (currentPage - 1) * PAGE_SIZE;

  renderSubjects(filteredSubjects.slice(start, start + PAGE_SIZE));

  renderPagination();
}
function renderSubjects(subjects) {
  const grid = document.getElementById("subjectsGrid");

  grid.innerHTML = "";

  if (subjects.length === 0) {
    grid.innerHTML = `
      <div class="loading-card">

          🔍 No Subject Found

      </div>`;

    return;
  }

  subjects.forEach((subject) => {
    const resourceCount = subject.resources?.length || 0;

    const years = subject.resources
      ? [...new Set(subject.resources.map((r) => r.year))]
      : [];

    const card = document.createElement("div");

    card.className = "subject-card";

    card.innerHTML = `

      <div class="subject-icon">

          📚

      </div>

      <div class="subject-content">

          <h2>${subject.name}</h2>

          <p>

          ${subject.description || "Medical learning resources"}

          </p>

          <div class="subject-meta">

              <span>📄 ${resourceCount} Resources</span>

              <span>📅 ${years.length} Years</span>

          </div>

      </div>

      <div class="subject-arrow">

          →

      </div>

      `;

    card.onclick = () => {
      window.location.href = `resources.html?subject=${subject.id}`;
    };

    grid.appendChild(card);
  });
}
function renderPagination() {
  const pagination = document.getElementById("pagination");

  pagination.innerHTML = "";

  const total = Math.ceil(filteredSubjects.length / PAGE_SIZE);

  if (total <= 1) return;

  pagination.innerHTML += `
  <button
  ${currentPage == 1 ? "disabled" : ""}
  onclick="goPage(${currentPage - 1})">

  ◀

  </button>
  `;

  for (let i = 1; i <= total; i++) {
    if (i == 1 || i == total || Math.abs(i - currentPage) <= 2) {
      pagination.innerHTML += `

          <button

          class="${currentPage == i ? "active-page" : ""}"

          onclick="goPage(${i})">

          ${i}

          </button>

          `;
    }
  }

  pagination.innerHTML += `
  <button
  ${currentPage == total ? "disabled" : ""}
  onclick="goPage(${currentPage + 1})">

  ▶

  </button>
  `;
}
function goPage(page) {
  currentPage = page;

  renderPage();
}
function populateSubjectDropdown() {
  const dropdown = document.getElementById("subjectDropdown");

  dropdown.innerHTML = `<option value="">📚 Browse Subjects</option>`;

  allSubjects.forEach((subject) => {
    dropdown.innerHTML += `
          <option value="${subject.id}">
              ${subject.name}
          </option>
      `;
  });
}
