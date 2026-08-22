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
    .order("year", { ascending: false })
    .range(0, 5000);

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
  const origin = document.getElementById("resourceOrigin")?.value;

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
    !origin ||
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
          origin: document.getElementById("resourceOrigin").value,
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
            origin: document.getElementById("resourceOrigin").value,
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
    document.getElementById("resourceOrigin").value = "Indian";
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

  document.getElementById("resourceOrigin").value = resource.origin || "Indian";

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

/* =========================================================
   EXCEL BULK IMPORT
========================================================= */

let excelRows = [];
let validExcelRows = [];
let invalidExcelRows = [];

/* =========================================================
   DOWNLOAD EXCEL TEMPLATE
========================================================= */

window.downloadExcelTemplate = function () {
  const templateData = [
    {
      Subject: "Anatomy",
      Year: 2026,
      Category: "Indian",
      Title: "Sample Anatomy Resource",
      Type: "link",
      URL: "https://example.com",
    },
    {
      Subject: "Physiology",
      Year: 2026,
      Category: "Foreign",
      Title: "Sample Physiology Resource",
      Type: "link",
      URL: "https://example.com",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Resources");

  XLSX.writeFile(workbook, "Kantas_Sparsh_Resource_Template.xlsx");
};

/* =========================================================
   PREVIEW EXCEL
========================================================= */

window.previewExcel = async function () {
  const fileInput = document.getElementById("excelFile");

  const file = fileInput?.files?.[0];

  if (!file) {
    alert("Please select an Excel file.");

    return;
  }

  try {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
      type: "array",
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (!rows.length) {
      alert("Excel file is empty.");

      return;
    }

    excelRows = rows;

    await validateExcelRows();
  } catch (error) {
    console.error(error);

    alert("Unable to read Excel file.");
  }
};

/* =========================================================
   VALIDATE EXCEL
========================================================= */

/* =========================================================
   VALIDATE EXCEL
========================================================= */
function createResourceKey(resource) {
  return [
    resource.subject_id,
    resource.year,
    String(resource.title || "")
      .trim()
      .toLowerCase(),
    String(resource.type || "")
      .trim()
      .toLowerCase(),
    String(resource.file_url || "")
      .trim()
      .toLowerCase(),
  ].join("|");
}

async function validateExcelRows() {
  validExcelRows = [];
  invalidExcelRows = [];

  const requiredColumns = [
    "Subject",
    "Year",
    "Category",
    "Title",
    "Origin",
    "Type",
    "URL",
  ];

  const firstRow = excelRows[0];

  const missingColumns = requiredColumns.filter(
    (column) => !Object.prototype.hasOwnProperty.call(firstRow, column)
  );

  if (missingColumns.length) {
    alert("Missing Excel columns: " + missingColumns.join(", "));
    return;
  }

  // Load subjects
  const { data: subjects, error } = await supabaseClient
    .from("subjects")
    .select("id,name");

  if (error) {
    console.error(error);
    alert("Unable to load subjects from database.");
    return;
  }

  // Create subject lookup
  const subjectMap = {};

  subjects.forEach((subject) => {
    subjectMap[String(subject.name).trim().toLowerCase()] = subject.id;
  });

  // Load existing resources
  const { data: existingResources, error: resourceError } = await supabaseClient
    .from("resources")
    .select("subject_id, year, title, type, file_url");

  if (resourceError) {
    console.error(resourceError);
    alert("Unable to check existing resources.");
    return;
  }

  // Create existing-resource keys
  const existingKeys = new Set();

  existingResources.forEach((resource) => {
    existingKeys.add(createResourceKey(resource));
  });

  // Track duplicates inside THIS Excel file too
  const excelKeys = new Set();

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const errors = [];

    const subjectName = String(row.Subject || "").trim();

    const year = Number(row.Year);

    const category = String(row.Category || "").trim();

    const title = String(row.Title || "").trim();

    const origin = String(row.Origin || "").trim();

    const type = String(row.Type || "")
      .trim()
      .toLowerCase();

    const url = String(row.URL || "").trim();

    const subjectId = subjectMap[subjectName.toLowerCase()];

    // Subject
    if (!subjectName) {
      errors.push("Subject is required");
    } else if (!subjectId) {
      errors.push(`Subject "${subjectName}" not found`);
    }

    // Year
    if (!year || year < 1900 || year > 2100) {
      errors.push("Invalid year");
    }

    // Category
    if (!["Book", "Journal", "Research Paper"].includes(category)) {
      errors.push("Category must be Book, Journal or Research Paper");
    }

    // Title
    if (!title) {
      errors.push("Title is required");
    }

    // Origin
    if (!["Indian", "Foreign"].includes(origin)) {
      errors.push("Origin must be Indian or Foreign");
    }

    // Type
    if (!["link", "pdf"].includes(type)) {
      errors.push("Type must be link or pdf");
    }

    // URL
    if (!url) {
      errors.push("URL is required");
    }

    if (errors.length) {
      invalidExcelRows.push({
        rowNumber,
        errors,
      });

      return;
    }

    const resource = {
      subject_id: subjectId,
      year,
      title,
      type,
      file_url: url,
    };

    const key = createResourceKey(resource);

    // Duplicate already in database
    if (existingKeys.has(key)) {
      invalidExcelRows.push({
        rowNumber,
        errors: ["Resource already exists"],
      });

      return;
    }

    // Duplicate inside same Excel
    if (excelKeys.has(key)) {
      invalidExcelRows.push({
        rowNumber,
        errors: ["Duplicate resource in this Excel file"],
      });

      return;
    }

    excelKeys.add(key);

    validExcelRows.push({
      ...resource,
      category,
      origin,
      file_url: url,
    });
  });

  renderExcelPreview();
}

/* =========================================================
   RENDER EXCEL PREVIEW
========================================================= */

function renderExcelPreview() {
  const summary = document.getElementById("excelSummary");

  const preview = document.getElementById("excelPreview");

  const actions = document.getElementById("excelImportActions");

  summary.innerHTML = `

    <div class="excel-summary-box">

      <span>
        📄 Total Rows:
        <strong>${excelRows.length}</strong>
      </span>

      <span class="success-text">
        ✅ Valid:
        <strong>${validExcelRows.length}</strong>
      </span>

      <span class="error-text">
        ❌ Invalid:
        <strong>${invalidExcelRows.length}</strong>
      </span>

    </div>

  `;

  let html = `

    <div class="excel-table-wrapper">

      <table class="excel-table">

        <thead>

          <tr>

            <th>Row</th>
            <th>Subject</th>
            <th>Year</th>
            <th>Category</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>

          </tr>

        </thead>

        <tbody>

  `;

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const invalid = invalidExcelRows.find(
      (item) => item.rowNumber === rowNumber
    );

    if (invalid) {
      html += `

        <tr class="excel-invalid">

          <td>${rowNumber}</td>

          <td>${row.Subject || "-"}</td>

          <td>${row.Year || "-"}</td>

          <td>${row.Category || "-"}</td>

          <td>${row.Title || "-"}</td>

          <td>${row.Type || "-"}</td>

          <td>
            ❌ ${invalid.errors.join(", ")}
          </td>

        </tr>

      `;
    } else {
      html += `

        <tr class="excel-valid">

          <td>${rowNumber}</td>

          <td>${row.Subject}</td>

          <td>${row.Year}</td>

          <td>${row.Category}</td>

          <td>${row.Title}</td>

          <td>${row.Type}</td>

          <td>
            ✅ Valid
          </td>

        </tr>

      `;
    }
  });

  html += `

        </tbody>

      </table>

    </div>

  `;

  preview.innerHTML = html;

  if (validExcelRows.length > 0) {
    actions.style.display = "block";
  } else {
    actions.style.display = "none";
  }
}

/* =========================================================
   IMPORT VALID RESOURCES
========================================================= */

/* =========================================================
   IMPORT VALID RESOURCES - DUPLICATE SAFE
========================================================= */

window.importExcelResources = async function () {
  if (!validExcelRows.length) {
    alert("There are no valid rows to import.");
    return;
  }

  const confirmImport = confirm(
    `Import ${validExcelRows.length} valid resources?`
  );

  if (!confirmImport) return;

  try {
    /* =====================================================
       1. GET EXISTING RESOURCES
       Duplicate = SAME SUBJECT + SAME URL
    ===================================================== */

    const { data: existingResources, error: existingError } =
      await supabaseClient.from("resources").select("subject_id, file_url");

    if (existingError) {
      throw existingError;
    }

    /* =====================================================
       2. CREATE EXISTING RESOURCE KEYS
    ===================================================== */

    const existingKeys = new Set();

    (existingResources || []).forEach((resource) => {
      const key = `${resource.subject_id}|${(resource.file_url || "")
        .trim()
        .toLowerCase()}`;

      existingKeys.add(key);
    });

    /* =====================================================
       3. CHECK EXCEL ROWS
    ===================================================== */

    const excelKeys = new Set();

    const resourcesToInsert = [];

    let skippedDuplicates = 0;

    validExcelRows.forEach((row) => {
      const subjectId = row.subject_id;

      const fileUrl = (row.file_url || "").trim();

      /* =================================================
         DUPLICATE KEY

         SAME SUBJECT + SAME URL

         Example:

         10|https://example.com/book
      ================================================= */

      const key = `${subjectId}|${fileUrl.toLowerCase()}`;

      /* =================================================
         ALREADY EXISTS IN DATABASE
      ================================================= */

      if (existingKeys.has(key)) {
        skippedDuplicates++;

        return;
      }

      /* =================================================
         DUPLICATE INSIDE SAME EXCEL FILE
      ================================================= */

      if (excelKeys.has(key)) {
        skippedDuplicates++;

        return;
      }

      /* =================================================
         MARK AS SEEN
      ================================================= */

      excelKeys.add(key);

      /* =================================================
         ADD RESOURCE
      ================================================= */

      resourcesToInsert.push({
        subject_id: row.subject_id,

        year: row.year,

        title: row.title,

        type: row.type,

        category: row.category,

        origin: row.origin,

        file_url: row.file_url,

        upload_date: null,

        cover_image: null,
      });
    });

    /* =====================================================
       4. NOTHING NEW
    ===================================================== */

    if (resourcesToInsert.length === 0) {
      alert(
        `No new resources to import.\n\n` +
          `⏭️ ${skippedDuplicates} duplicate resource(s) skipped.`
      );

      return;
    }

    /* =====================================================
       5. INSERT NEW RESOURCES
    ===================================================== */

    const { error: insertError } = await supabaseClient
      .from("resources")
      .insert(resourcesToInsert);

    if (insertError) {
      throw insertError;
    }

    /* =====================================================
       6. SUCCESS
    ===================================================== */

    alert(
      `Import completed successfully!\n\n` +
        `✅ Imported: ${resourcesToInsert.length}\n` +
        `⏭️ Duplicates skipped: ${skippedDuplicates}`
    );

    /* =====================================================
       7. RESET EXCEL IMPORT
    ===================================================== */

    document.getElementById("excelFile").value = "";

    document.getElementById("excelSummary").innerHTML = "";

    document.getElementById("excelPreview").innerHTML = "";

    document.getElementById("excelImportActions").style.display = "none";

    excelRows = [];

    validExcelRows = [];

    invalidExcelRows = [];

    /* =====================================================
       8. REFRESH ADMIN RESOURCE LIST
    ===================================================== */

    if (typeof loadResources === "function") {
      await loadResources();
    }
  } catch (error) {
    console.error("EXCEL IMPORT ERROR:", error);

    alert("Import failed: " + error.message);
  }
};
