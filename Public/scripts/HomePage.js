

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

function presentClicked(element)
{
    alert(`Present ${element.id}`);
}

function absentClicked(element)
{
  alert(`Absent ${element.id}`);
}

function cancelledClicked(element)
{
  alert(`Cancelled ${element.id}`);
}

/************************Setting Click Listeners********************/

//Setting click listener on logout button
document.getElementById("home_logout_btn").addEventListener("click", logoutClick);

//Setting click listeners for subject card control buttons
const presentButtons = document.querySelectorAll(".subject_control_present");
const absentButtons = document.querySelectorAll(".subject_control_absent");
const cancelledButtons = document.querySelectorAll(".subject_control_cancelled");
for(let a = 0; a < presentButtons.length; ++a)
{
  presentButtons[a].addEventListener("click", function() {presentClicked(this)});
  absentButtons[a].addEventListener("click", function(){ absentClicked(this) });
  cancelledButtons[a].addEventListener("click", function(){ cancelledClicked(this) });
}

