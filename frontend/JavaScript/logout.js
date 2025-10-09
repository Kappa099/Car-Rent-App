async function logout(){
  let refresh = getRefreshToken();
  try{
    await fetch(API_BASE + "/accounts/logout/", {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({refresh})
    });
  }catch(e){ console.warn("Logout failed",e);}
  finally{ clearTokens(); window.location.href="login.html"; }
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);
