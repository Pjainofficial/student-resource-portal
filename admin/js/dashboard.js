document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
});

async function loadDashboardStats() {
  try {
    // =========================
    // TOPICS
    // =========================

    const { count: topicCount, error: topicError } = await supabaseClient
      .from("topics")
      .select("*", { count: "exact", head: true });

    if (topicError) {
      throw topicError;
    }

    document.getElementById("topicCount").innerText = topicCount || 0;

    // =========================
    // SUBJECTS
    // =========================

    const { count: subjectCount, error: subjectError } = await supabaseClient
      .from("subjects")
      .select("*", { count: "exact", head: true });

    if (subjectError) {
      throw subjectError;
    }

    document.getElementById("subjectCount").innerText = subjectCount || 0;

    // =========================
    // RESOURCES
    // =========================

    const { count: resourceCount, error: resourceError } = await supabaseClient
      .from("resources")
      .select("*", { count: "exact", head: true });

    if (resourceError) {
      throw resourceError;
    }

    document.getElementById("resourceCount").innerText = resourceCount || 0;

    // =========================
    // COLLEGES
    // =========================

    const { count: collegeCount, error: collegeError } = await supabaseClient
      .from("colleges")
      .select("*", { count: "exact", head: true });

    if (collegeError) {
      throw collegeError;
    }

    document.getElementById("collegeCount").innerText = collegeCount || 0;
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
  }
}
