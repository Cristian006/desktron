const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer} = electron;
const moment = require('moment');
const nedb = require('nedb');
var db = new nedb({filename : __dirname + '/data/db.json', autoload: true});

var USER = null;
var footerPhoneCounter = null;

let iPhoneSixScreens = {
    sg : '661-00141',
    g : '661-00142',
    sl : '661-00143'
}

document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init(); 
    }
};

//WebPage Set Up
function init() {
    findAllElements();
    JsBarcode(".barcode").init();
    db.find({}, function (err, docs){
      console.log("FOUND DOC " + docs[0].userName);
      USER = docs[0];
      updateHome();
    });

    document.getElementById("minButton").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        window.minimize(); 
    });

    document.getElementById("maxButton").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        if (!window.isMaximized()) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    });

    document.getElementById("closeButton").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        window.close();
    });

    document.getElementById("startRepair").addEventListener("click", function(e){
        if(document.getElementById("phoneDispatch").value != ''){
            startRepair(document.getElementById("phoneDispatch").value);
        }
    });
};

function findAllElements(){
    footerPhoneCounter = document.getElementById("footerPhone");
}

function updateHome(){
    document.getElementById("footerName").innerHTML = USER.userName;
    updateWelcome();
    updateFooterPhoneCount();
}

function openTabPage(evt, contentID){
    var i, contents, tabLinks;
    
    //hide all tabContent
    contents = document.getElementsByClassName("tab-content");
    for (i=0; i < contents.length; i++)
    {
        contents[i].style.display = "none";
    }
    
    //set all nav icons as in-active
    tabLinks = document.getElementsByClassName("nav-icon");
    for(i=0; i < tabLinks.length; i++)
    {
        tabLinks[i].className = tabLinks[i].className.replace(" active","");
    }
    var toolBarTitle = document.getElementById("toolBarTitle");
    switch (contentID) {
        case "home":
            toolBarTitle.innerHTML = "Home";
            changePageColor("#3F51B5", "#8C9EFF");
            updateHome();
            break;
        case "repair":
            toolBarTitle.innerHTML = "Repair Technician";
            changePageColor("#F44336", "#FF8A80");
            break;
        case "quality":
            toolBarTitle.innerHTML = "Quality Assurance";
            changePageColor("#673AB7", "#B388FF");
            break;
        case "settings":
            toolBarTitle.innerHTML = "Settings";
            changePageColor("#607D8B", "#78909C");
            break;
        default:
            toolBarTitle.innerHTML = "Home";
            changePageColor("#3F51B5", "#8C9EFF");
            break;
    }

    //set the right content and nav icon to active
    document.getElementById(contentID).style.display = "block";
    evt.currentTarget.className += " active";
}

function changePageColor(primary, secondary) {
    var toolBar = document.getElementById("mainToolBar");
    var tabBar = document.getElementById("mainTabBar");
    var footer = document.getElementById("mainFooter");

    toolBar.style.backgroundColor = primary;
    tabBar.style.backgroundColor = primary;
    footer.style.backgroundColor = primary;
}

//--------------------------UI METHODS------------------------------------//
function updateFooterPhoneCount(){
    footerPhoneCounter.innerHTML = getNumberOfPhones();
}

function updateWelcome(){
    document.getElementById("WelcomeCardTitle").innerHTML = "<img src=\"images/svgs/face_black.svg\"> Welcome, " + USER.userName;
    document.getElementById("clockTime").innerHTML = "<h4>Clocked In: " + USER.clockedInTime + "</h4><h5>That is " + getTimeSinceClockedIn() +" ago.</h5>";
}
//--------------------------END-----------------------------------//


//--------------------REPAIR---------------------------------------//
function startRepair(dis){
    var phone = {
        dispatch : dis,
        serial : 0,
        startTime : new Date(),
        endTime : null,
        note : '',
        repairedBy : USER.userName
    }

    USER.phones.push(phone);

    db.update({ userName: USER.userName }, USER, {}, function (err, numReplaced) {
        console.log("REPLACED " + numReplaced);
    });

    db.find({}, function (err, docs){
        console.log("FOUND DOC " + docs[0].userName + "WITH " + docs[0].phones.length + " PHONES");
        USER = docs[0];
    });
    
    ipcRenderer.send('startRepair', USER.userName, dis);
}
//-----------------------END--------------------------------------//

//-------------------USER METHODS---------------------------------//
function getNumberOfPhones(){
    return USER.phones.length;
}

function getEfficiency() {
    var i, totalTime=0;
    for (i=0; i < USER.phones.length; i++){
        totalTime += USER.phones[i].getTotalTime();
    }
    return totalTime/(USER.phones.length);
}

function getTimeSinceClockedIn(){
    return timeConversion(new Date() - USER.clockedInTime);
}
//-----------------------END-------------------------------------//

//--------------------PHONE METHODS-----------------------------//
function getDispatch(index){
    return USER.phones[index].dispatch;
}
  
function getTimeStarted(index){
    return USER.phones[index].startTime;
}

function repaired(index){
    USER.phones[index].endTime = new Date();
}

function getTotalTime(){
    return (USER.phones[index].startTime - USER.phones[index].endTime);
}
//----------------------END-------------------------------------//

function timeConversion(millisec) {
    var seconds = (millisec / 1000).toFixed(1);
    var minutes = (millisec / (1000 * 60)).toFixed(1);
    var hours = (millisec / (1000 * 60 * 60)).toFixed(1);
    var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);
    if (seconds < 60) {
        return seconds + " Sec";
    } else if (minutes < 60) {
        return minutes + " Min";
    } else if (hours < 24) {
        return hours + " Hrs";
    } else {
        return days + " Days"
    }
}