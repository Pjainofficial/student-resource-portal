let editingResourceId = null;
let allResources = [];
let filteredResources = [];

let currentPage = 1;
const PAGE_SIZE = 15;
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

  const uploadDate = document.getElementById("uploadDate");

  if (type === "pdf") {
    pdfFile.style.display = "block";
    resourceUrl.style.display = "none";

    uploadDate.style.display = "block";
    uploadDate.required = true;
  } else {
    pdfFile.style.display = "none";
    resourceUrl.style.display = "block";

    uploadDate.style.display = "none";
    uploadDate.required = false;
    uploadDate.value = "";
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

  select.innerHTML = `<option value="">Select Course</option>`;

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
    subjects(
        id,
        name,
        topic_id,
        topics(
            id,
            name
        )
    )
`
    )
    .order("year", { ascending: false });

  if (error) {
    console.error(error);

    return;
  }

  allResources = data;
  populateCourseFilter();
  populateSubjectFilter();
  populateYearFilter();
  populateCategoryFilter();

  filteredResources = [...allResources];

  document.getElementById(
    "resourceCount"
  ).innerText = `${filteredResources.length} Resources`;

  renderPage();
}
function populateCourseFilter() {
  const select = document.getElementById("filterCourse");
  if (!select) return;

  select.innerHTML = `<option value="">All Courses</option>`;

  const courses = [
    ...new Set(allResources.map((r) => r.subjects?.topics?.name)),
  ]
    .filter(Boolean)
    .sort();

  courses.forEach((course) => {
    select.innerHTML += `<option value="${course}">${course}</option>`;
  });
}
function renderPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  renderResources(filteredResources.slice(start, end));

  renderPagination();
}
function populateCategoryFilter() {
  const select = document.getElementById("filterCategory");
  if (!select) return;

  select.innerHTML = `<option value="">All Categories</option>`;

  const categories = [...new Set(allResources.map((r) => r.category))]
    .filter(Boolean)
    .sort();

  categories.forEach((category) => {
    select.innerHTML += `<option value="${category}">${category}</option>`;
  });
}
function populateSubjectFilter() {
  const select = document.getElementById("filterSubject");
  if (!select) return;

  select.innerHTML = `<option value="">All Subjects</option>`;

  const subjects = [...new Set(allResources.map((r) => r.subjects?.name))]
    .filter(Boolean)
    .sort();

  subjects.forEach((subject) => {
    select.innerHTML += `<option value="${subject}">${subject}</option>`;
  });
}

window.addResource = async function () {
  console.log(document.getElementById("subjectSelect"));
  console.log(document.getElementById("resourceYear"));
  console.log(document.getElementById("resourceCategory"));
  console.log(document.getElementById("uploadDate"));
  console.log(document.getElementById("resourceTitle"));
  console.log(document.getElementById("resourceType"));
  const subjectId = document.getElementById("subjectSelect")?.value;

  const year = document.getElementById("resourceYear")?.value;

  const category = document.getElementById("resourceCategory")?.value;

  const title = document.getElementById("resourceTitle")?.value;

  const type = document.getElementById("resourceType")?.value;

  const uploadDate =
    type === "pdf" ? document.getElementById("uploadDate")?.value : null;
  let file_url = "";
  let cover_image = "";

  if (
    !subjectId ||
    !year ||
    !category ||
    !title ||
    (type === "pdf" && !uploadDate)
  ) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    const cover = document.getElementById("coverImage").files[0];

    if (cover) {
      const coverName = Date.now() + "_" + cover.name;

      const { error: coverError } = await supabaseClient.storage
        .from("covers")
        .upload(coverName, cover);

      if (coverError) throw coverError;

      const { data } = supabaseClient.storage
        .from("covers")
        .getPublicUrl(coverName);

      cover_image = data.publicUrl;
    }
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

    let error;

    if (editingResourceId) {
      ({ error } = await supabaseClient

        .from("resources")

        .update({
          subject_id: subjectId,
          year,
          title,
          type,
          category,
          upload_date: type === "pdf" ? uploadDate : null,
          cover_image,
          file_url,
        })

        .eq("id", editingResourceId));
    } else {
      ({ error } = await supabaseClient

        .from("resources")

        .insert([
          {
            subject_id: subjectId,
            year,
            title,
            type,
            category,
            upload_date: type === "pdf" ? uploadDate : null,
            cover_image,
            file_url,
          },
        ]));
    }

    if (error) throw error;

    editingResourceId = null;

    document.getElementById("saveResourceBtn").innerText = "Add Resource";

    document.getElementById("resourceTitle").value = "";

    document.getElementById("resourceYear").value = "";

    document.getElementById("resourceCategory").value = "";

    document.getElementById("pdfFile").value = "";
    document.getElementById("coverImage").value = "";

    document.getElementById("topicSelect").value = "";

    document.getElementById("uploadDate").style.display = "";

    document.getElementById("resourceUrl").style.display = "none";

    document.getElementById("pdfFile").style.display = "";

    document.getElementById("subjectSelect").innerHTML =
      "<option>Select Subject</option>";

    alert("Saved Successfully");

    await loadResources();
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

  await loadResources();
};
function populateYearFilter() {
  const select = document.getElementById("filterYear");

  if (!select) return;

  select.innerHTML = `<option value="">All Years</option>`;

  const years = [...new Set(allResources.map((r) => r.year))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  years.forEach((year) => {
    select.innerHTML += `<option value="${year}">${year}</option>`;
  });
}
function renderResources(data) {
  const container = document.getElementById("resourcesList");

  container.innerHTML = "";

  if (data.length == 0) {
    container.innerHTML = "<div class='list-card'>No Resources Found</div>";

    return;
  }

  data.forEach((resource) => {
    const card = document.createElement("div");

    card.className = "list-card resource-card";

    card.innerHTML = `
    ${
      resource.cover_image
        ? `<img src="${resource.cover_image}" class="resource-cover">`
        : `<div class="resource-cover placeholder">📚</div>`
    }
    
    <h3>${resource.title}</h3>
    
    <p><b>Subject:</b> ${resource.subjects?.name || ""}</p>
    
    <p><b>Category:</b> ${resource.category || "-"}</p>

    <p><b>Year:</b> ${resource.year}</p>
    
    <p><b>Upload Date:</b> ${
      resource.upload_date
        ? new Date(resource.upload_date).toLocaleDateString()
        : "-"
    }</p>
    
    <p><b>Type:</b> ${resource.type.toUpperCase()}</p>
    
    <div class="card-actions">
    
    <button class="edit-btn"
    
    onclick="editResource(${resource.id})">
    
    ✏ Edit
    
    </button>

    <button class="delete-btn"
    
    onclick="deleteResource(${resource.id})">
    
    🗑 Delete
    
    </button>
    
    </div>
    
    `;

    container.appendChild(card);
  });
}
function searchResources() {
  filterResources();
}
window.goToPage = function (page) {
  currentPage = page;
  renderPage();
};

function filterResources() {
  const search =
    document.getElementById("searchResource")?.value.toLowerCase().trim() || "";

  const course = document.getElementById("filterCourse")?.value || "";

  const subject = document.getElementById("filterSubject")?.value || "";

  const type = document.getElementById("filterType")?.value || "";

  const category = document.getElementById("filterCategory")?.value || "";

  const year = document.getElementById("filterYear")?.value || "";

  filteredResources = [...allResources];

  if (search) {
    filteredResources = filteredResources.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(search) ||
        (r.category || "").toLowerCase().includes(search) ||
        (r.subjects?.name || "").toLowerCase().includes(search) ||
        (r.subjects?.topics?.name || "").toLowerCase().includes(search) ||
        String(r.year).includes(search)
    );
  }

  if (course) {
    filteredResources = filteredResources.filter(
      (r) => r.subjects?.topics?.name === course
    );
  }

  if (subject) {
    filteredResources = filteredResources.filter(
      (r) => r.subjects?.name === subject
    );
  }

  if (type) {
    filteredResources = filteredResources.filter((r) => r.type === type);
  }

  if (category) {
    filteredResources = filteredResources.filter(
      (r) => r.category === category
    );
  }

  if (year) {
    filteredResources = filteredResources.filter(
      (r) => String(r.year) === year
    );
  }

  currentPage = 1;

  document.getElementById(
    "resourceCount"
  ).innerText = `${filteredResources.length} Resources`;

  renderPage();
}
window.editResource = async function (id) {
  const resource = allResources.find((r) => r.id === id);

  if (!resource) return;

  editingResourceId = id;

  document.getElementById("resourceTitle").value = resource.title;
  document.getElementById("resourceYear").value = resource.year;
  document.getElementById("resourceType").value = resource.type;

  document.getElementById("resourceCategory").value = resource.category || "";

  document.getElementById("uploadDate").value = resource.upload_date || "";
  document.getElementById("resourceUrl").value = resource.file_url || "";

  toggleResourceFields();

  if (resource.type === "link") {
    document.getElementById("resourceUrl").value = resource.file_url;
  }

  const { data } = await supabaseClient
    .from("subjects")
    .select("topic_id")
    .eq("id", resource.subject_id)
    .single();

  document.getElementById("topicSelect").value = data.topic_id;

  await loadSubjects(data.topic_id);

  document.getElementById("subjectSelect").value = resource.subject_id;

  document.getElementById("saveResourceBtn").innerText = "Update Resource";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
function renderPagination() {
  const pagination = document.getElementById("pagination");

  if (!pagination) return;

  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredResources.length / PAGE_SIZE);

  if (totalPages <= 1) return;

  // Previous
  pagination.innerHTML += `
      <button
          ${currentPage === 1 ? "disabled" : ""}
          onclick="goToPage(${currentPage - 1})">
          ◀
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      pagination.innerHTML += `
              <button
                  class="${currentPage === i ? "active-page" : ""}"
                  onclick="goToPage(${i})">
                  ${i}
              </button>
          `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      pagination.innerHTML += `<span>...</span>`;
    }
  }

  // Next
  pagination.innerHTML += `
      <button
          ${currentPage === totalPages ? "disabled" : ""}
          onclick="goToPage(${currentPage + 1})">
          ▶
      </button>
  `;
}
function populateCategoryFilter() {
  const select = document.getElementById("filterCategory");

  if (!select) return;

  select.innerHTML = `<option value="">All Categories</option>`;

  const categories = [...new Set(allResources.map((r) => r.category))]
    .filter(Boolean)
    .sort();

  categories.forEach((category) => {
    select.innerHTML += `
          <option value="${category}">
              ${category}
          </option>
      `;
  });
}
