
/***********************Importing modules***********************/
const APP = require("./app");

/***********************Constants***********************/
const SUBJECT_TABLE = "Subject";
const SUBJECT_TABLE_PK = "id";

const USER_SUBJECT_REL_TABLE = "Takes";
const USER_SUBJECT_REL_PK = ["email", "subjectId"];
const USER_SUBJECT_REL_FIELDS = ["totalLecs", "attendedLecs", "target"];

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
    })
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
    })
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
    })
}

function checkIfUserSubscribed(userEmail, subjectId)
{
    /*Checks if the user is subscribed to the given subject*/

    const sqlQuery = `SELECT COUNT(*) FROM ${USER_SUBJECT_REL_TABLE} WHERE ${USER_SUBJECT_REL_PK[0]}='userEmail' AND 
    ${USER_SUBJECT_REL_PK[0]}=subjectId`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error,results,fields) => {
            if(error)
                reject(error);
            else
                resolve(results[0]["COUNT(*)"] != 0);
        })
    })
}

function subscribeUserToSubject(userEmail,subject)
{
    /*Subscribes the user to the given subject*/

    const sqlQuery = `INSERT INTO ${USER_SUBJECT_REL_TABLE} VALUES ('${userEmail}',${subject.id},${subject.total},${subject.attended},${subject.target})`;

    return new Promise((resolve,reject) => {
        APP.dbConn.query(sqlQuery, (error) => {
            if(error)
                reject(error);
            else
                resolve();
        })
    })
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
    })
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
    })
}

function unsubscribeUser(userEmail, subjectId)
{
    /*Unsubscribes the user from the given subject*/

    
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