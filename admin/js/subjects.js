let editingSubjectId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
  loadSubjects();
});

/* ===========================
   LOAD TOPICS
=========================== */

async function loadTopics() {
  const select = document.getElementById("topicSelect");

  select.innerHTML = `<option value="">Select Course</option>`;

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

/* ===========================
   LOAD SUBJECTS
=========================== */

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

  if (!data.length) {
    container.innerHTML = `
            <div class="list-card">
                No Subjects Found
            </div>
        `;
    return;
  }

  data.forEach((subject) => {
    const card = document.createElement("div");

    card.className = "list-card";

    card.innerHTML = `
            <h3>${subject.name}</h3>

            <p class="subject-topic">
                📚 ${subject.topics?.name || "No Topic"}
            </p>

            <p class="subject-description">
                ${subject.description || "No description available."}
            </p>

            <div class="card-actions">

                <button
                    class="edit-btn"
                    onclick='editSubject(
                        ${subject.id},
                        ${subject.topic_id},
                        ${JSON.stringify(subject.name)},
                        ${JSON.stringify(subject.description || "")}
                    )'
                >
                    ✏️ Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteSubject(${subject.id})"
                >
                    🗑 Delete
                </button>

            </div>
        `;

    container.appendChild(card);
  });
}

/* ===========================
   ADD / UPDATE SUBJECT
=========================== */

window.addSubject = async function () {
  const topicId = document.getElementById("topicSelect").value;

  const subjectName = document.getElementById("subjectName").value.trim();

  const description = document
    .getElementById("subjectDescription")
    .value.trim();

  if (!topicId || !subjectName) {
    alert("Please fill all fields");
    return;
  }

  let error;

  if (editingSubjectId) {
    ({ error } = await supabaseClient
      .from("subjects")
      .update({
        topic_id: topicId,
        name: subjectName,
        description: description,
      })
      .eq("id", editingSubjectId));
  } else {
    ({ error } = await supabaseClient.from("subjects").insert([
      {
        topic_id: topicId,
        name: subjectName,
        description: description,
        display_order: 1,
      },
    ]));
  }

  if (error) {
    console.error(error);
    alert("Failed to save subject.");
    return;
  }

  editingSubjectId = null;

  document.getElementById("topicSelect").value = "";
  document.getElementById("subjectName").value = "";
  document.getElementById("subjectDescription").value = "";

  document.querySelector(".admin-form button").textContent = "Add Subject";

  await loadSubjects();
};

/* ===========================
   DELETE SUBJECT
=========================== */

window.deleteSubject = async function (id) {
  const ok = confirm("Delete subject?");

  if (!ok) return;

  const { error } = await supabaseClient.from("subjects").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Unable to delete subject.");
    return;
  }

  loadSubjects();
};

/* ===========================
   EDIT SUBJECT
=========================== */

window.editSubject = function (id, topicId, name, description) {
  editingSubjectId = id;

  document.getElementById("topicSelect").value = topicId;

  document.getElementById("subjectName").value = name;

  document.getElementById("subjectDescription").value = description;

  document.querySelector(".admin-form button").textContent = "Update Subject";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
