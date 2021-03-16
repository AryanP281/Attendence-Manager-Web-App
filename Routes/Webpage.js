
/***********************Importing modules************************/
const EXPRESS = require("express");
const AUTH = require("../AuthManager");
const DB = require("../DbManager");
const SERVICES = require("../Services");
const CRYPTO = require("crypto");
const { time } = require("console");

/***********************Initialization************************/
const router = EXPRESS.Router(); //Creating the router

/***********************Constants*************************/
const PASSWORD_MIN_LEN = 6;
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

function generateMonthLogsObj(logs)
{
    /*Creates and returns an object with the given month logs*/

    const map = new Map(); //Map for storing the day wise logs

    //Initializing the map
    for(let a = 1; a <= 31; ++a)
    {
        map.set(a,[0,0]); //Initializng the day's logs to 0 presents and 0 absents
    }

    logs.forEach((log) => {
        const date = log["timestamp"].getDate(); //Getting the logs date
        map.get(date)[parseInt(log["flag"])]++;
    });

    //Returning the logs object
    return Object.fromEntries(map);
}

function handlePasswordReset(userEmail, req, resp)
{
    /*Handles password reset requests*/

    let passwordResetToken = ""; //The password reset token

    //Checking if user account exists
    const userExistenceCheckPromise = AUTH.userExists(userEmail);
    userExistenceCheckPromise.then((userExists) => {
        if(!userExists)
            resp.render("forgotPassword", {error:"Entered email is not registered"}); //Displaying page with error message as user does not exist
        
        //Generating new token
        return generateRandomToken(256);
    })
    .then((newToken) => {
        passwordResetToken = newToken;
        
        //Checking if token already exists and needs to be generated
        return DB.getPasswordResetToken(userEmail);
    })
    .then((oldToken) => {
        //Token does not exist
        if(oldToken == null)
            return DB.savePasswordResetToken(passwordResetToken, userEmail); //Adding the new token
        else //Token already exists
            return DB.updatePasswordResetToken(userEmail, passwordResetToken); //Updating the token
    })
    .then(() => {
        
        const passwordResetLink = `${req.baseUrl}/passwordreset/${passwordResetToken}`; //The password reset link to be sent by email
        
        //Sending the user password reset email
        SERVICES.sendPasswordResetLink(userEmail, passwordResetLink)

        //Redirecting the user to the confirmation page
        resp.render("passwordSentConfirmation");
    })
    .catch((err) => console.log(err));

}

function generateRandomToken(size)
{
    /*Uses crypto module to generate a token of given size*/
    
    return new Promise((resolve, reject) => {
        CRYPTO.randomBytes(size, (err,buffer) => {
            if(err)
                reject(err);
            
            //Generating a token from the random bytes
            const token = CRYPTO.createHash("sha1").update(buffer).digest("hex");
            resolve(token);
        })
    });
}

function addLog(userEmail, subjectId, flag, resp)
{
    /*Adds the given log to the database*/

    const logPromise = DB.saveLog(userEmail, subjectId, flag);
    logPromise.then((timestamp) => DB.updateSubjectLastTimestamp(userEmail, subjectId, timestamp))
    .then(() => resp.redirect("/"))
    .catch((err) => console.log(err));
}

function undoLastAction(userEmail, subjectId, resp)
{
    /*Undoes the last action performed by the user for the given subject*/

    let actionType; //The type of the last performed action
    let lastTimestamp; //The timestamp at which the action to be undone was performed

    const timestampPromise = DB.getLatestTimestamp(userEmail, subjectId);
    timestampPromise.then((timestamp) => {
        if(timestamp === null)
        {
            resp.sendStatus(200);

            //Breaking the promise chain
            return Promise.reject("Break chain")
        }
        else
        {    
            //Converting the retrieved timestamp date object to the proper format
            const timestampComps = timestamp.toString().split(' ');
            lastTimestamp = `${timestamp.getFullYear()}-${(timestamp.getMonth()+1) < 10 ? '0' : ''}${timestamp.getMonth()+1}-${(timestamp.getDate()) < 10 ? '0' : ''}${timestamp.getDate()} ${timestampComps[4]}`;

            //Getting the log to determine the type of action performed so as to revert its effects
            return DB.getLog(userEmail, subjectId, lastTimestamp);
        }
    })
    .then((log) => {
        actionType = log.flag;

        //Removing the log
        return DB.removeLog(userEmail,subjectId,lastTimestamp);
    })
    .then(() => DB.clearLastTimestamp(userEmail,subjectId,actionType))
    .then(() => resp.sendStatus(200))
    .catch((err) => console.log(err));
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
        if(req.body.signup_pss.length >= PASSWORD_MIN_LEN)
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

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //Getting the user's email

    if(userEmail)
    {
        const presentMarkingPromise = DB.markPresent(userEmail, req.params.id);
        presentMarkingPromise.then(() => addLog(userEmail, req.params.id, DB.PRESENT_LOG_FLAG, resp))
        .catch((err) => console.log(err));
    }

});

router.post("/absent/:id", (req, resp) => {
    
    /*Decreases the attendence of the given subject for the user*/

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //Getting the user's email

    if(userEmail)
    {
        const absentMarkingPromise = DB.markAbsent(userEmail, req.params.id);
        absentMarkingPromise.then(() => addLog(userEmail, req.params.id, DB.ABSENT_LOG_FLAG, resp))
        .catch((err) => console.log(err));
    }
});

router.get("/deleteSubject/:id", (req, resp) => {
    /*Unsubscribes the user from given subject*/

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //Getting the user's email
    if(userEmail)
    {
        const unsubscribePromise = DB.unsubscribeUser(userEmail, req.params.id);

        unsubscribePromise.then(() => {
            //Getting the number of subscriptions to the subject
            resp.sendStatus(200);
            return DB.getSubjectSubscriptionsCount(req.params.id);
        })
        .then((count) => {
            if(count == 0)
                return DB.deleteSubject(req.params.id);
        })
        .catch((err) => console.log(err));
    }
    else
        resp.redirect("/login");

})

router.get("/logs/:subject/:year/:month", (req,resp) => {

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //Getting the user's email
    if(userEmail)
    {
        const subjectId = req.params.subject;
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);

        const logsPromise = DB.getMonthsLogs(userEmail,subjectId,{year:year,month:month});
        logsPromise.then((result) => {
            //Creating an object containing the logs
            const obj = generateMonthLogsObj(result);
            
            resp.json(obj); //Sending the json object as response
            
        }).catch((err) => console.log(err));
    }
    else
        resp.redirect("/login");
})

router.get("/forgotpassword", (req, resp) => {
    /*Displays the forgot password page*/

    //Redirecting the user to home page as he is already logged in
    if(req.cookies[`${USER_ID_COOKIE_KEY}`])
        resp.redirect("/");
    
    resp.render("forgotPassword");
})

router.post("/forgotpassword", (req,resp) => {
    
    /*Handles forgot password request*/

    //Redirecting the user to home page as he is already logged in
    if(req.cookies[`${USER_ID_COOKIE_KEY}`])
        resp.redirect("/");

    //Checking if the given email account is registered
    const email = req.body.user_email;
    handlePasswordReset(email, req, resp);

})

router.get(("/undo/:id"), (req, resp) => {

    /*Undoes the last action performed for the given subject */

    const userEmail = req.cookies[`${USER_ID_COOKIE_KEY}`]; //Getting the user's email
    if(userEmail)
    {
        const subjectId = req.params.id; //The id of the subject

        undoLastAction(userEmail, subjectId,resp);
    }
});

/***********************Exports*************************/
module.exports = router;


