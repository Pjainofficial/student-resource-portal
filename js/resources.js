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
      title.innerText = subject.name;
    }

    // Resources

    const { data, error } = await supabaseClient
      .from("resources")
      .select("*")
      .eq("subject_id", subjectId)
      .order("year", {
        ascending: false,
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
                <div class="loading-card">
                    No Resources Found
                </div>
            `;

      return;
    }

    const grouped = {};

    data.forEach((resource) => {
      if (!grouped[resource.year]) {
        grouped[resource.year] = [];
      }

      grouped[resource.year].push(resource);
    });

    container.innerHTML = "";

    Object.keys(grouped)
      .sort((a, b) => b - a)
      .forEach((year) => {
        const section = document.createElement("div");

        section.innerHTML = `
                    <h2 style="margin-top:30px;">
                        ${year}
                    </h2>
                `;

        grouped[year].forEach((resource) => {
          section.innerHTML += `
                      <div class="resource-card">
                  
                        <div class="resource-left">
                          <span class="resource-icon">
                            ${resource.type === "pdf" ? "📄" : "🔗"}
                          </span>
                  
                          <div>
                            <h3>${resource.title}</h3>
                            <small>${resource.type.toUpperCase()}</small>
                          </div>
                        </div>
                  
                        <div class="resource-actions">
                  
                          ${
                            resource.type === "pdf"
                              ? `
                                <a
                                  class="resource-btn"
                                  href="viewer.html?pdf=${encodeURIComponent(
                                    resource.file_url
                                  )}"
                                >
                                  View
                                </a>
                  
                                <a
                                  class="resource-btn"
                                  href="${resource.file_url}"
                                  target="_blank"
                                >
                                  Download
                                </a>
                              `
                              : `
                                <a
                                  class="resource-btn"
                                  href="${resource.file_url}"
                                  target="_blank"
                                >
                                  Open Link
                                </a>
                              `
                          }
                  
                        </div>
                  
                      </div>
                    `;
        });

        container.appendChild(section);
      });
  } catch (err) {
    console.error(err);

    container.innerHTML = `
            <div class="loading-card">
                Failed to load resources
            </div>
        `;
  }
}
