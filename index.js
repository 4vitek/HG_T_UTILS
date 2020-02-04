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
    }).option('traverseForms', {
        alias: 'tF',
        description: 'traverse forms',
    }).option('fixIashuvMezake', {
        alias: 'fxM',
        description: 'fix mezake',
    }).option('fixIashuvMizakeCodes', {
        alias: 'fyc',
        description: 'fix mezake to codes',
    }).option('showWrongMates', {
        alias: 'shWm',
        description: 'shows mates that are wrong (booleans)',
    }).option('updateWrongMates', {
        alias: 'updWm',
        description: 'shows mates that are wrong (booleans)',
    }).option('initFirstMessage', {
        alias: 'initF',
        description: 'clear first message indication',
    }).option('eml', {
        alias: 'insMail',
        description: 'email stub',
    }).option('removeFirstWorker', {
        alias: 'rmF',
        description: 'removes first year worker',
    }).option('initPass', {
        alias: 'iP',
        description: 'initiates user password in specific company',
    }).option('showDamagedFiles', {
        alias: 'shwDF',
        description: 'show files which differ from db',
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
            let city = "";
            if(argv.fixIashuvMezake){
                city = formDataObj.inputYeshuvMezake ? formDataObj.inputYeshuvMezake : "";
            }else{
                city = formDataObj.city ? formDataObj.city : "";
            }
            console.log(city)
            if(!city){
                continue;
            }
            let trimedVal = city.trim();
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
              if(argv.fixIashuvMezake){
                console.log(`${forms[i]._id} text fixed`);
                console.log(`${forms.length}  fixed`);
                formDataObj.inputYeshuvMezake = trimedVal;
              }else{
                console.log(`${forms[i]._id} text fixed`);
                console.log(`${forms.length}  fixed`);
                formDataObj.city = trimedVal;
              }
              await database.collection('forms').updateOne({_id:forms[i]._id}, {$set: {'formData':JSON.stringify(formDataObj)}});
        }
    }
    console.log(`Done`);
}
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////fixFormsCodes///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
let fixFormsCodes = async (database)=>{
    let forms = await database.collection('forms').find({}).toArray();
    let cities = await database.collection('cities').find({}).toArray();
    for (let i = 0; i < forms.length; i++) {
        let formDataObj = JSON.parse(forms[i].formData);
        let city = "";
        if(argv.fixIashuvMizakeCodes){
            city = formDataObj.inputYeshuvMezake ? formDataObj.inputYeshuvMezake : "";
        }else{
            city = formDataObj.city ? formDataObj.city : "";
        }
        if(formDataObj && city){
            let cityObj = cities.find(c=>c.cityName == city);
            if(cityObj){
                if(argv.fixIashuvMizakeCodes){
                    formDataObj.inputYeshuvMezake = cityObj.cityCode;
                }else{
                    formDataObj.city = cityObj.cityCode;
                    formDataObj.cityText = cityObj.cityName;
                }
                await database.collection('forms').updateOne({_id:forms[i]._id}, {$set: {'formData':JSON.stringify(formDataObj)}});
                console.log(`${forms[i]._id} updated with city code ${cityObj.cityCode}`);
            }
        }
    }
    console.log("DONE");
}

let showWrongMates = async (database)=>{
    let users = await database.collection('users').find({}).toArray();
    let cnt = 0;
    for (let i = 0; i < users.length; i++) {
        if(users[i].employeeData && users[i].employeeData.partnerData && users[i].employeeData.partnerData.isWorking 
            && typeof users[i].employeeData.partnerData.isWorking === "boolean"){
            let partnerDataObj = users[i].employeeData.partnerData;
            console.log(`the mate declaration is ${partnerDataObj.isWorking} at user ${users[i].userName}`);
            ++cnt;
        }
    }
    console.log(cnt);
}
let updateWrongMates = async (database)=>{
    let users = await database.collection('users').find({}).toArray();
    let cnt = 0;
    for (let i = 0; i < users.length; i++) {
        if(users[i].employeeData && users[i].employeeData.partnerData && users[i].employeeData.partnerData.isWorking 
            && typeof users[i].employeeData.partnerData.isWorking === "boolean"){
            let partnerDataObj = users[i].employeeData.partnerData;
            if(partnerDataObj.isWorking){
                partnerDataObj.isWorking = "mateHasSallary";
            }else{
                partnerDataObj.isWorking = "mateNoSallary";
            }
            await database.collection('users').updateOne({_id:users[i]._id}, {$set: {'employeeData.partnerData':partnerDataObj}});
            console.log(`UPDATED: the mate declaration is ${partnerDataObj.isWorking} at user ${users[i].userName}`);
            ++cnt;
        }
    }
    console.log(cnt);
}
//ObjectId("5c4ed5ab6c93a802608f8690")
let initFirstMessage = async (database)=>{//5dc7b3a53603ea130c59a725
    let users = await database.collection('users').find({'employeeData.companyId':ObjectId("5c4ed5ab6c93a802608f8690")}).toArray();
    for (let i = 0; i < users.length; i++) {
        await database.collection('users').updateOne({_id:users[i]._id}, {$set: {'isFirstMessageSent':false}});
    }
}

let eml = async (database)=>{
    let users = await database.collection('users').find({'employeeData.companyId':ObjectId("5dc7b3a53603ea130c59a725"),'employeeData.email':{ $exists: false }}).toArray();
    for (let i = 0; i < users.length; i++) {
        console.log(`UPDATED: the user ${users[i].userName}`);
        await database.collection('users').updateOne({_id:users[i]._id}, {$set: {'employeeData.email':'team3101@gmail.com'}});
    }
}

let removeFirstWorker = async (database)=>{
    let users = await database.collection('users').find({'employeeData.companyId':ObjectId("5dc7b3a53603ea130c59a725")}).toArray();
    for (let i = 0; i < users.length; i++) {
        console.log(`UPDATED: the user ${users[i].userName}`);
        await database.collection('users').updateOne({_id:users[i]._id}, {$set: {'isFirstYearWorker101':false}});
    }
}

//For ezer me tsion
let initPass = async (database)=>{
    let users = await database.collection('users').find( {'userType' : "employee", 'employeeData.companyId': 
    { $in: [ObjectId("5c482881ca20d50f3c2a7463"),
            ObjectId("5c4828acca20d50f3c2a7465")] 
    } } ).toArray();
    let i;
    for (i = 0; i < users.length; i++) {
        console.log(`UPDATED: the user ${users[i].userName}`);
        await database.collection('users').updateOne({_id:users[i]._id}, {
            $set: {'isFirstEntrance':true,'password' : 'C5xXuEZEQH4Rm1XnaMLbAw2VuvUo'}
        });
    }
    console.log(`${i+1} users were updated`)
    console.log("DONE");
}

let traverseForms  = async (database)=>{
    let forms = await database.collection('forms').find({}).toArray();
    let cnt = 0;
    for (let i = 0; i < forms.length; i++) {
        let formDataObj = JSON.parse(forms[i].formData);
        if(formDataObj && formDataObj.inputYeshuvMezake){
                console.log(`${forms[i]._id} updated with city code ${formDataObj.inputYeshuvMezake}`);
                ++cnt;
        }
    }
    console.log(cnt);
}

let showDamagedFiles = async (database)=>{
    let users = await database.collection('users').find( {}).toArray();
    let i;
    for (i = 0; i < users.length; i++) {
        console.log(`user: ${users[i].userName} proccessed`);

        let hNumberId = users[i].employeeData.hpNumberId ? users[i].employeeData.hpNumberId : users[i].employeeData.hpnumberId;
        let path = `C:/Users/victor/Documents/Infra/HargalWeb/Source/uploads/${users[i].userName}/${users[i]._id}/${users[i].employeeData.tikNikuimId}/${hNumberId}`
        let company = await database.collection('company').findOne({'_id':ObjectId(users[i].employeeData.companyId)}); 
        path += `/${company.name}`;


        let forms = await database.collection('forms').find({'employeeId':users[i]._id}).toArray();
        let j;
        for (j = 0; j < forms.length; j++) {
            let form = forms[j];
            parseFormForFileChk(form,path);
        }
    }
    console.log(`${i+1} users were updated`)
    console.log("DONE");
}

// teudat_zeut_folder:"teudat_zeut",
// sefah_children_teudatZ:"sefah_children",
// ex_shuma_folder:"exWife_shuma_certificate",
// tlush:"tlushSahar",
// cripple_certificate:"cripple_certificate",
// doc_1312_a:"doc_1312a",
// teudat_ole:"teudatOle",
// teudat_toshav_hozer:"teudatToshavHozer",
// cripple_mate:"benZugNehe",
// divorce_certificate:"divorceCertificate",
// mezonot_certificate:"mezonotCertificate",
// sium_sherut_certificate:"siumSherutCertificate",
// tofes_119 : "tofes119",
// graduateCertificate: "graduateCertificate",
// bankVerification: "bankVerification",
// no_income_prove:"noIncomeProve",
// aprove_shuma_clerk:"AproveShumaClerk",
// ishur_gimlat_child:"ishurGimlatChild",
// tipForUpload :"*הינך מתבקש להעלות קובץ",
// textForValidationPdfZip:"בפורמט ZIP ,לצורך בדיקת החתימה דיגיטלית.",
// TofesHadashToolTip:"פתיחת טופס חדש לשינוים באותה שנה",
// ShowPirteyOvedTollTip:"הצג פרטי עובד",
// Form101PdfDownloadFolder : "pdf101Print",
// containsHebrewMsg:"הינך מקליד בעברית"

let parseFormForFileChk = async (formObj,path) =>{
    if(formObj){
        let formDataObj = JSON.parse(formObj.formData);
        if(formDataObj.zeutFileText){
            checkOrCorrectFile("teudat_zeut",path,formDataObj.zeutFileText)
        }
    }

}

let checkOrCorrectFile = async (folderName,path,actualFileName) =>{
    let fullPath = `${path}/${folderName}`;
    if (fs.existsSync(fullPath)) {
        fs.readdir(fullPath, async (err, items) => {
            console.log(items);
            for (var i=0; i<items.length; i++) {
                console.log(`folder file: ${items[i]}`);
                console.log(`actual file: ${actualFileName}`);
               
                if(items[i] !== actualFileName){
                    if(actualFileName != "2020"){
                        let files = items.filter(i=>i.includes(actualFileName));
                        if(files && files.length === 0){
                            //no file found to log
                        }
                        if(files && files.length === 1){
                         //change
                        }
                        if(files && files.length > 1){
                            // to log
                        }
                    }else{

                    }
                }
            }
        });
    }
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
                if(argv.fixTextForms || argv.fixIashuvMezake){
                    fixTextForms(database);
                }
                if(argv.fixCodeForms || argv.fixIashuvMizakeCodes){
                    fixFormsCodes(database);
                }
                if(argv.traverseForms){
                    traverseForms(database);
                }
                if(argv.showWrongMates){
                    showWrongMates(database);
                }
                if(argv.updateWrongMates){
                    updateWrongMates(database);
                }
                if(argv.initFirstMessage){
                    initFirstMessage(database);
                }
                if(argv.eml){
                    eml(database);
                }
                if(argv.removeFirstWorker){
                    removeFirstWorker(database);
                }
                if(argv.initPass){
                    initPass(database);
                }
                if(argv.showDamagedFiles){
                    showDamagedFiles(database);
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



