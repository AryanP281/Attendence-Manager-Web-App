
/***********************Importing modules***********************/
const EXPRESS = require("express");
const EXPHBS = require("express-handlebars");
const PATH = require("path");
const MYSQL = require("mysql");
const COOKIE = require("cookie-parser");

/***********************Constants********************************/
const SERVER_PORT = process.env.PORT || 5000; //The port the server listens on

/************************Express Initialization*******************/
const app = EXPRESS(); //Creating the express app

/************************MiddleWare**************************** */

//Initializing request body parser
app.use(EXPRESS.json());
app.use(EXPRESS.urlencoded({extended:false}));

//Initializing Handlebars
app.engine("handlebars", EXPHBS({defaultLayout:"main"}));
app.set("view engine", "handlebars");

//Setting static folder
app.use(EXPRESS.static(PATH.join(__dirname, "Public")));

//Initializing Cookie parser [IMP. NEEDS TO BE INITIALIZED BEFORE Router]
app.use(COOKIE());

//Setting routes
app.use("/",require("./Routes/Webpage"));

/*************************Script******************************/
app.listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`)); //Starting the server

//Initializing MySql
const dbConnection = MYSQL.createConnection({host:"localhost", user:"nodeuser",password:"MQL_nd_210132",database:"AttendenceManager"}); //Creating a connection to MySql
dbConnection.connect((error) => {
    if(error)
        throw error;
    console.log("Connected to MySql");
}); //Connecting to MySql

/***********************Exports***********************/
module.exports.dbConn = dbConnection;