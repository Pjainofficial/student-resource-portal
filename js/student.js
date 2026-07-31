/*************************************************
 * STUDENT PORTAL
 *************************************************/

let allTopics = [];
document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
  loadCounts();
  loadHeroBooks();

  const input = document.getElementById("globalSearch");

  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        globalSearch();
      }
    });
  }
});

/*************************************************
 * LOAD TOPICS
 *************************************************/
async function loadCounts() {
  const { count: resourceCount } = await supabaseClient
    .from("resources")
    .select("*", { count: "exact", head: true });

  const { count: subjectCount } = await supabaseClient
    .from("subjects")
    .select("*", { count: "exact", head: true });

  const { count: topicCount } = await supabaseClient
    .from("topics")
    .select("*", { count: "exact", head: true });

  document.getElementById("resourceCounter").innerText = resourceCount || 0;
  document.getElementById("subjectCounter").innerText = subjectCount || 0;
  document.getElementById("topicCounter").innerText = topicCount || 0;
}
async function loadTopics() {
  const topicsGrid = document.getElementById("topicsGrid");

  if (!topicsGrid) return;

  topicsGrid.innerHTML = `
        <div class="loading-card">
            Loading topics...
        </div>
    `;

  try {
    const { data, error } = await supabaseClient
      .from("topics")
      .select(
        `
      *,
      subjects(
          id,
          resources(id)
      )
  `
      )
      .order("display_order", {
        ascending: true,
      });

    if (error) throw error;
    allTopics = data;

    if (!data || data.length === 0) {
      topicsGrid.innerHTML = `
                <div class="loading-card">
                    No topics found.
                </div>
            `;

      return;
    }

    renderTopics(data);
  } catch (err) {
    console.error(err);

    topicsGrid.innerHTML = `
            <div class="loading-card">
                Failed to load topics.
            </div>
        `;
  }
}
function renderTopics(topics) {
  const topicsGrid = document.getElementById("topicsGrid");

  topicsGrid.innerHTML = "";

  if (!topics || topics.length === 0) {
    topicsGrid.innerHTML = `
      <div class="loading-card">
        No topics found.
      </div>
    `;
    return;
  }

  topics.forEach((topic) => {
    const subjectCount = topic.subjects?.length || 0;

    let resourceCount = 0;
    topic.subjects?.forEach((subject) => {
      resourceCount += subject.resources?.length || 0;
    });

    const card = document.createElement("div");
    card.className = "topic-card";

    card.innerHTML = `
      <div class="topic-icon">📚</div>

      <h3>${topic.name}</h3>

      <p>${topic.description || "No description available."}</p>

      <div class="topic-meta">
          <span>📖 ${subjectCount} Subjects</span>
          <span>📄 ${resourceCount} Resources</span>
      </div>

      <button class="explore-btn">
          Explore →
      </button>
    `;

    card.onclick = () => openTopic(topic.id);

    topicsGrid.appendChild(card);
  });
}
/*************************************************
 * OPEN TOPIC
 *************************************************/

function openTopic(topicId) {
  window.location.href = `subjects.html?topic=${topicId}`;
}

/*************************************************
 * GLOBAL SEARCH
 *************************************************/

async function loadHeroBooks() {
  const { data, error } = await supabaseClient
    .from("resources")
    .select("cover_image,title")
    .not("cover_image", "is", null)
    .order("upload_date", { ascending: false })
    .limit(25);

  if (error) {
    console.log(error);
    return;
  }

  const track = document.getElementById("booksTrack");

  if (!track) return;

  track.innerHTML = "";

  data.forEach((book) => {
    track.innerHTML += `
          <img
              src="${book.cover_image}"
              alt="${book.title}"
              title="${book.title}"
              class="hero-book">
      `;
  });
}

window.globalSearch = function () {
  const search = document
    .getElementById("globalSearch")
    .value.toLowerCase()
    .trim();

  if (search === "") {
    renderTopics(allTopics);

    document.getElementById("topics").scrollIntoView({
      behavior: "smooth",
    });

    return;
  }

  const filtered = allTopics.filter(
    (topic) =>
      topic.name.toLowerCase().includes(search) ||
      (topic.description || "").toLowerCase().includes(search)
  );

  renderTopics(filtered);

  // Wait until cards are rendered
  setTimeout(() => {
    document.getElementById("topics").scrollIntoView({
      behavior: "smooth",

      block: "start",
    });
  }, 100);
};
