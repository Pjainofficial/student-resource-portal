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

    subjects.forEach((subject) => {
      const resourceCount = subject.resources ? subject.resources.length : 0;

      const years = subject.resources
        ? [...new Set(subject.resources.map((r) => r.year))]
        : [];

      const card = document.createElement("div");

      card.className = "subject-card";

      card.innerHTML = `

              <div class="subject-top">

                  <div>

                      <h2>${subject.name}</h2>

                      <p class="subject-desc">

                          ${subject.description || "No description available."}

                      </p>

                  </div>

                  <div class="resource-count">

                      ${resourceCount}

                      <span>Resources</span>

                  </div>

              </div>

              <div class="year-list">

                  ${
                    years.length
                      ? years
                          .map((y) => `<span class="year-badge">${y}</span>`)
                          .join("")
                      : "<span class='year-badge'>No Years</span>"
                  }

              </div>

              <button class="explore-btn">

                  Explore Resources →

              </button>

          `;

      card.onclick = () => {
        window.location.href = `resources.html?subject=${subject.id}`;
      };

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);

    document.getElementById("subjectsGrid").innerHTML =
      "<div class='loading-card'>Failed to load subjects.</div>";
  }
}
