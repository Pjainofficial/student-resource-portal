let editingCollegeId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadColleges();
});

// ===============================
// LOAD ALL COLLEGES
// ===============================
async function loadColleges() {
  try {
    const { data, error } = await supabaseClient
      .from("colleges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const list = document.getElementById("collegesList");
    const count = document.getElementById("collegeCount");

    if (count) {
      count.innerText = data.length;
    }

    if (!list) return;

    if (!data || data.length === 0) {
      list.innerHTML = "<p>No colleges added yet.</p>";
      return;
    }

    list.innerHTML = data
      .map(
        (college) => `
        <div class="college-card">

          ${
            college.logo_url
              ? `<img
                  src="${college.logo_url}"
                  alt="${college.name}"
                  class="college-logo"
                />`
              : `<div class="college-logo-placeholder">🏫</div>`
          }

          <div class="college-info">
            <h3>${college.name}</h3>

            <p>
              <strong>Portal:</strong>
              ${college.portal_title || "Digital Knowledge Library"}
            </p>

            <p>
              <strong>Username:</strong>
              ${college.username || "-"}
            </p>

            <p>
              <strong>Status:</strong>
              ${
                college.is_active
                  ? `<span class="status-active">Active</span>`
                  : `<span class="status-inactive">Inactive</span>`
              }
            </p>
          </div>

          <div class="college-actions">
            <button
              onclick="editCollege(${college.id})"
              class="action-btn"
            >
              ✏️ Edit
            </button>
          </div>

        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("LOAD COLLEGES ERROR:", error);
    alert("Unable to load colleges.");
  }
}

// ===============================
// ADD / UPDATE COLLEGE
// ===============================
window.addCollege = async function () {
  const name = document.getElementById("collegeName").value.trim();

  const title = document.getElementById("collegeTitle").value.trim();

  const username = document
    .getElementById("collegeUsername")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("collegePassword").value;

  const logoFile = document.getElementById("collegeLogo").files[0];

  const coverFile = document.getElementById("collegeCover").files[0];

  const status = document.getElementById("collegeStatus").value === "true";

  // ===============================
  // VALIDATION
  // ===============================
  if (!name) {
    alert("Please enter college name.");
    return;
  }

  if (!title) {
    alert("Please enter portal title.");
    return;
  }

  if (!username) {
    alert("Please enter college username.");
    return;
  }

  // Password required only while creating
  if (!editingCollegeId && !password) {
    alert("Please enter a password.");
    return;
  }

  try {
    // ===============================
    // UPLOAD LOGO
    // ===============================
    let logoUrl = null;

    if (logoFile) {
      const fileName = `logo-${Date.now()}-${logoFile.name}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("college-assets")
        .upload(fileName, logoFile, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseClient.storage
        .from("college-assets")
        .getPublicUrl(fileName);

      logoUrl = data.publicUrl;
    }

    // ===============================
    // UPLOAD COVER IMAGE
    // ===============================
    let coverUrl = null;

    if (coverFile) {
      const fileName = `cover-${Date.now()}-${coverFile.name}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("college-assets")
        .upload(fileName, coverFile, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseClient.storage
        .from("college-assets")
        .getPublicUrl(fileName);

      coverUrl = data.publicUrl;
    }

    // ===============================
    // CREATE COLLEGE
    // ===============================
    if (!editingCollegeId) {
      const { data, error } = await supabaseClient.functions.invoke(
        "manage-college",
        {
          body: {
            action: "create",

            name: name,

            portal_title: title,

            username: username,

            password: password,

            is_active: status,

            logo_url: logoUrl,

            cover_image_url: coverUrl,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      alert("College added successfully!");
    }

    // ===============================
    // UPDATE COLLEGE
    // ===============================
    else {
      const { data, error } = await supabaseClient.functions.invoke(
        "manage-college",
        {
          body: {
            action: "update",

            collegeId: editingCollegeId,

            name: name,

            portal_title: title,

            username: username,

            // Send password only if admin
            // entered a new password
            password: password || null,

            is_active: status,

            logo_url: logoUrl,

            cover_image_url: coverUrl,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      alert("College updated successfully!");
    }

    // ===============================
    // RESET FORM
    // ===============================
    resetCollegeForm();

    // Reload college list
    await loadColleges();
  } catch (error) {
    console.error("COLLEGE SAVE ERROR:", error);

    alert(error.message || "Unable to save college.");
  }
};

// ===============================
// EDIT COLLEGE
// ===============================
window.editCollege = async function (collegeId) {
  try {
    const { data: college, error } = await supabaseClient
      .from("colleges")
      .select("*")
      .eq("id", collegeId)
      .single();

    if (error) {
      throw error;
    }

    editingCollegeId = collegeId;

    document.getElementById("collegeName").value = college.name || "";

    document.getElementById("collegeTitle").value = college.portal_title || "";

    document.getElementById("collegeUsername").value = college.username || "";

    // Never load/display the existing password
    document.getElementById("collegePassword").value = "";

    document.getElementById("collegeStatus").value = college.is_active
      ? "true"
      : "false";

    // Change button text
    const button = document.getElementById("saveCollegeBtn");

    if (button) {
      button.innerText = "Update College";
    }

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("EDIT COLLEGE ERROR:", error);

    alert(error.message || "Unable to load college.");
  }
};

// ===============================
// RESET FORM
// ===============================
function resetCollegeForm() {
  editingCollegeId = null;

  const nameInput = document.getElementById("collegeName");

  const titleInput = document.getElementById("collegeTitle");

  const usernameInput = document.getElementById("collegeUsername");

  const passwordInput = document.getElementById("collegePassword");

  const logoInput = document.getElementById("collegeLogo");

  const coverInput = document.getElementById("collegeCover");

  const statusInput = document.getElementById("collegeStatus");

  if (nameInput) nameInput.value = "";

  if (titleInput) titleInput.value = "";

  if (usernameInput) usernameInput.value = "";

  if (passwordInput) passwordInput.value = "";

  if (logoInput) logoInput.value = "";

  if (coverInput) coverInput.value = "";

  if (statusInput) statusInput.value = "true";

  const button = document.getElementById("saveCollegeBtn");

  if (button) {
    button.innerText = "Add College";
  }
}
