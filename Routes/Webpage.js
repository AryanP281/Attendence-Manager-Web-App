
/***********************Importing modules************************/
const EXPRESS = require("express");
const AUTH = require("../AuthManager");
const DB = require("../DbManager");

/***********************Initialization************************/
const router = EXPRESS.Router(); //Creating the router
const PASSWORD_MIN_LEN = 6;

/***********************Constants*************************/
const USER_ID_COOKIE_KEY = "email"; //The key of the cookie used for storing the logged users email

/*************************Helper Functions****************************/
function validEmail(email)
{
    /*Checks if email is of valid format*/
    
    const atSplit = email.split('@');
    
    return((atSplit.length === 2) && (atSplit[1].split('.').length === 2));
}

function checkEmailValidation(user, userExists, resp)
{
    console.log(userExists);
    //Email doesnt already exist
    if(!userExists)
    {
        //Adding the user creds to database
        AUTH.registerUser(user);

        //Redirecting to homepage with auth cookie
        resp.cookie("email", user.email).redirect("/");

    }
    else
    {
        resp.render("signup", {error:`User with email '${user.email}'already exists`});
    }
}

function checkUserCreds(result, user, resp)
{
    /*Checks if the entered credentials are valid and match*/

    //User account does not exist
    if(result.length == 0)
        return resp.render("login", {error:`User with email '${user.login_email}' not registered`});
    
    //Checking if the entered password matches
    if(AUTH.checkPasswords(user.login_pss, result[0].password))
        return resp.cookie("email", result[0].email).redirect("/");
    else
        return resp.render("login", {error:"Incorrect password"});

}

function handleNewSubject(subjectId,subject,userEmail,resp)
{
    /*Adds the new subject to database if it doesnt exist. Finally, subscribes the logged user to the subject*/

    console.log(subject);

    if(subjectId == -1)
    {
        //Generating the new subject's id
        DB.generateNewSubjectId().then((newID) => {
            //Adding the subject to database
            DB.addNewSubject({id:newID, name:subject.new_subject_name}).then(() =>{
                //Subscribing the user to the subject
                subscribeUser(userEmail, {id:newID,attended:parseInt(subject.new_subject_attended),total:parseInt(subject.new_subject_total),target:parseInt(subject.new_subject_target)},resp);

            }).catch((err) => console.log(err));

        }).catch((err) => console.log(err));
    }
    else
    {
        //Subscribing the user to the subject
        subscribeUser(userEmail, {id:subjectId,attended:parseInt(subject.new_subject_attended),total:parseInt(subject.new_subject_total),target:parseInt(subject.new_subject_target)},resp);
    }

}

function subscribeUser(userEmail, subject, resp)
{
    /*Subscribes the user to the given subject using db api*/

    //Checking if the user is already subscribed
    const alreadySubscribedPromise = DB.checkIfUserSubscribed(userEmail, subject.id);
    alreadySubscribedPromise.then((isSubs) => {
        if(isSubs)
            resp.redirect("/"); //Redirecting to home page as user is already subscribed to the subject
        else
        {
            //Subscribing the user to the subject
            const subscriptionPromise = DB.subscribeUserToSubject(userEmail,subject);
            subscriptionPromise.then(() => resp.redirect("/")).catch((err) => console.log(err));
        }
    }).catch((err) => console.log(err));

}

/*************************Routing****************************/
router.get("/", (req,resp) => {

    /*Home Page*/

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //The email of the logged user who has sent the request 
    
    //Checking if the user is logged in
    if(userEmail)
    {
        const promise = DB.getAllSubscribed(userEmail);
        promise.then((results) => {
            
            //Calculating the subject attendence parcentages
            for(let a = 0; a < results.length; ++a)
            {
                results[a].percentage = parseInt(results[a].attendedLecs * 100 / results[a].totalLecs);
            }

            //Sorting the results based on attendence percentage
            results.sort((subj1, subj2) => {
                return (subj1.percentage - subj1.target) - (subj2.percentage - subj2.target);
            });

            resp.render("home", {subjects:results})
        }).catch((err) => console.log(err));
        
    } 
    else
        resp.redirect("/login");

});

router.get("/register", (req,resp) => {

    /*Sign Up Page*/

    //Checking if user is already signed in
    if(req.cookies[`${USER_ID_COOKIE_KEY}`])
        resp.redirect("/");
    else
        resp.render("signup"); //Displaying the webpage

});

router.post("/register", (req, resp) => {

    /*Sign Up response*/

    const email = req.body.signup_email.trim(); //The provided email after trimming

    //Checking if email is of valid formart
    if(validEmail(email))
    {
        //Checking if password length is valid
        if(req.body.signup_pss.length >= 6)
        {
            //Checking if the email already exists
            const dbPromise = AUTH.userExists(email);
            dbPromise.then((userExists) => checkEmailValidation({email:email,password:req.body.signup_pss},userExists,resp)).catch((err) => console.log(err));
        }
        else
            return resp.render("signup", {error:"Password length should atleast be 6"});
    }
    else
        return resp.render("signup", {error:"Invalid Email Format"});
});

router.get("/login", (req,resp) => {

    /*Login Page*/
    
    if(req.cookies[`${USER_ID_COOKIE_KEY}`])
        return resp.redirect("/"); //Redirecting to home page as user is already logged in
    else
        return resp.render("login");

});

router.post("/login", (req,resp) => {
    
    /*Login response*/

    //Processing the input
    const user = req.body;
    user.login_email.trim();

    //Authenticating the user
    const dbPromise = AUTH.getUserCreds(user);
    dbPromise.then((result) => checkUserCreds(result, user, resp)).catch((err) => console.log(err));

});

router.get("/logout", (req, resp) =>{
    
    /*Logs the user out*/

    //Sending the user to login page if not already logged in
    if(!req.cookies[`${USER_ID_COOKIE_KEY}`])
        return resp.redirect("/login");
    
    //Deleting the user auth cookie
    resp.clearCookie("email");

    //Redirecting to login page
    resp.redirect("/");
});

router.post("/newSubject", (req,resp) => {

    /*Subscribes the user to a new subject*/

    //Checking if the subject already exists in the database
    const subjectSearchPromise = DB.getSubjectId(req.body.new_subject_name); //Getting id (if already exists) of the subject
    subjectSearchPromise.then((subjectId) => handleNewSubject(subjectId,req.body,req.cookies[`${USER_ID_COOKIE_KEY}`],resp))
        .catch((err) => console.log(err));

});

router.post("/present/:id", (req, resp) => {
    
    /*Increases the attendence of the given subject for the user*/

    const subjectAttendencePromise = DB.markPresent(req.cookies[`${USER_ID_COOKIE_KEY}`], req.params.id);

    subjectAttendencePromise.then(() => resp.redirect("/")).catch((err) => console.log(err));

});

router.post("/absent/:id", (req, resp) => {
    
    /*Decreases the attendence of the given subject for the user*/

    const subjectAttendencePromise = DB.markAbsent(req.cookies[`${USER_ID_COOKIE_KEY}`], req.params.id);

    subjectAttendencePromise.then(() => resp.redirect("/")).catch((err) => console.log(err));
});

router.get("/deleteSubject/:id", (req, resp) => {
    /*Unsubscribes the user from given subject*/

    
})

/***********************Exports*************************/
module.exports = router;