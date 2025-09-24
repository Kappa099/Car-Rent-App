const API_BASE = "http://127.0.0.1:8000";

function getAccessToken() { return localStorage.getItem("access"); }
function getRefreshToken() { return localStorage.getItem("refresh"); }
function setTokens(access, refresh) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
}
function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const resp = await fetch(API_BASE + "/accounts/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  });
  if (!resp.ok) { clearTokens(); return false; }
  const data = await resp.json();
  setTokens(data.access, refresh);
  return true;
}

async function fetchWithAuth(endpoint, opts = {}) {
  if (!opts.headers) opts.headers = {};
  opts.headers = {...opts.headers, "Content-Type": "application/json"};
  const access = getAccessToken();
  if (access) opts.headers["Authorization"] = `Bearer ${access}`;

  let res = await fetch(API_BASE + endpoint, opts);

  if (res.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error("Not authenticated");
    opts.headers["Authorization"] = `Bearer ${getAccessToken()}`;
    res = await fetch(API_BASE + endpoint, opts);
  }
  return res;
}
