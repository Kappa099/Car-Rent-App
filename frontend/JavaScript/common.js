let API_BASE = "http://127.0.0.1:8000";

let getAccessToken = () => localStorage.getItem("access");
let getRefreshToken = () => localStorage.getItem("refresh");
let setTokens = (access, refresh) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};
let clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

let refreshAccessToken = async () => {
  let refresh = getRefreshToken();
  if (!refresh) return false;

  let resp = await fetch(API_BASE + "/accounts/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  });

  if (!resp.ok) {
    clearTokens();
    return false;
  }

  let data = await resp.json();
  setTokens(data.access, refresh);
  return true;
};

let fetchWithAuth = async (endpoint, opts = {}) => {
  if (!opts.headers) opts.headers = {};
  opts.headers = { ...opts.headers, "Content-Type": "application/json" };
  let access = getAccessToken();
  if (access) opts.headers["Authorization"] = "Bearer " + access;

  let res = await fetch(API_BASE + endpoint, opts);

  if (res.status === 401) {
    let ok = await refreshAccessToken();
    if (!ok) throw new Error("Not authenticated");
    opts.headers["Authorization"] = "Bearer " + getAccessToken();
    res = await fetch(API_BASE + endpoint, opts);
  }

  return res;
};
