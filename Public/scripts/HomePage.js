

/************************Functions********************/
function logoutClick()
{
  //Generating promise
  const fetchPromise = fetch("/logout");
  
  fetchPromise.then((resp) => {
    //Redirecting to login page
    window.location.href = "/";

  }).catch((err) => console.log(err));
    
}

/************************Setting Click Listeners********************/

//Setting click listener on logout button
document.getElementById("home_logout_btn").addEventListener("click", logoutClick);


