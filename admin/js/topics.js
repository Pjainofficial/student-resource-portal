let editingId = null;
document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
});

async function loadTopics() {
  const container = document.getElementById("topicsList");

  const { data, error } = await supabaseClient
    .from("topics")
    .select("*")
    .order("id", { ascending: true });

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

    <p>${topic.description || "No description available."}</p>

    <div class="card-actions">
        <button
            class="edit-btn"
            onclick='editTopic(
                ${topic.id},
                ${JSON.stringify(topic.name)},
                ${JSON.stringify(topic.description || "")}
            )'
        >
            ✏ Edit
        </button>

        <button
            class="delete-btn"
            onclick="deleteTopic(${topic.id})"
        >
            🗑 Delete
        </button>
    </div>
`;

    container.appendChild(div);
  });
}

window.addTopic = async function () {
  const name = document.getElementById("topicName").value.trim();
  const description = document.getElementById("topicDescription").value.trim();

  if (!name) {
    alert("Please enter topic name");
    return;
  }

  let error;

  if (editingId) {
    ({ error } = await supabaseClient
      .from("topics")
      .update({
        name,
        description,
      })
      .eq("id", editingId));
  } else {
    ({ error } = await supabaseClient.from("topics").insert([
      {
        name,
        description,
      },
    ]));
  }

  if (error) {
    console.error(error);
    alert("Failed");
    return;
  }

  editingId = null;

  document.querySelector(".admin-form button").innerText = "Add Topic";

  document.getElementById("topicName").value = "";
  document.getElementById("topicDescription").value = "";

  loadTopics();
};
window.deleteTopic = async function (id) {
  const confirmDelete = confirm("Delete topic?");

  if (!confirmDelete) return;

  const { error } = await supabaseClient.from("topics").delete().eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  loadTopics();
};
window.editTopic = function (id, name, description) {
  editingId = id;

  document.getElementById("topicName").value = name;

  document.getElementById("topicDescription").value = description;

  document.querySelector(".admin-form button").innerText = "Update Topic";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
