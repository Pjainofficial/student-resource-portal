/************************************************************
 * STUDENT PORTAL
 ************************************************************/

/* =========================================================
   GET SELECTED COLLEGE
========================================================= */

function getSelectedCollege() {
  const collegeData = localStorage.getItem("selectedCollege");

  if (!collegeData) {
    console.warn("No college selected.");
    return null;
  }

  try {
    return JSON.parse(collegeData);
  } catch (error) {
    console.error("Invalid selected college data:", error);
    return null;
  }
}

/* =========================================================
   LOAD COLLEGE BRANDING
========================================================= */

function loadCollegeBranding() {
  const college = getSelectedCollege();

  if (!college) {
    return;
  }

  console.log("Selected College:", college);

  /* -----------------------------------------
     COLLEGE NAME
  ----------------------------------------- */

  const collegeName = document.getElementById("collegeName");

  if (collegeName) {
    collegeName.innerText = college.name || "E-Gyan";
  }

  /* -----------------------------------------
     HEADER COLLEGE NAME
  ----------------------------------------- */

  const collegeHeader = document.getElementById("collegeHeader");

  if (collegeHeader) {
    collegeHeader.innerText = college.name || "E-Gyan";
  }

  /* -----------------------------------------
     LOGO
  ----------------------------------------- */

  const collegeLogo = document.getElementById("collegeLogo");

  if (collegeLogo) {
    if (college.logo_url) {
      collegeLogo.src = college.logo_url;
      collegeLogo.style.display = "block";
    } else {
      collegeLogo.style.display = "none";
    }
  }

  /* -----------------------------------------
     HERO IMAGE
  ----------------------------------------- */

  const collegeHero = document.getElementById("collegeHero");

  if (collegeHero) {
    if (college.cover_image_url) {
      collegeHero.style.backgroundImage = `url("${college.cover_image_url}")`;

      collegeHero.classList.add("college-dynamic-hero");
    } else {
      collegeHero.style.backgroundImage = "none";
      collegeHero.classList.remove("college-dynamic-hero");
    }
  }

  /* -----------------------------------------
     PAGE TITLE
  ----------------------------------------- */

  document.title = `${college.name || "E-Gyan"} | E-Gyan Knowledge Library`;
}

/* =========================================================
   INITIALIZE STUDENT PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadCollegeBranding();

  loadTopics();
  loadCounts();
  loadHeroBooks();

  const input = document.getElementById("globalSearch");

  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        globalSearch();
      }
    });
  }
});

/************************************************************
 * TOPICS
 ************************************************************/

let allTopics = [];

/* =========================================================
   LOAD COUNTS
========================================================= */

async function loadCounts() {
  try {
    const { count: resourceCount, error: resourceError } = await supabaseClient
      .from("resources")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (resourceError) {
      console.error("Resource count error:", resourceError);
    }

    const { count: subjectCount, error: subjectError } = await supabaseClient
      .from("subjects")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (subjectError) {
      console.error("Subject count error:", subjectError);
    }

    const { count: topicCount, error: topicError } = await supabaseClient
      .from("topics")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (topicError) {
      console.error("Topic count error:", topicError);
    }

    const resourceCounter = document.getElementById("resourceCounter");

    const subjectCounter = document.getElementById("subjectCounter");

    const topicCounter = document.getElementById("topicCounter");

    if (resourceCounter) {
      resourceCounter.innerText = resourceCount || 0;
    }

    if (subjectCounter) {
      subjectCounter.innerText = subjectCount || 0;
    }

    if (topicCounter) {
      topicCounter.innerText = topicCount || 0;
    }
  } catch (error) {
    console.error("COUNT ERROR:", error);
  }
}

/* =========================================================
   LOAD TOPICS
========================================================= */

async function loadTopics() {
  const topicsGrid = document.getElementById("topicsGrid");

  if (!topicsGrid) {
    return;
  }

  topicsGrid.innerHTML = `
    <div class="loading-card">
      Loading topics...
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("topics")
      .select(
        `
          *,
          subjects(
            id,
            resources(id)
          )
        `
      )
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    allTopics = data || [];

    if (allTopics.length === 0) {
      topicsGrid.innerHTML = `
        <div class="loading-card">
          No topics found.
        </div>
      `;

      return;
    }

    renderTopics(allTopics);
  } catch (error) {
    console.error("TOPICS ERROR:", error);

    topicsGrid.innerHTML = `
      <div class="loading-card">
        Failed to load topics.
      </div>
    `;
  }
}

/* =========================================================
   RENDER TOPICS
========================================================= */

function renderTopics(topics) {
  const topicsGrid = document.getElementById("topicsGrid");

  if (!topicsGrid) {
    return;
  }

  topicsGrid.innerHTML = "";

  if (!topics || topics.length === 0) {
    topicsGrid.innerHTML = `
      <div class="loading-card">
        No topics found.
      </div>
    `;

    return;
  }

  topics.forEach((topic) => {
    const subjectCount = topic.subjects?.length || 0;

    let resourceCount = 0;

    topic.subjects?.forEach((subject) => {
      resourceCount += subject.resources?.length || 0;
    });

    const card = document.createElement("div");

    card.className = "topic-card";

    card.innerHTML = `
      <div class="topic-icon">
        📚
      </div>

      <h3>
        ${topic.name}
      </h3>

      <p>
        ${topic.description || "No description available."}
      </p>

      <div class="topic-meta">

        <span>
          📖 ${subjectCount} Subjects
        </span>

        <span>
          📄 ${resourceCount} Resources
        </span>

      </div>

      <button class="explore-btn">
        Explore →
      </button>
    `;

    card.onclick = () => openTopic(topic.id);

    topicsGrid.appendChild(card);
  });
}

/* =========================================================
   OPEN TOPIC
========================================================= */

function openTopic(topicId) {
  window.location.href = `subjects.html?topic=${topicId}`;
}

/************************************************************
 * HERO BOOKS
 ************************************************************/

async function loadHeroBooks() {
  try {
    const { data, error } = await supabaseClient
      .from("resources")
      .select("cover_image,title")
      .not("cover_image", "is", null)
      .order("upload_date", {
        ascending: false,
      })
      .limit(25);

    if (error) {
      console.error("Hero books error:", error);
      return;
    }

    const track = document.getElementById("booksTrack");

    if (!track) {
      return;
    }

    track.innerHTML = "";

    (data || []).forEach((book) => {
      track.innerHTML += `
        <img
          src="${book.cover_image}"
          alt="${book.title || "Book"}"
          title="${book.title || "Book"}"
          class="hero-book"
        />
      `;
    });
  } catch (error) {
    console.error("HERO BOOK ERROR:", error);
  }
}

/************************************************************
 * GLOBAL SEARCH
 ************************************************************/

window.globalSearch = function () {
  const input = document.getElementById("globalSearch");

  if (!input) {
    return;
  }

  const search = input.value.toLowerCase().trim();

  if (search === "") {
    renderTopics(allTopics);

    const topicsSection = document.getElementById("topics");

    if (topicsSection) {
      topicsSection.scrollIntoView({
        behavior: "smooth",
      });
    }

    return;
  }

  const filtered = allTopics.filter(
    (topic) =>
      topic.name.toLowerCase().includes(search) ||
      (topic.description || "").toLowerCase().includes(search)
  );

  renderTopics(filtered);

  setTimeout(() => {
    const topicsSection = document.getElementById("topics");

    if (topicsSection) {
      topicsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 100);
};
