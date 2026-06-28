document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "student-login.html";
  }
});
