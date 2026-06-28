// document.addEventListener("DOMContentLoaded", () => {
//   loadCounts();
// });

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
});

async function loadStats() {
  try {
    const { count: topics } = await supabaseClient.from("topics").select("*", {
      count: "exact",
      head: true,
    });

    const { count: subjects } = await supabaseClient
      .from("subjects")
      .select("*", {
        count: "exact",
        head: true,
      });

    const { count: resources } = await supabaseClient
      .from("resources")
      .select("*", {
        count: "exact",
        head: true,
      });

    document.getElementById("topicCount").innerText = topics || 0;

    document.getElementById("subjectCount").innerText = subjects || 0;

    document.getElementById("resourceCount").innerText = resources || 0;
  } catch (err) {
    console.error(err);
  }
}

async function loadCounts() {
  try {
    const topics = await supabaseClient
      .from("topics")
      .select("*", { count: "exact" });

    const subjects = await supabaseClient
      .from("subjects")
      .select("*", { count: "exact" });

    const resources = await supabaseClient
      .from("resources")
      .select("*", { count: "exact" });

    document.getElementById("topicCount").innerText = topics.count || 0;

    document.getElementById("subjectCount").innerText = subjects.count || 0;

    document.getElementById("resourceCount").innerText = resources.count || 0;
  } catch (err) {
    console.error(err);
  }
}
