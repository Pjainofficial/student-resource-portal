/* =========================================================
   COLLEGE LOGIN
========================================================= */

window.loginStudent = async function () {
  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }

  try {
    /* -----------------------------------------------------
       FIND COLLEGE
    ----------------------------------------------------- */

    const { data: college, error: collegeLookupError } = await supabaseClient
      .from("colleges")
      .select(
        `
        id,
        name,
        portal_title,
        username,
        logo_url,
        cover_image_url,
        is_active
      `
      )
      .eq("username", username)
      .maybeSingle();

    if (collegeLookupError) {
      throw collegeLookupError;
    }

    if (!college) {
      alert("Invalid college username or password.");
      return;
    }

    /* -----------------------------------------------------
       CHECK COLLEGE STATUS
    ----------------------------------------------------- */

    if (!college.is_active) {
      alert("This college portal is currently inactive.");
      return;
    }

    /* -----------------------------------------------------
       CONVERT USERNAME TO INTERNAL AUTH EMAIL
       
       College user never sees this email.
    ----------------------------------------------------- */

    const authEmail = `${username}@college.egyan.internal`;

    /* -----------------------------------------------------
       SUPABASE AUTH LOGIN
    ----------------------------------------------------- */

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });

    if (error) {
      throw error;
    }

    const user = data.user;

    if (!user) {
      throw new Error("Authentication failed.");
    }

    /* -----------------------------------------------------
       FIND COLLEGE ASSOCIATED WITH AUTH USER
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

      alert(
        "This account is not properly associated with a college. Please contact administrator."
      );

      return;
    }

    if (!collegeUser?.colleges) {
      await supabaseClient.auth.signOut();

      alert("College information not found.");

      return;
    }

    /* -----------------------------------------------------
       CHECK COLLEGE STATUS AGAIN
    ----------------------------------------------------- */

    if (!collegeUser.colleges.is_active) {
      await supabaseClient.auth.signOut();

      alert("This college portal is currently inactive.");

      return;
    }

    /* -----------------------------------------------------
       SAVE COLLEGE INFORMATION
       
       Used for UI convenience only.
       Authentication is still checked from Supabase.
    ----------------------------------------------------- */

    localStorage.setItem("selectedCollegeId", collegeUser.college_id);

    localStorage.setItem(
      "selectedCollege",
      JSON.stringify(collegeUser.colleges)
    );

    /* -----------------------------------------------------
       GO TO EXISTING WELCOME PAGE
    ----------------------------------------------------- */

    window.location.href = "landing.html";
  } catch (error) {
    console.error("COLLEGE LOGIN ERROR:", error);

    alert(
      error.message ||
        "Unable to login. Please check your username and password."
    );
  }
};

/* =========================================================
   COLLEGE LOGOUT
========================================================= */

window.logoutStudent = async function () {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
  } finally {
    localStorage.removeItem("selectedCollegeId");

    localStorage.removeItem("selectedCollege");

    window.location.href = "student-login.html";
  }
};
