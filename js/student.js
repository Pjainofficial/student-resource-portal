/*******************************************************
 * STUDENT PORTAL
 *******************************************************/

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

  /* -----------------------------------------
     GLOBAL SEARCH ENTER KEY
  ----------------------------------------- */

  const input = document.getElementById("globalSearch");

  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        globalSearch();
      }
    });
  }
});

/*******************************************************
 * TOPICS
 *******************************************************/

let allTopics = [];

/* =========================================================
   LOAD COUNTS
========================================================= */

async function loadCounts() {
  try {
    /* -----------------------------------------
       RESOURCE COUNT
    ----------------------------------------- */

    const { count: resourceCount, error: resourceError } = await supabaseClient
      .from("resources")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (resourceError) {
      console.error("Resource count error:", resourceError);
    }

    /* -----------------------------------------
       SUBJECT COUNT
    ----------------------------------------- */

    const { count: subjectCount, error: subjectError } = await supabaseClient
      .from("subjects")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (subjectError) {
      console.error("Subject count error:", subjectError);
    }

    /* -----------------------------------------
       TOPIC COUNT
    ----------------------------------------- */

    const { count: topicCount, error: topicError } = await supabaseClient
      .from("topics")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (topicError) {
      console.error("Topic count error:", topicError);
    }

    /* -----------------------------------------
       UPDATE COUNTERS
    ----------------------------------------- */

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

  /* -----------------------------------------
     LOADING STATE
  ----------------------------------------- */

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

    /* -----------------------------------------
       NO TOPICS
    ----------------------------------------- */

    if (allTopics.length === 0) {
      topicsGrid.innerHTML = `
        <div class="loading-card">
          No topics found.
        </div>
      `;

      return;
    }

    /* -----------------------------------------
       RENDER TOPICS
    ----------------------------------------- */

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

/* =========================================================
   RENDER TOPICS
========================================================= */
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
        No courses found.
      </div>
    `;

    return;
  }

  /* =======================================================
     CREATE COURSE CARDS
  ======================================================= */

  topics.forEach((topic) => {
    const subjectCount = topic.subjects?.length || 0;

    let resourceCount = 0;

    topic.subjects?.forEach((subject) => {
      resourceCount += subject.resources?.length || 0;
    });

    const description = topic.description || "No description available.";

    /*
     * Long descriptions get Show more.
     */
    const isLongDescription = description.length > 180;

    const card = document.createElement("div");

    card.className = "topic-card";

    /* =====================================================
       CARD HTML
    ===================================================== */

    card.innerHTML = `

      <div class="topic-icon">
        📚
      </div>


      <h3>
        ${topic.name || "Untitled Course"}
      </h3>


      <div class="topic-description-box">

        <p
          class="topic-description ${
            isLongDescription ? "description-collapsed" : ""
          }"
        >
          ${description}
        </p>


        ${
          isLongDescription
            ? `
              <button
                type="button"
                class="show-more-link"
              >
                Show more ↓
              </button>
            `
            : ""
        }

      </div>


      <div class="topic-meta">

        <span>
          📖 ${subjectCount} Subjects
        </span>

        <span>
          📄 ${resourceCount} Resources
        </span>

      </div>


      <button
        type="button"
        class="explore-btn"
      >
        Explore →
      </button>

    `;

    topicsGrid.appendChild(card);
  });

  /* =======================================================
     CLICK HANDLING

     Using ONE event listener for the whole grid.
     This avoids the Show More / card-click conflict.
  ======================================================= */

  topicsGrid.onclick = function (event) {
    /* =====================================================
       SHOW MORE / SHOW LESS
    ===================================================== */

    const showMoreButton = event.target.closest(".show-more-link");

    if (showMoreButton) {
      event.preventDefault();

      event.stopPropagation();

      const card = showMoreButton.closest(".topic-card");

      if (!card) {
        return;
      }

      const description = card.querySelector(".topic-description");

      if (!description) {
        return;
      }

      const isCollapsed = description.classList.contains(
        "description-collapsed"
      );

      if (isCollapsed) {
        /*
         * SHOW FULL DESCRIPTION
         */
        description.classList.remove("description-collapsed");

        showMoreButton.textContent = "Show less ↑";
      } else {
        /*
         * COLLAPSE DESCRIPTION
         */
        description.classList.add("description-collapsed");

        showMoreButton.textContent = "Show more ↓";
      }

      return;
    }

    /* =====================================================
       EXPLORE BUTTON
    ===================================================== */

    const exploreButton = event.target.closest(".explore-btn");

    if (exploreButton) {
      event.preventDefault();

      event.stopPropagation();

      const card = exploreButton.closest(".topic-card");

      if (!card) {
        return;
      }

      const topicIndex = Array.from(topicsGrid.children).indexOf(card);

      if (topicIndex >= 0 && topics[topicIndex]) {
        openTopic(topics[topicIndex].id);
      }

      return;
    }

    /* =====================================================
       CARD CLICK
    ===================================================== */

    const card = event.target.closest(".topic-card");

    if (card) {
      const topicIndex = Array.from(topicsGrid.children).indexOf(card);

      if (topicIndex >= 0 && topics[topicIndex]) {
        openTopic(topics[topicIndex].id);
      }
    }
  };
}
/* =========================================================
   OPEN TOPIC
========================================================= */

function openTopic(topicId) {
  window.location.href = `subjects.html?topic=${topicId}`;
}

/*******************************************************
 * HERO BOOKS
 *******************************************************/

/* =========================================================
   LOAD HERO BOOKS
========================================================= */

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

    /* -----------------------------------------
       CREATE BOOK IMAGES
    ----------------------------------------- */

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

/*******************************************************
 * GLOBAL SEARCH
 *******************************************************/

/* =========================================================
   GLOBAL SEARCH
========================================================= */

window.globalSearch = function () {
  const input = document.getElementById("globalSearch");

  if (!input) {
    return;
  }

  const search = input.value.toLowerCase().trim();

  /* -----------------------------------------
     EMPTY SEARCH
  ----------------------------------------- */

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

  /* -----------------------------------------
     FILTER TOPICS
  ----------------------------------------- */

  const filtered = allTopics.filter(
    (topic) =>
      topic.name.toLowerCase().includes(search) ||
      (topic.description || "").toLowerCase().includes(search)
  );

  /* -----------------------------------------
     RENDER SEARCH RESULTS
  ----------------------------------------- */

  renderTopics(filtered);

  /* -----------------------------------------
     SCROLL TO TOPICS
  ----------------------------------------- */

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
