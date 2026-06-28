/*************************************************
 * STUDENT PORTAL
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
});

/*************************************************
 * LOAD TOPICS
 *************************************************/

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
      .select("*")
      .order("display_order", {
        ascending: true,
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      topicsGrid.innerHTML = `
                <div class="loading-card">
                    No topics found.
                </div>
            `;

      return;
    }

    topicsGrid.innerHTML = "";

    data.forEach((topic) => {
      const card = document.createElement("div");

      card.className = "topic-card";

      card.innerHTML = `
                <h3>${topic.name}</h3>
                <p>${topic.description || ""}</p>
            `;

      card.addEventListener("click", () => {
        openTopic(topic.id);
      });

      topicsGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);

    topicsGrid.innerHTML = `
            <div class="loading-card">
                Failed to load topics.
            </div>
        `;
  }
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

const searchInput = document.getElementById("globalSearch");

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();

    const cards = document.querySelectorAll(".topic-card");

    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();

      card.style.display = text.includes(value) ? "block" : "none";
    });
  });
}
