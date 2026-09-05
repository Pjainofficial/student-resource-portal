/* =========================================================
   COLLEGE LANDING PAGE
========================================================= */

/* =========================================================
   LOAD AUTHENTICATED COLLEGE
========================================================= */

async function loadLandingCollege() {
  try {
    /* -----------------------------------------------------
       CHECK LOGIN SESSION
    ----------------------------------------------------- */

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.replace("student-login.html");
      return;
    }

    const user = session.user;

    /* -----------------------------------------------------
       FIND COLLEGE FOR LOGGED-IN USER
    ----------------------------------------------------- */

    const { data: collegeUser, error: mappingError } = await supabaseClient
      .from("college_users")
      .select(
        `
        college_id,
        colleges (
          id,
          name,
          portal_title,
          logo_url,
          cover_image_url,
          is_active
        )
      `
      )
      .eq("user_id", user.id)
      .single();

    if (mappingError) {
      console.error("COLLEGE MAPPING ERROR:", mappingError);

      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    if (!collegeUser?.colleges) {
      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    const college = collegeUser.colleges;

    /* =====================================================
       CHECK COLLEGE STATUS
    ===================================================== */

    if (!college.is_active) {
      alert("This college portal is currently inactive.");

      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    /* =====================================================
       PAGE TITLE
    ===================================================== */

    document.title = `${college.name} | ${
      college.portal_title || "Digital Knowledge Library"
    }`;

    /* =====================================================
       NAVBAR COLLEGE NAME
    ===================================================== */

    const collegeName = document.getElementById("collegeName");

    if (collegeName) {
      collegeName.innerText = college.name;
    }

    /* =====================================================
       HERO COLLEGE NAME
    ===================================================== */

    const heroCollegeName = document.getElementById("heroCollegeName");

    if (heroCollegeName) {
      heroCollegeName.innerText = college.name;
    }

    /* =====================================================
       PORTAL TITLE
    ===================================================== */

    const portalTitle = document.getElementById("portalTitle");

    if (portalTitle) {
      portalTitle.innerText =
        college.portal_title || "Digital Knowledge Library";
    }

    /* =====================================================
       COLLEGE LOGO
       
       Only navbar + footer.
       No hero logo.
    ===================================================== */

    const logoElements = ["collegeLogo", "footerLogo"];

    logoElements.forEach((id) => {
      const logo = document.getElementById(id);

      if (!logo) return;

      if (college.logo_url) {
        logo.src = college.logo_url;

        logo.style.display = "block";
      } else {
        logo.style.display = "none";
      }
    });

    /* =====================================================
       FOOTER COLLEGE NAME
    ===================================================== */

    const footerCollegeName = document.getElementById("footerCollegeName");

    if (footerCollegeName) {
      footerCollegeName.innerText = college.name;
    }

    /* =====================================================
       HERO COVER IMAGE
       
       College uploaded image:
       → use college image

       No college image:
       → use generic library image
    ===================================================== */

    const hero = document.querySelector(".landing-hero");

    const defaultCover =
      "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=2000&q=85";

    if (hero) {
      const coverImage = college.cover_image_url || defaultCover;

      hero.style.backgroundImage = `
        linear-gradient(
          rgba(15, 23, 42, 0.55),
          rgba(15, 23, 42, 0.70)
        ),
        url("${coverImage}")
      `;

      hero.style.backgroundSize = "cover";

      hero.style.backgroundPosition = "center";

      hero.style.backgroundRepeat = "no-repeat";
    }

    /* =====================================================
       LOGOUT BUTTON
    ===================================================== */

    const logoutButton = document.getElementById("logoutBtn");

    if (logoutButton) {
      logoutButton.addEventListener("click", async function (event) {
        event.preventDefault();

        await logoutStudent();
      });
    }

    /* =====================================================
       EXPLORE COURSES
       
       User is already authenticated,
       so go directly to library.
    ===================================================== */

    const exploreButton = document.getElementById("exploreBtn");

    if (exploreButton) {
      exploreButton.href = "index.html";
    }

    /* =====================================================
       DEBUG
    ===================================================== */

    console.log("AUTHENTICATED COLLEGE:", college);
  } catch (error) {
    /* =======================================================
     ERROR HANDLING
  ======================================================= */

    console.error("LANDING PAGE ERROR:", error);

    await supabaseClient.auth.signOut();

    window.location.replace("student-login.html");
  }
}

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  loadLandingCollege();
});
