"use strict";
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////UTILS/////////////////////////Victor Rodniansky///////18/08/2019///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const MongoClient = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb'); // or ObjectID 
const XLSX = require('xlsx');
const fs = require('fs');
const shell = require('shelljs');
const copydir = require('copy-dir');
const yargs = require('yargs');
const chalk = require('chalk');
const _ = require('lodash');
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
    }).option('showdmgchld', {
        alias: 'shD',
        description: 'show damaged itemRows (children)',
    }).option('fixdmgchld', {
        alias: 'fDch',
        description: 'fix damaged itemRows (children)',
    }).option('showCity', {
        alias: 'shC',
        description: 'show cities',
    }).option('fixCity', {
        alias: 'tr',
        description: 'Trims cities which are written with space',
    }).option('distinctCities', {
        alias: 'dc',
        description: 'find problematic cities',
    }).option('chngeToCode', {
        alias: 'cht',
        description: 'change users text to code',
    }).option('fixTextForms', {
        alias: 'ffx',
        description: 'fix text in forms',
    }).option('fixCodeForms', {
        alias: 'fxfc',
        description: 'fix code in forms',
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
let fixUsers = async (database)=>{
    let users = await database.collection('users').find({}).toArray();
    let cities = await database.collection('cities').find({}).toArray();
    for (let i = 0; i < users.length; i++) {
        if(users[i].employeeData && users[i].employeeData.addressData && users[i].employeeData.addressData.city){
            let cityObj = cities.find(c=>c.cityName == users[i].employeeData.addressData.city);
            if(cityObj){
                await database.collection('users').updateOne({_id:users[i]._id}, {$set: {'employeeData.addressData.city':cityObj.cityCode }});
                console.log(`${users[i].userName} updated with city code ${cityObj.cityCode}`);
            }
        }
    }
    console.log("DONE");
}
let fixTextForms = async (database)=>{
    let forms = await database.collection('forms').find({}).toArray();
    console.log(forms.length);
    for (let i = 0; i < forms.length; i++) {
        if(forms[i].formData){
            let formDataObj = JSON.parse(forms[i].formData);
            console.log(forms[i].formData.city)
            if(!formDataObj || !formDataObj.city){
                continue;
            }
            let trimedVal = formDataObj.city.trim();
            switch(trimedVal) {
                case "פתח תקוה":
                    trimedVal = "פתח תקווה";
                  break;
                case "תל אביב":
                case "תל אביב-יפ":
                    trimedVal = "תל אביב-יפו";  
                  break;
                  case "מודיעין עילי":
                    trimedVal = "מודיעין עילית";  
                  break;
                  case "קרית אונו":
                    trimedVal = "קריית אונו";  
                  break;
                  case "קרית ביאליק":
                    trimedVal = "קריית ביאליק";  
                  break;
                  case "קרית גת":
                    trimedVal = "קריית גת";  
                  break;
                  case "הרצלייה":
                    trimedVal = "הרצליה";  
                  break;
                  case 'פ"ת':
                        trimedVal = "פתח תקווה";  
                  break;
                  case "אום אל-פחם":
                        trimedVal = "אום אל פחם";  
                  break;
                  case "נהרייה":
                        trimedVal = "נהריה";  
                  break;
                  case "פרדס חנה":
                        trimedVal = "פרדס חנה-כרכור";  
                  break;
                  case 'ראשל"צ':
                  case 'ראשון לציו':
                        trimedVal = "ראשון לציון";  
                  break;
                  case "גני תקוה":
                        trimedVal = "גני תקווה";  
                  break;
                  case "קרית מוצקין":
                        trimedVal = "קריית מוצקין";  
                  break;
                  case "קרית מלאכי":
                        trimedVal = "קריית מלאכי";  
                  break;
                  case "קרית אתא":
                        trimedVal = "קריית אתא";  
                  break;
                  case "קרית ים":
                        trimedVal = "קריית ים";  
                  break;
                  case "מודעין עילית":
                        trimedVal = "מודיעין עילית";  
                  break;
                  case 'ב"ב':
                        trimedVal = "בני ברק";  
                  break;
                  case 'דיר אל אסד':
                        trimedVal = "דיר אל-אסד";  
                  break;
                  case "מודעין עילית":
                        trimedVal = "מודיעין עילית";  
                  break;
                  case 'בת-ים':
                        trimedVal = "בת ים";  
                  break;
                default:         
                  // code block
              }
              console.log(`${forms[i]._id} text fixed`);
              formDataObj.city = trimedVal;
              await database.collection('forms').updateOne({_id:forms[i]._id}, {$set: {'formData':JSON.stringify(formDataObj)}});
        }
    }
    console.log(`Done`);
}
let fixFormsCodes = async (database)=>{
    let forms = await database.collection('forms').find({}).toArray();
    let cities = await database.collection('cities').find({}).toArray();
    for (let i = 0; i < forms.length; i++) {
        let formDataObj = JSON.parse(forms[i].formData);
        if(formDataObj && formDataObj.city){
            let cityObj = cities.find(c=>c.cityCode == formDataObj.city);
            if(cityObj){
                formDataObj.city = cityObj.cityCode;
                formDataObj.cityText = cityObj.cityName;
                await database.collection('forms').updateOne({_id:forms[i]._id}, {$set: {'formData':JSON.stringify(formDataObj)}});
                console.log(`${forms[i]._id} updated with city code ${cityObj.cityCode}`);
            }
        }
    }
    console.log("DONE");
}
/////////////////////////////////////////////////////////
//connect to HG_Tofes and main BL Main function
/////////////////////////////////////////////////////////
(() =>{
    let host = choseHost();
    let filePath = './cities.xlsx';
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
                    await copyUserAttachments(database);
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
                if (argv.showdmgchld) {
                    let usersDmgChld = await findDamagedChildren(database,'users');
                    if(usersDmgChld && usersDmgChld.length > 0){
                        console.log(usersDmgChld);
                        console.log(`users ammount ${usersDmgChld.length}`);
                    }
                    process.exit();
                }
                //Fix damaged children in an itemRows array in signup
                if (argv.fixdmgchld) {
                    let usersDmgChld = await findDamagedChildren(database,'users');
                    if(usersDmgChld && usersDmgChld.length > 0){
                        console.log(`users to fix ammount ${usersDmgChld.length}`);
                        console.log(`fixing damaged children`);
                        const col = database.collection('users');
                     
                        for(let i = 0; i< usersDmgChld.length;i++){
                            let iRows = usersDmgChld[i].employeeData.itemRows;
                            delete usersDmgChld[i].employeeData.itemRows._t;
                            let newItemRows = iRows._v;
                            delete usersDmgChld[i].employeeData.itemRows._v;
                            usersDmgChld[i].employeeData.itemRows = newItemRows;
                            let id = usersDmgChld[i]._id;
                            await col.updateOne({_id:id}, {$set: {'employeeData.itemRows':usersDmgChld[i].employeeData.itemRows }});
                            console.log(usersDmgChld[i].employeeData.itemRows);
                            console.log("FIXED");
                        }
                    }
                    process.exit();
                }
                if(argv.showCity || argv.fixCity || argv.distinctCities){
                    parseExcel(filePath,database);
                }
                if(argv.chngeToCode){
                    fixUsers(database);
                }
                if(argv.fixTextForms){
                    fixTextForms(database);
                }
                if(argv.fixCodeForms){
                    fixFormsCodes(database);
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
let copyUserAttachments = async (database)=>{
    // let database = db.db('HG_Tofes');
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
//Find damaged children in an itemRows array in signup
/////////////////////////////////////////////////////////////////////////////////////////
let findDamagedChildren = async (database,collectionName)=>{
    return  await database.collection(collectionName).find({'employeeData.itemRows._v':{$exists:true}}).toArray();
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
 let parseExcel = async (filePath,database)=>{
    let workbook = XLSX.readFile(filePath,{cellDates: true});
    let mapperWorkBook =  workbook.Sheets.Sheet1;
    let sheet_name_list = workbook.SheetNames;
    let foundUsers = [];
    let report = {};
    report.addedData = [];
    report.rejectedData = [];
    let parsedXLS = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet_name_list[0]]); 
    let cnt =  parsedXLS.length + 1;
    let counter = 0;
    for (let i = parsedXLS.length - 1; i >= 0; i -= 1) {
        let cityCode    =  parsedXLS[i]["קוד"];
        let cityName    =  parsedXLS[i]["תאור"];
        let users = await database.collection('users').find({'employeeData.addressData.city':cityName}).toArray();
        foundUsers = _.concat(foundUsers,users);
        console.log(`proccessing employee number:${++counter}`);
    }
    console.log(foundUsers.length);
    let foundUserIds = foundUsers.map(u=>u._id);
    let problematicCitiesUsers = await database.collection('users').find({'_id':{$nin:foundUserIds}}).toArray();
    console.log(`${problematicCitiesUsers.length} problematic users found`);
    let stream = fs.createWriteStream("usersInvalidCities.txt");
    counter = 0;
    stream.once('open', async(fd)=> {
        for (let i = 0; i < problematicCitiesUsers.length; i++) {
            if(problematicCitiesUsers[i].employeeData && problematicCitiesUsers[i].employeeData.addressData && problematicCitiesUsers[i].employeeData.addressData.city){
                //trim all cities with spaces
                if(argv.fixCity){
                    let trimedVal = problematicCitiesUsers[i].employeeData.addressData.city.trim();
                    switch(trimedVal) {
                        case "פתח תקוה":
                            trimedVal = "פתח תקווה";
                          break;
                        case "תל אביב":
                        case "תל אביב-יפ":
                            trimedVal = "תל אביב-יפו";  
                          break;
                          case "מודיעין עילי":
                            trimedVal = "מודיעין עילית";  
                          break;
                          case "קרית אונו":
                            trimedVal = "קריית אונו";  
                          break;
                          case "קרית ביאליק":
                            trimedVal = "קריית ביאליק";  
                          break;
                          case "קרית גת":
                            trimedVal = "קריית גת";  
                          break;
                          case "הרצלייה":
                            trimedVal = "הרצליה";  
                          break;
                          case 'פ"ת':
                                trimedVal = "פתח תקווה";  
                          break;
                          case "אום אל-פחם":
                                trimedVal = "אום אל פחם";  
                          break;
                          case "נהרייה":
                                trimedVal = "נהריה";  
                          break;
                          case "פרדס חנה":
                                trimedVal = "פרדס חנה-כרכור";  
                          break;
                          case 'ראשל"צ':
                          case 'ראשון לציו':
                                trimedVal = "ראשון לציון";  
                          break;
                          case "גני תקוה":
                                trimedVal = "גני תקווה";  
                          break;
                          case "קרית מוצקין":
                                trimedVal = "קריית מוצקין";  
                          break;
                          case "קרית מלאכי":
                                trimedVal = "קריית מלאכי";  
                          break;
                          case "קרית אתא":
                                trimedVal = "קריית אתא";  
                          break;
                          case "קרית ים":
                                trimedVal = "קריית ים";  
                          break;
                          case "מודעין עילית":
                                trimedVal = "מודיעין עילית";  
                          break;
                          case 'ב"ב':
                                trimedVal = "בני ברק";  
                          break;
                          case 'דיר אל אסד':
                                trimedVal = "דיר אל-אסד";  
                          break;
                          case "מודעין עילית":
                                trimedVal = "מודיעין עילית";  
                          break;
                          case 'בת-ים':
                                trimedVal = "בת ים";  
                          break;
                        default:
                                
                          // code block
                      }
                    await database.collection('users').updateOne({_id:problematicCitiesUsers[i]._id}, {$set: {'employeeData.addressData.city':trimedVal }});
                    console.log("updated");
                }else if(argv.showCity){
                    stream.write(`The users are ${problematicCitiesUsers[i]._id}\n`);
                    stream.write(`The cities are ${problematicCitiesUsers[i].employeeData.addressData.city}\n`);
                    console.log(`writing to file number:${++counter}`);
                }
            }
        }
        stream.end();
        if(argv.distinctCities){
            let problematicNames = problematicCitiesUsers.map(p=>p.employeeData && p.employeeData.addressData && p.employeeData.addressData.city);
            //let uniqueProb = [...new Set(problematicNames)];
            problematicNames = problematicNames.filter(function (el) {
                return el != null && el != "";
            });
            const result = _.values(_.groupBy(problematicNames)).map(d => ({city: d[0], count: d.length}));
            let stream2 = fs.createWriteStream("distinctCities.txt");
            stream2.once('open', async(fd)=> { 
                for (let i = 0; i < result.length; i++) {
                    stream2.write(`City:${result[i].city}. Count:${result[i].count}\n`);
                }
                stream2.end();
            })
        }
        console.log("DONE");
    });
 }
///////////////////-----------------------/////////////////////////////////////////////////



