
/***********************Importing modules***********************/
const APP = require("./app.js");
const BCRYPT = require("bcryptjs");

/***********************Variables***********************/
const HASH_SALT = 10; //The salt used for hashing passwords

/***********************Functions***********************/
function registerUserCreds(user)
{
    /*Hashes and adds user credentials to database*/
    
    //Generating the hashed password
    const hashedPassword = BCRYPT.hashSync(user.password, HASH_SALT);
    
    //Adding the data to database
    const sql = `INSERT INTO UserCreds VALUES ('${user.email}', '${hashedPassword}');`;
    APP.dbConn.query(sql, (error) => {
        if(error)
        {
            console.log(error);
        }
        else
            console.log("User Creds added to database");
    })
}

function userExists(email)
{
    /*Checks if given email already exists in database*/

    const sqlQuery = `SELECT * FROM UserCreds WHERE email='${email}';`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error, result, fields) => {
            if(error)
                reject(error);
            else
            {
                resolve(result.length != 0);
            }
        })
    })
}

function getUserCreds(user)
{
    /*Checks if the given user email exists in the database and if the passwords match*/

    const sqlQuery = `SELECT * FROM UserCreds WHERE email='${user.login_email}'`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error, result, fields) => {
            if(error)
                reject(error);
            else
                resolve(result);
        })
    })
}

function checkPasswords(nonHashedPss, hashedPss)
{
    /*Checks if the non-hashed password matches with the hashed password*/
    
    return BCRYPT.compareSync(nonHashedPss, hashedPss);
}

/***********************Exports***********************/
module.exports.registerUser = registerUserCreds;
module.exports.userExists = userExists;
module.exports.getUserCreds = getUserCreds;
module.exports.checkPasswords = checkPasswords; 