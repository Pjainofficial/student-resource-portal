document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
  loadSubjects();
});

async function loadTopics() {
  const select = document.getElementById("topicSelect");

  const { data, error } = await supabaseClient
    .from("topics")
    .select("*")
    .order("name");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((topic) => {
    const option = document.createElement("option");

    option.value = topic.id;
    option.textContent = topic.name;

    select.appendChild(option);
  });
}

async function loadSubjects() {
  const container = document.getElementById("subjectsList");

  const { data, error } = await supabaseClient
    .from("subjects")
    .select(
      `
                *,
                topics(name)
            `
    )
    .order("id", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = "";

  data.forEach((subject) => {
    const card = document.createElement("div");

    card.className = "list-card";

    card.innerHTML = `
            <h3>${subject.name}</h3>

            <p>
                Topic:
                ${subject.topics?.name || ""}
            </p>

            <br>

            <button
                class="delete-btn"
                onclick="deleteSubject(${subject.id})"
            >
                Delete
            </button>
        `;

    container.appendChild(card);
  });
}

window.addSubject = async function () {
  const topicId = document.getElementById("topicSelect").value;

  const subjectName = document.getElementById("subjectName").value;

  if (!topicId || !subjectName) {
    alert("Fill all fields");

    return;
  }

  const { error } = await supabaseClient.from("subjects").insert([
    {
      topic_id: topicId,
      name: subjectName,
    },
  ]);

  if (error) {
    console.error(error);

    alert("Failed to add subject");

    return;
  }

  document.getElementById("subjectName").value = "";

  loadSubjects();
};

window.deleteSubject = async function (id) {
  const ok = confirm("Delete subject?");

  if (!ok) return;

  const { error } = await supabaseClient.from("subjects").delete().eq("id", id);

  if (error) {
    console.error(error);

    return;
  }

  loadSubjects();
};
