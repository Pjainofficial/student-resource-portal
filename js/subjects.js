document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();
});

async function loadSubjects() {
  const params = new URLSearchParams(window.location.search);

  const topicId = params.get("topic");

  console.log("Topic ID:", topicId);

  if (!topicId) {
    document.getElementById("subjectsGrid").innerHTML = "Invalid Topic";
    return;
  }

  try {
    const topicResult = await supabaseClient
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topicResult.data) {
      document.getElementById("topicTitle").innerText = topicResult.data.name;
    }

    const { data, error } = await supabaseClient
      .from("subjects")
      .select("*")
      .eq("topic_id", topicId)
      .order("name");

    if (error) throw error;

    const grid = document.getElementById("subjectsGrid");

    if (!data || data.length === 0) {
      grid.innerHTML = `
                <div class="loading-card">
                    No subjects found.
                </div>
            `;

      return;
    }

    grid.innerHTML = "";

    data.forEach((subject) => {
      const card = document.createElement("div");

      card.className = "topic-card";

      card.innerHTML = `
                <h3>${subject.name}</h3>
            `;

      card.onclick = () => {
        window.location.href = `resources.html?subject=${subject.id}`;
      };

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);

    document.getElementById("subjectsGrid").innerHTML =
      "Failed to load subjects.";
  }
}
