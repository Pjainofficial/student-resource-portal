document.addEventListener("DOMContentLoaded", () => {
  loadTopics();

  loadResources();

  const resourceType = document.getElementById("resourceType");

  if (resourceType) {
    resourceType.addEventListener("change", toggleResourceFields);

    toggleResourceFields();
  }

  document
    .getElementById("topicSelect")
    .addEventListener("change", function () {
      loadSubjects(this.value);
    });
});

async function loadSubjects(topicId) {
  console.log("Topic Selected:", topicId);

  const select = document.getElementById("subjectSelect");

  select.innerHTML = `<option>Select Subject</option>`;

  const { data, error } = await supabaseClient
    .from("subjects")
    .select("*")
    .eq("topic_id", Number(topicId));

  console.log("Subjects:", data);
  console.log("Error:", error);

  if (error) return;

  data.forEach((subject) => {
    const option = document.createElement("option");

    option.value = subject.id;
    option.textContent = subject.name;

    select.appendChild(option);
  });
}
function toggleResourceFields() {
  const type = document.getElementById("resourceType").value;

  const pdfFile = document.getElementById("pdfFile");

  const resourceUrl = document.getElementById("resourceUrl");

  if (type === "pdf") {
    pdfFile.style.display = "block";
    resourceUrl.style.display = "none";
  } else {
    pdfFile.style.display = "none";
    resourceUrl.style.display = "block";
  }
}
async function loadTopics() {
  const select = document.getElementById("topicSelect");

  const { data, error } = await supabaseClient
    .from("topics")
    .select("*")
    .order("display_order");

  if (error) {
    console.error(error);

    return;
  }

  select.innerHTML = `<option value="">Select Topic</option>`;

  data.forEach((topic) => {
    select.innerHTML += `
        <option value="${topic.id}">
            ${topic.name}
        </option>
        `;
  });
}

async function loadResources() {
  const container = document.getElementById("resourcesList");

  const { data, error } = await supabaseClient
    .from("resources")
    .select(
      `
      *,
      subjects(name)
  `
    )
    .order("year", { ascending: false });

  if (error) {
    console.error(error);

    return;
  }

  container.innerHTML = "";

  data.forEach((resource) => {
    const card = document.createElement("div");

    card.className = "list-card";

    card.innerHTML = `
            <h3>
                ${resource.title}
            </h3>

            <p>
                Subject:
                ${resource.subjects?.name || ""}
            </p>

            <p>
                Year:
                ${resource.year}
            </p>

            <p>
                Type:
                ${resource.type}
            </p>

            <br>

            <button
                class="delete-btn"
                onclick="deleteResource(${resource.id})"
            >
                Delete
            </button>
        `;

    container.appendChild(card);
  });
}

window.addResource = async function () {
  const subjectId = document.getElementById("subjectSelect").value;

  const year = document.getElementById("resourceYear").value;

  const title = document.getElementById("resourceTitle").value;

  const type = document.getElementById("resourceType").value;

  let file_url = "";

  if (!subjectId || !year || !title) {
    alert("Fill all fields");
    return;
  }

  try {
    if (type === "pdf") {
      const file = document.getElementById("pdfFile").files[0];

      if (!file) {
        alert("Select PDF");
        return;
      }

      const fileName = Date.now() + "_" + file.name;

      const { data: uploadData, error: uploadError } =
        await supabaseClient.storage.from("pdfs").upload(fileName, file);

      console.log(uploadData);
      console.log(uploadError);

      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage
        .from("pdfs")
        .getPublicUrl(fileName);

      file_url = data.publicUrl;

      console.log("PUBLIC URL:", file_url);
    } else {
      file_url = document.getElementById("resourceUrl").value;

      if (!file_url) {
        alert("Enter URL");
        return;
      }
    }

    const { error } = await supabaseClient.from("resources").insert([
      {
        subject_id: subjectId,
        year,
        title,
        type,
        file_url,
      },
    ]);

    if (error) throw error;

    alert("Resource Added");

    loadResources();
  } catch (err) {
    console.error(err);

    alert("Upload Failed");
  }
};
window.deleteResource = async function (id) {
  const ok = confirm("Delete resource?");

  if (!ok) return;

  const { error } = await supabaseClient
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);

    return;
  }

  loadResources();
};
