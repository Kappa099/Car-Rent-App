(async () => {
  const welcomeEl = document.getElementById("welcome");

  if (getAccessToken()) {
    try {
      const res = await fetchWithAuth("/accounts/me/", { method: "GET" });
      if (res.ok) {
        const user = await res.json();
        welcomeEl.textContent = `Welcome ${user.first_name} ${user.last_name}`;
      }
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  }
})();
