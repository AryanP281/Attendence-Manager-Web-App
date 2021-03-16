
/***********************Importing modules***********************/
const APP = require("./app");

/***********************Constants***********************/
const SUBJECT_TABLE = "Subject";
const SUBJECT_TABLE_PK = "id";

const USER_SUBJECT_REL_TABLE = "Takes";
const USER_SUBJECT_REL_PK = ["email", "subjectId"];
const USER_SUBJECT_REL_FIELDS = ["totalLecs", "attendedLecs", "target"];

const LOGS_TABLE = "Logs";
const LOGS_TABLE_PK = ["email","subjectId","timestamp"];

const PSS_RESET_TABLE = "PasswordResetTokens";
const PSS_RESET_TABLE_PK = "email";

const PRESENT_LOG_FLAG = '0';
const ABSENT_LOG_FLAG = '1';

/***********************Helper Functions***********************/
function getTimestamp()
{
    /*Generates and returns a string timestamp for saving in the database*/

    const currDate = new Date(); //The current date

    //Getting the date components
    const dateComps = currDate.toString().split(' ');

    //Generating the timestamp
    const timestamp = `${currDate.getFullYear()}-${(currDate.getMonth()+1) < 10 ? '0' : ''}${currDate.getMonth()+1}-${(currDate.getDate()) < 10 ? '0' : ''}${currDate.getDate()} ${dateComps[4]}`;

    return timestamp;
}


/***********************Functions***********************/

function getSubjectId(subjectName)
{
    /*Finds the subject with the given name. Returns the subject id to resolve if it exists else returns -1 */

    const sqlQuery = `SELECT ${SUBJECT_TABLE_PK} FROM ${SUBJECT_TABLE} WHERE name='${subjectName}'`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error,result,fields) => {
            if(error)
                reject(error);
            else
            {
                if(result.length == 0)
                    resolve(-1); //Subject doesnt exist
                else
                    resolve(result[0][`${SUBJECT_TABLE_PK}`]); //The subject exists
            }
        })
    });
}

function generateNewSubjectId()
{
    /*Queries the database for the number of elements and returns as promise*/

    const sqlQuery = `SELECT COUNT(${SUBJECT_TABLE_PK}) FROM ${SUBJECT_TABLE}`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error,result,fields) => {
            if(error)
                reject(error);
            else
                resolve(result[0][`COUNT(${SUBJECT_TABLE_PK})`]);
        })
    });
}

function addNewSubject(subject)
{
    /*Adds the subject with the given name to the database*/

    const sqlQuery = `INSERT INTO ${SUBJECT_TABLE} VALUES (${subject.id}, '${subject.name}')`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function checkIfUserSubscribed(userEmail, subjectId)
{
    /*Checks if the user is subscribed to the given subject*/

    const sqlQuery = `SELECT COUNT(*) FROM ${USER_SUBJECT_REL_TABLE} WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND 
    ${USER_SUBJECT_REL_PK[0]}=${subjectId}`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error,results,fields) => {
            if(error)
                reject(error);
            else
                resolve(results[0]["COUNT(*)"] != 0);
        })
    });
}

function subscribeUserToSubject(userEmail,subject)
{
    /*Subscribes the user to the given subject*/

    const sqlQuery = `INSERT INTO ${USER_SUBJECT_REL_TABLE} VALUES ('${userEmail}',${subject.id},${subject.total},${subject.attended},${subject.target}, NULL)`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function getAllSubscribed(userEmail)
{
    /*Returns a promise for retrieving all the subjects subscribed to by the user*/

    "SELECT * FROM Takes,Subject WHERE Subject.id=Takes.id AND"

    const sqlQuery = `SELECT * FROM ${USER_SUBJECT_REL_TABLE},${SUBJECT_TABLE} WHERE 
    ${USER_SUBJECT_REL_TABLE}.${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${SUBJECT_TABLE_PK}=${USER_SUBJECT_REL_TABLE}.${USER_SUBJECT_REL_PK[1]}`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error,result,fields) => {
            if(error)
                reject(error);
            else
                resolve(result); //Returning the subscribed subjects
        })
    });
}

function markPresent(userEmail, subjectId)
{
    /*Increases the attendence of the given subject for the given user*/

    const sqlQuery = `UPDATE ${USER_SUBJECT_REL_TABLE} SET ${USER_SUBJECT_REL_FIELDS[0]}=${USER_SUBJECT_REL_FIELDS[0]}+1, ${USER_SUBJECT_REL_FIELDS[1]}=${USER_SUBJECT_REL_FIELDS[1]}+1 WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId};`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function markAbsent(userEmail, subjectId)
{
    /*Decreases the attendence of the given subject for the given user*/

    const sqlQuery = `UPDATE ${USER_SUBJECT_REL_TABLE} SET ${USER_SUBJECT_REL_FIELDS[0]}=${USER_SUBJECT_REL_FIELDS[0]}+1 WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId};`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function unsubscribeUser(userEmail, subjectId)
{
    /*Unsubscribes the user from the given subject*/

    const sqlQuery = `DELETE FROM ${USER_SUBJECT_REL_TABLE} WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function getSubjectSubscriptionsCount(subjectId)
{
    /*Gets the number of users subscribed to the given suject*/

    const sqlQuery = `SELECT COUNT(*) FROM ${USER_SUBJECT_REL_TABLE} WHERE ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error, results, fields) => {
            if(error)
                reject(error);
            else
                resolve(results[0]["COUNT(*)"]);
        })
    });
}

function deleteSubject(subjectId)
{
    /*Deletes the given subject from the database*/

    const sqlQuery = `DELETE FROM ${SUBJECT_TABLE} WHERE ${SUBJECT_TABLE_PK}=${subjectId}`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    });
}

function saveLog(userEmail, subjectId, flag)
{
    /*Saves the given log in the database*/
    
    //Getting the timestamp for the log
    const timestamp = getTimestamp();
    
    const sqlQuery = `INSERT INTO ${LOGS_TABLE} VALUES ('${userEmail}', ${subjectId}, '${flag}', '${timestamp}')`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error, result) => {
            if(error)
                reject(error);
            else
                resolve(timestamp);
        })
    });
}

function updateSubjectLastTimestamp(userEmail, subjectId, timestamp)
{
    /*Updates the last log timestamp corresponding for the given subject for the given user*/

    const sqlQuery = `UPDATE ${USER_SUBJECT_REL_TABLE} SET lastTimestamp='${timestamp}' WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (err) => {
            if(err)
                reject(err);
            else
                resolve();
        })
    });
}

function getMonthsLogs(userEmail,subjectId,date)
{
    /*Gets the user's logs for the subject in the given month*/

    const sqlQuery = `SELECT * FROM ${LOGS_TABLE} WHERE ${LOGS_TABLE_PK[0]}='${userEmail}' AND ${LOGS_TABLE_PK[1]}=${subjectId} AND YEAR(${LOGS_TABLE_PK[2]})='${date.year}' AND MONTH(${LOGS_TABLE_PK[2]})='${date.month}'`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error,result,fields) => {
            if(error)
                reject(error);
            else
                resolve(result);
        })
    });
}

function savePasswordResetToken(token,userEmail)
{
    /*Saves the password reset token and the corresponding email in the db*/

    const sqlQuery = `INSERT INTO ${PSS_RESET_TABLE} VALUES('${userEmail}', '${token}')`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (err) => {
            if(err)
                reject(err);
            else
                resolve();
        })
    });
}

function getPasswordResetToken(userEmail)
{
    /*Returns the password reset token saved for the given email*/

    const sqlQuery = `SELECT * FROM ${PSS_RESET_TABLE} WHERE ${PSS_RESET_TABLE_PK}='${userEmail}'`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (err,result) => {
            if(err)
                reject(err);
            else
            {
                if(result.length == 0)
                    resolve(null);
                else
                    resolve(result[0]["token"]);
            }
        })
    });
}

function updatePasswordResetToken(userEmail, newToken)
{
    /*Changes the password reset token*/

    const sqlQuery = `UPDATE ${PSS_RESET_TABLE} SET token='${newToken}' WHERE ${PSS_RESET_TABLE_PK}='${userEmail}'`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (err) => {
            if(err)
                reject(err);
            else
                resolve();
        })
    });
}

function getLatestTimestamp(userEmail, subjectId)
{
    /*Returns the timestamp of the last action performed by the user for the given subject*/

    const sqlQuery = `SELECT lastTimestamp FROM ${USER_SUBJECT_REL_TABLE} WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (error,result) => {
            if(error)
                reject(error);
            else
                resolve(result[0].lastTimestamp);
        })
    });
}

function getLog(userEmail, subjectId, timestamp)
{
    /*Returns the given log from database*/

    const sqlQuery = `SELECT * FROM ${LOGS_TABLE} WHERE ${LOGS_TABLE_PK[0]}='${userEmail}' AND ${LOGS_TABLE_PK[1]}=${subjectId} AND ${LOGS_TABLE_PK[2]}='${timestamp}'`;

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (err,result) => {
            if(err)
                reject(err);
            else
                resolve(result[0]);
        })
    });
}

function removeLog(userEmail, subjectId, timestamp)
{
    /*Removes the given log form the database*/

    const sqlQuery = `DELETE FROM ${LOGS_TABLE} WHERE ${LOGS_TABLE_PK[0]}='${userEmail}' AND ${LOGS_TABLE_PK[1]}=${subjectId} AND ${LOGS_TABLE_PK[2]}='${timestamp}'`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (err) => {
            if(err)
                reject(err);
            else
                resolve();
        })
    });
}

function clearLastTimestamp(userEmail, subjectId, flag)
{
    /*Clears the last timestamp and its effects for the given user and subject*/

    let sqlQuery;
    if(flag == ABSENT_LOG_FLAG)
    {
        sqlQuery = `UPDATE ${USER_SUBJECT_REL_TABLE} SET lastTimestamp=NULL, ${USER_SUBJECT_REL_FIELDS[0]}=${USER_SUBJECT_REL_FIELDS[0]}-1 WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;
    }
    else
    {
        sqlQuery = `UPDATE ${USER_SUBJECT_REL_TABLE} SET lastTimestamp=NULL, ${USER_SUBJECT_REL_FIELDS[0]}=${USER_SUBJECT_REL_FIELDS[0]}-1,${USER_SUBJECT_REL_FIELDS[1]}=${USER_SUBJECT_REL_FIELDS[1]}-1 WHERE ${USER_SUBJECT_REL_PK[0]}='${userEmail}' AND ${USER_SUBJECT_REL_PK[1]}=${subjectId}`;
    }

    return new Promise((resolve, reject) => {
        APP.dbConn.query(sqlQuery, (err) => {
            if(err)
                reject(err);
            else
                resolve();
        });
    });
}

/***********************Exports***********************/
module.exports.getSubjectId = getSubjectId;
module.exports.generateNewSubjectId = generateNewSubjectId;
module.exports.addNewSubject = addNewSubject;
module.exports.checkIfUserSubscribed = checkIfUserSubscribed;
module.exports.subscribeUserToSubject = subscribeUserToSubject;
module.exports.getAllSubscribed = getAllSubscribed;
module.exports.markPresent = markPresent;
module.exports.markAbsent = markAbsent;
module.exports.unsubscribeUser = unsubscribeUser;
module.exports.getSubjectSubscriptionsCount = getSubjectSubscriptionsCount
module.exports.deleteSubject = deleteSubject;
module.exports.saveLog = saveLog;
module.exports.updateSubjectLastTimestamp = updateSubjectLastTimestamp;
module.exports.getMonthsLogs = getMonthsLogs;
module.exports.savePasswordResetToken = savePasswordResetToken;
module.exports.getPasswordResetToken = getPasswordResetToken;
module.exports.updatePasswordResetToken = updatePasswordResetToken;
module.exports.getLatestTimestamp = getLatestTimestamp;
module.exports.getLog = getLog;
module.exports.removeLog = removeLog;
module.exports.clearLastTimestamp = clearLastTimestamp;
module.exports.ABSENT_LOG_FLAG = ABSENT_LOG_FLAG;
module.exports.PRESENT_LOG_FLAG = PRESENT_LOG_FLAG;
