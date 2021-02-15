
/***********************Global Variables********************/
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; //Array containing names of the days of week to display in the calendar cells
const MONTHS_OF_YEAR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]; //Array containing names of the months to be displayed in the calendar header
let calendarInitialzed = false; //Whether the calendar has been initalized before

let currMonth; //The currently displayed month in the calendar
let currYear; //The currently displayed year in the calendar

let currSubject; //The id of the currently viewed subject

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

function initializeCalendar()
{
  /*Creates and sets up the calendar widget from scratch*/

  const calendarDiv = document.getElementById("calendar_body"); //Getting the calendar division

  //Getting the current date info
  const currDate = new Date();
  const totalDays = getDaysInMonth(currDate.getMonth(), currDate.getFullYear()); //The total number of days in the current month
  const firstDay = new Date(currDate.getFullYear(), currDate.getMonth()+1, 1).getDay(); //Getting the 1st day of the month
  
  //Setting the global vars
  currYear = currDate.getFullYear();
  currMonth = currDate.getMonth()+1;

  //Creating and populating the calendar cells
  let html = ""; //The html string for the calendar cells to be added
  for(let i = 0; i < totalDays; ++i)
  {
    //Displaying the day name only for the top row i.e the dates from 1 to 7
    let day = "";
    if(i < 7)
      day = DAYS_OF_WEEK[(6+firstDay+i)%7];

    html = `<div class="calendar_cell"><p id="day">${day}</p><p id="date">${i+1}</p>`;

    //Adding the element to the calendar
    calendarDiv.insertAdjacentHTML("beforeend", html);
  }

  //Setting the calendar header
  document.getElementById("calendar_title").textContent = `${MONTHS_OF_YEAR[currDate.getMonth()]}, ${currDate.getFullYear()}`;

  //Setting the initialized flag
  calendarInitialzed = true;
}

function getDaysInMonth(month, year)
{
  /*Returns the number of days in the given month */

  return new Date(year,month+1,0).getDate();
}

function updateCalendar(year, month)
{
  /*Updates the calendar to display the given month*/

  const calendarDiv = document.getElementById("calendar_body"); //Getting the calendar division
  const cells = calendarDiv.getElementsByClassName("calendar_cell"); //Getting the cells in the calendar

  //Getting the month details
  const totalDays = getDaysInMonth(month, year); //The total days in the given month
  const firstDay = new Date(year, month, 1).getDay(); //Getting the 1st day of the month

  //Adding new cells if required
  if(cells.length < totalDays)
  {
    let html = ""; //The html for the new cells
    for(let day = cells.length; day < totalDays; ++day)
    {
      html = `<div class="calendar_cell"><p id="date">${day+1}</p>`;
      calendarDiv.insertAdjacentHTML("beforeend", html);
    }
  }
  else if(cells.length > totalDays)
  {
    //Removing existing cells if required
    for(let day = cells.length-1; day >= totalDays; --day)
    {
      cells[day].remove();
    }
  }

  //Updating the days headers
  for(let day = 0; day < 7; ++day)
  {
    cells[day].querySelector("#day").textContent = DAYS_OF_WEEK[(6+firstDay+day)%7];
  }

  //Updating the calendar header
  document.getElementById("calendar_title").textContent = `${MONTHS_OF_YEAR[month]}, ${year}`;
  
}

function switchToPrevMonth()
{
  /*Displays the previous month in the calendar*/

  //Updating the months and years
  currMonth = (currMonth == 0) ? 11 : currMonth - 1;
  currYear = (currMonth == 11) ? currYear - 1 : currYear;

  //Updating the calendar
  updateCalendar(currYear, currMonth);

}

function switchToNextMonth()
{
  /*Displays the next month in the calendar*/

  //Updating the month and year
  currMonth = (currMonth+1)%12;
  currYear = (currMonth == 0) ? currYear+1 : currYear;

  //Updating the calendar
  updateCalendar(currYear, currMonth);

}

function showSubjectDetails(clickedCard)
{
  /*Displays the subject details for the clicked card*/

  //Setting up the calendar
  if(!calendarInitialzed)
  {
    //Calendar has not been created
    initializeCalendar();
  }
  else
  {
    //Calendar has already been created
    const currDate = new Date();
    updateCalendar(currDate.getFullYear(), currDate.getMonth());
  }

  //Displaying the details area
  document.getElementById("subject_details_area").style.opacity = 1;

  //Saving the subject id
  currSubject = clickedCard.id;
}

function deleteSubject()
{
  /*Deletes the currently viewed subject*/

  const deletePromise = fetch(`/deleteSubject/${currSubject}`)

  deletePromise.then(() => window.location.href = "/").catch((err) => console.log(err));
}

/************************Setting Click Listeners********************/

//Setting click listener on logout button
document.getElementById("home_logout_btn").addEventListener("click", logoutClick);

//Setting click listeners for the subject cards
const subjectCards = document.querySelectorAll(".subject_card"); //Getting the subject cards
subjectCards.forEach((card) => card.addEventListener("click", (event) => showSubjectDetails(event.target))); //Setting the click listeners
