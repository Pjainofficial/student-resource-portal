async function loadLandingCollege() {
  try {
    // ==========================================
    // 1. CHECK AUTH SESSION
    // ==========================================

    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("SESSION ERROR:", sessionError);

      window.location.replace("student-login.html");
      return;
    }

    // User is not logged in
    if (!session) {
      window.location.replace("student-login.html");
      return;
    }

    const user = session.user;

    console.log("AUTHENTICATED USER:", user.id);

    // ==========================================
    // 2. FIND COLLEGE CONNECTED TO THIS USER
    // ==========================================

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

    // ==========================================
    // 3. HANDLE INVALID COLLEGE MAPPING
    // ==========================================

    if (mappingError) {
      console.error("COLLEGE MAPPING ERROR:", mappingError);

      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    if (!collegeUser?.colleges) {
      console.error("NO COLLEGE FOUND FOR USER:", user.id);

      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    // ==========================================
    // 4. GET COLLEGE
    // ==========================================

    const college = collegeUser.colleges;

    console.log("AUTHENTICATED COLLEGE:", college);

    // ==========================================
    // 5. CHECK COLLEGE STATUS
    // ==========================================

    if (!college.is_active) {
      alert("This college portal is currently inactive.");

      await supabaseClient.auth.signOut();

      window.location.replace("student-login.html");

      return;
    }

    // ==========================================
    // 6. STORE COLLEGE ID
    // UI convenience only.
    // Authentication does NOT depend on this.
    // ==========================================

    localStorage.setItem("selectedCollegeId", college.id);

    localStorage.setItem(
      "selectedCollege",
      JSON.stringify({
        id: college.id,
        name: college.name,
        portal_title: college.portal_title,
        logo_url: college.logo_url,
        cover_image_url: college.cover_image_url,
      })
    );

    // ==========================================
    // 7. UPDATE PAGE TITLE
    // ==========================================

    document.title = `${college.name} | ${
      college.portal_title || "Digital Knowledge Library"
    }`;

    // ==========================================
    // 8. NAVBAR COLLEGE NAME
    // ==========================================

    const collegeName = document.getElementById("collegeName");

    if (collegeName) {
      collegeName.innerText = college.name;
    }

    // ==========================================
    // 9. HERO COLLEGE NAME
    // ==========================================

    const heroCollegeName = document.getElementById("heroCollegeName");

    if (heroCollegeName) {
      heroCollegeName.innerText = college.name;
    }

    // ==========================================
    // 10. PORTAL TITLE
    // ==========================================

    const portalTitle = document.getElementById("portalTitle");

    if (portalTitle) {
      portalTitle.innerText =
        college.portal_title || "Digital Knowledge Library";
    }

    // ==========================================
    // 11. COLLEGE LOGO
    // ==========================================

    const logoElements = ["collegeLogo", "footerLogo"];

    logoElements.forEach((id) => {
      const logo = document.getElementById(id);

      if (!logo) {
        return;
      }

      if (college.logo_url) {
        logo.src = college.logo_url;

        logo.alt = `${college.name} Logo`;

        logo.style.display = "block";
      } else {
        logo.removeAttribute("src");

        logo.style.display = "none";
      }
    });

    // ==========================================
    // 12. FOOTER COLLEGE NAME
    // ==========================================

    const footerCollegeName = document.getElementById("footerCollegeName");

    if (footerCollegeName) {
      footerCollegeName.innerText = college.name;
    }

    // ==========================================
    // 13. HERO COVER IMAGE
    // ==========================================

    const hero = document.querySelector(".landing-hero");

    const defaultCover =
      "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=2000&q=90";

    if (hero) {
      const coverImage = college.cover_image_url || defaultCover;

      hero.style.backgroundImage = `
        linear-gradient(
          rgba(15, 23, 42, 0.48),
          rgba(15, 23, 42, 0.68)
        ),
        url("${coverImage}")
      `;

      hero.style.backgroundSize = "cover";

      hero.style.backgroundPosition = "center";

      hero.style.backgroundRepeat = "no-repeat";

      hero.style.filter = "none";
    }

    // ==========================================
    // 14. EXPLORE COURSES BUTTON
    // ==========================================

    const exploreButton = document.getElementById("exploreBtn");

    if (exploreButton) {
      exploreButton.href = "index.html";
    }

    // ==========================================
    // 15. UPDATE ALL INDEX LINKS
    // ==========================================

    const courseLinks = document.querySelectorAll('a[href="index.html"]');

    courseLinks.forEach((link) => {
      link.href = "index.html";
    });
  } catch (error) {
    // ==========================================
    // UNEXPECTED ERROR
    // ==========================================

    console.error("LANDING PAGE ERROR:", error);

    try {
      await supabaseClient.auth.signOut();
    } catch (signOutError) {
      console.error("SIGN OUT ERROR:", signOutError);
    }

    window.location.replace("student-login.html");
  }
}

// ==========================================
// LOAD LANDING PAGE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadLandingCollege();
});
