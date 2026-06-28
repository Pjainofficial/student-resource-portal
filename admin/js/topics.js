document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
});

async function loadTopics() {
  const container = document.getElementById("topicsList");

  const { data, error } = await supabaseClient
    .from("topics")
    .select("*")
    .order("display_order");

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = "";

  data.forEach((topic) => {
    const div = document.createElement("div");

    div.className = "list-card";

    div.innerHTML = `
            <h3>${topic.name}</h3>

            <p>
                ${topic.description || ""}
            </p>

            <br>

            <button
                class="delete-btn"
                onclick="deleteTopic(${topic.id})"
            >
                Delete
            </button>
        `;

    container.appendChild(div);
  });
}

async function addTopic() {
  const name = document.getElementById("topicName").value;

  const description = document.getElementById("topicDescription").value;

  if (!name) {
    alert("Enter topic name");

    return;
  }

  const { error } = await supabaseClient.from("topics").insert([
    {
      name,
      description,
    },
  ]);

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("topicName").value = "";

  document.getElementById("topicDescription").value = "";

  loadTopics();
}

async function deleteTopic(id) {
  const confirmDelete = confirm("Delete topic?");

  if (!confirmDelete) return;

  const { error } = await supabaseClient.from("topics").delete().eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  loadTopics();
}
