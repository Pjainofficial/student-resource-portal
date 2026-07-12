// document.addEventListener("DOMContentLoaded", async () => {
//   const {
//     data: { session },
//   } = await supabaseClient.auth.getSession();

//   if (!session) {
//     window.location.href = "login.html";
//   }
// });
const ADMIN_EMAIL = "admin@delnet.com"; // replace with your actual admin email
window.logout = async function () {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    alert("Logout failed");
    return;
  }

  window.location.replace("login.html");
};
