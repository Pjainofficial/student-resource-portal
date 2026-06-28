/************************************************
 * STUDENT PORTAL
 ************************************************/

document.addEventListener("DOMContentLoaded", () => {
  loadTopics();
  loadAboutUs();
  loadContactInfo();
});

/************************************************
 * LOAD TOPICS
 ************************************************/

async function loadTopics() {
  const topicsGrid = document.getElementById("topicsGrid");

  topicsGrid.innerHTML = `
        <div class="loading-card">
            Loading topics...
        </div>
    `;

  try {
    const { data, error } = await supabaseClient
      .from("topics")
      .select("*")
      .order("display_order", { ascending: true });

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
        openTopic(topic.id, topic.name);
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

/************************************************
 * OPEN TOPIC
 ************************************************/

function openTopic(topicId) {
  window.location.href = `subjects.html?topic=${topicId}`;
}

/************************************************
 * LOAD ABOUT US
 ************************************************/

async function loadAboutUs() {
  const aboutSection = document.getElementById("aboutSection");

  try {
    const { data, error } = await supabaseClient
      .from("about_us")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;

    aboutSection.innerHTML = `
            <h3>${data.title || ""}</h3>

            <br>

            <p>${data.description || ""}</p>

            <br>

            <strong>Vision</strong>

            <p>${data.vision || ""}</p>

            <br>

            <strong>Mission</strong>

            <p>${data.mission || ""}</p>
        `;
  } catch (err) {
    console.error(err);

    aboutSection.innerHTML = "Unable to load About Us.";
  }
}

/************************************************
 * LOAD CONTACT INFO
 ************************************************/

async function loadContactInfo() {
  const contactSection = document.getElementById("contactSection");

  try {
    const { data, error } = await supabaseClient
      .from("contact_info")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;

    contactSection.innerHTML = `
            <p>
                <strong>Organization:</strong>
                ${data.organization_name || ""}
            </p>

            <br>

            <p>
                <strong>Address:</strong>
                ${data.address || ""}
            </p>

            <br>

            <p>
                <strong>Email:</strong>
                ${data.email || ""}
            </p>

            <br>

            <p>
                <strong>Phone:</strong>
                ${data.phone || ""}
            </p>

            <br>

            <p>
                <strong>Website:</strong>
                ${data.website || ""}
            </p>

            <br>

            <p>
                <strong>Working Hours:</strong>
                ${data.working_hours || ""}
            </p>
        `;
  } catch (err) {
    console.error(err);

    contactSection.innerHTML = "Unable to load Contact Information.";
  }
}
