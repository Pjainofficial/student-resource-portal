// document.addEventListener("DOMContentLoaded", async () => {
//   const {
//     data: { session },
//   } = await supabaseClient.auth.getSession();

//   if (session) {
//     window.location.href = "dashboard.html";
//   }
// });
window.login = async function () {
  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);

    return;
  }

  window.location.href = "dashboard.html";
};
