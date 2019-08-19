"use strict";
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////UTILS/////////////////////////Victor Rodniansky///////18/08/2019///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const MongoClient = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb'); // or ObjectID 
const fs = require('fs');
const shell = require('shelljs');
const copydir = require('copy-dir');
const yargs = require('yargs');
const chalk = require('chalk');
const pass = "1";
const userName = "server";
const dbName = "HG_Tofes";
const prodHost = "10.20.100.71";
const StageHost = "10.20.100.72";
const localHost = "localhost";
const matnasHost= "10.20.100.74";
//Command line (CLI)
console.log("\n---------------HG_T_UTILS---------------------------------");
const argv = yargs
    .option('findDbl', {
        alias: 'f',
        description: 'finds double users in different companies and copies attachments',
    })
    .option('showDbl', {
        alias: 'sh',
        description: 'counts double users in different companies',
    })
    .option('prod', {
        alias: 'p',
        description: 'production mode',
    })
    .option('stage', {
        alias: 'stg',
        description: 'preprod mode',
    })
    .option('matnas', {
        alias: 'mtn',
        description: 'matnas mode',
    })
    .help()
    .alias('help', 'h')
    .argv;
///Chooses DB host///////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
let choseHost = ()=>{
    let host = localHost;
    if (argv.prod) {
        host = prodHost;
    }
    if (argv.stage) {
        host = StageHost;
    }
    if (argv.matnas) {
        host = matnasHost;
    }
    return host;
}
/////////////////////////////////////////////////////////
//connect to HG_Tofes and main BL Main function
/////////////////////////////////////////////////////////
(() =>{
    let host = choseHost();
    MongoClient.connect(`mongodb://${userName}:${pass}@${host}:27017/${dbName}`, 
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true 
    }, 
    async (err, db) => { 
        if(err){
            console.log(err);
        }else{
            if(db){
                let database = db.db('HG_Tofes');
                console.log(chalk.green("connected"));
                if (argv.findDbl) {
                    await copyUserAttachments(db);
                    console.log(chalk.green("attachments were coppied."));
                    console.log(chalk.bold.green("dicsonnecting....\n"));
                    process.exit();
                } 
                if (argv.showDbl) {
                    let result = await findDoubleUsers(database);
                    if(result && result.length > 0){
                        logInfoDouble(result);
                    }
                    console.log(chalk.bold.green("dicsonnecting....\n"));
                    process.exit();
                }
            }else{
                console.log("no db");
            }
        }        
    });
})();
///////////////////////////////////////////////////////////////////////////////////
//Main business for finding double users and copying their attachments when needed
//////////////////////////////////////////////////////////////////////////////////
let copyUserAttachments = async (db)=>{
    let database = db.db('HG_Tofes');
    //get double users , same userName different companies
    let result = await findDoubleUsers(database);
    if(result && result.length > 0){
        let userNameArray = result.map(u=>u._id);
        logInfoDouble(result,userNameArray);
        for (let i = 0; i <= userNameArray.length - 1; i++){
            let objPath = [];   
            let users = await database.collection('users').find({userName:userNameArray[i]}).toArray();
            let uLength = users.length - 1;
            for(let j = 0; j <= uLength ; j++){
                let hNumberId = users[j].employeeData.hpNumberId ? users[j].employeeData.hpNumberId : users[j].employeeData.hpnumberId;
                let path = `../${userNameArray[i]}/${users[j]._id}/${users[j].employeeData.tikNikuimId}/${hNumberId}`
                let company = await database.collection('company').findOne({'_id':ObjectId(users[j].employeeData.companyId)}); 
                path += `/${company.name}`;
                console.log(chalk.blue(path));       
                objPath.push(path.replace(/[|&;$%@"<>()+,]/g, "")); 
                //TO DO if needed for more than 2 
                if(uLength === j){
                    if (!fs.existsSync(objPath[0])){                   
                        shell.mkdir('-p', objPath[0]); 
                        if(fs.existsSync(objPath[1])){
                            coppyDir(objPath[1],objPath[0]);
                        }     
                    }else{
                        if (!fs.existsSync(objPath[1])){     
                            shell.mkdir('-p', objPath[1]); 
                            if(fs.existsSync(objPath[0])){
                                coppyDir(objPath[0],objPath[1]);
                            }    
                        }
                    }
                }
            }
        }
    }else{
        console.log("there is no double users!")
    }
}
//////////////////////////////////////////////////////////////////////////////////////////
//Find users with the same userName that exists in other company , for now only two times
/////////////////////////////////////////////////////////////////////////////////////////
let findDoubleUsers = async (database)=>{
    return  await database.collection('users').aggregate(
        {"$group" : { "_id": "$userName", "count": { "$sum": 1 } } },
        {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } }, 
        {"$project": {"userName" : "$_id", "_id" : 0} }
    ).toArray();
}
//////////////////////////////////////////////////////////////////////////////////////////
//copy function//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
let coppyDir = (source,dist)=>{
    copydir.sync(source, dist, {
        utimes: true,  // keep add time and modify time
        mode: true,    // keep file mode
        cover: true    // cover file when exists, default is true
    });        
}
//////////////////////////////////////////////////////////////////////////////////////////
///Log info//////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
let logInfoDouble = (result,userNameArray = undefined)=>{
    console.log(chalk.cyan(`there are ${result.length} double users`));
    if(!userNameArray){
        userNameArray = result.map(u=>u._id);
    }
    console.log(chalk.yellow("array of double usernames:"),userNameArray);
}
//////////////////////////////////////////////////////////////////////////////////////////

///////////////////-----------------------/////////////////////////////////////////////////



