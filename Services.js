
/***********************Importing modules************************/
const NODEMAILER = require("nodemailer");
const FS = require("fs");

/***********************Global Variables************************/
const emailAuthDetails = {user:"", pass:""}; //Object for storing the credentials to the official email id

/***********************Initialization************************/

//Loading email creds
try
{
    const data = FS.readFileSync("OfficialEmailCreds.txt", "utf8");
    
    //Extracting the credentials
    const creds = data.split('\n');
    emailAuthDetails.user = data[0];
    emailAuthDetails.pass = data[1];
}
catch (err)
{
    console.log(err);
}

//Initializing nodemailer
const nodemailerTransporter = NODEMAILER.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: emailAuthDetails.user,
        pass: emailAuthDetails.pass
    },
    secure: true
}); //Creating a nodemailer transporter for sending emails

/***********************Functions************************/
function sendPasswordResetLink(targetEmail, resetLink)
{
    /*Sends the password reset link to the given email*/

    //Creating the mail data to be sent
    const mailData = {
        from: "gameologist281@gmail.com",
        to: targetEmail,
        subject: "Password Reset Link",
        text: `Click on the link to reset password: ${resetLink}`,
    };

    //Sending the email
    nodemailerTransporter.sendMail(mailData, (err, info) => {
        if(err)
            console.log(err);
        else
            console.log(info);
    })
}

/***********************Exports***********************/
module.exports.sendPasswordResetLink = sendPasswordResetLink