//USER CLASS
function User(name){
    this.name = name;
    this.clockin = null;
    this.clockout = null;
    this.phones = [];
}

//PHONE CLASS
function Phone(dis){
    this.model = '';
    this.dispatch = dis;
    this.serial = 0;
    this.place = '';
    this.address = '';
    this.color = '';
    this.note = '';
    this.screen = {
        pn : '',
        sn : '',
        rn : ''
    };
    this.screws = '';
    this.started = null;
    this.ended = null;
    this.total = null;
}

//ELECTRON VARIABLES
const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer} = electron;

//SELENIUM VARIABLES
const webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);
var gsxDriver = null;

//DATABASE VARIABLES
const nedb = require('nedb');
var db = new nedb({filename : __dirname + '/data/db.json', autoload: true});

//DESKTRON VARIABLES
var USER = new User('');
var footerPhoneCounter = null;

//START
document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        //CALL SET UP
        init(); 
    }
};

//SET UP
function init() {
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

    document.getElementById("loginButton").addEventListener("click", function(e){
        getLoginCredentials();
    });

    document.getElementById("pinButton").addEventListener("click", function (e) {
        sendKeysToPinModal(); 
    });
};

//GSX Functions
function getLoginCredentials() {
    var userName = document.getElementById('user-name').value;
    var userPass = document.getElementById('user-password').value;
    if(userName != "" && userPass != "")
    {
        console.log("logging in the renderer process");
        document.getElementById("loginSection").style.display = 'none';
        document.getElementById("loadingSpinner").style.display = 'block';
        gsxLogin(userName, userPass);
    }
}

function gsxLogin(name, pass){
    console.log("LOGGING IN...");
    gsxDriver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
    var user = '';  
    //LOAD GSX IN CHROME
    gsxDriver.get('https://gsx.apple.com/');
    var re = /@(iqor)*\.(com)|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]{1,5})?$/;
    if (name.search(re) == -1)
    {
        user = name.replace(".", " ");
        name += "@iqor.com";
    }
    else{
        user = name.replace(".", " ");
        user = user.replace("@iqor.com", "");
    }
    user = TitleCase(user);

    gsxDriver.getTitle().then(function(title) {
        console.log(title);
        if(title.includes("Login")){
            //USERNAME
            var inputElementForUserID = gsxDriver.findElement(By.name('appleId'));
            inputElementForUserID.sendKeys(name);
            //PASSWORD
            var inputElementForUserPass = gsxDriver.findElement(By.name('accountPassword'));
            inputElementForUserPass.sendKeys(pass);
            inputElementForUserPass.submit();
        }
    });

    gsxDriver.getTitle().then(function(title) {
        if(title.includes("My Apple ID")){
            //we logged in
            gsxDriver.findElement(By.id('send-code-to-trusted-device')).click();
            gsxDriver.findElement(By.name('rememberMeSelected')).click();
            USER.name = user;
            openPinModal();
        }
        else if (title.includes("Login")){
            //console.log("WE DID NOT LOG IN" + title);
            //RELOGIN - HIDE THE SPINNER
        }
    });
}

function openPinModal(){
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
}

function sendKeysToPinModal(){
    var i, numbers = [], pinElements = document.getElementsByClassName("pin-input");
    for(i = 0; i < pinElements.length; i++){
        numbers.push(pinElements[i].value);
    }
    console.log(numbers);
    gsxDriver.findElements(By.className("digit-input")).then(elements => sendInPin(elements, numbers));
}

function sendInPin(elements, numbers){
    var i;
    for (i=0; i < elements.length; i++){
    elements[i].sendKeys(numbers[i]);
        if(i==(elements.length-1)){
          gsxDriver.findElement(By.name('setupLink')).click();
        }
    }
    USER.clockin = new Date();

    db.remove({}, { multi: true }, function (err, numRemoved) {
        console.log("REMOVED " + numRemoved + " USER(S) FROM THE DATABASE");
    });

    db.insert(USER, function (err, newDoc) {
        console.log("NEW DOC: " + newDoc.name + " phones: " + newDoc.phones.length);
    });

    loadHome();
}

function getPhoneByIndex(index){
    if(index < USER.phones.length){
        return USER.phones[index];
    }
    else{
        return null;
    }
}

function updateUSERFromDB(){
    db.find({name: USER.name}, function (err, docs){
        console.log("FOUND DOC IN UPDATE USER FORM DB: " + docs[0].name);
        USER.name = docs[0].name;
        USER.clockin = docs[0].clockin;
        USER.clockout = docs[0].clockout;
        USER.phones = docs[0].phones;
        console.log("PHONES: " + USER.phones.length);
        updateHome();
    });
}

function updateUSERInDB(){
    db.update({ name: USER.name }, USER, {}, function (err, numReplaced) {
        console.log("UPDATED " + numReplaced + " USER(s).");
    });
}

function updateHome(){
    document.getElementById("footerName").innerHTML = USER.name;
    updateWelcome();
    updateFooterPhoneCount();
}

function loadHome(){
    openTabPage(null, "home");
    showNavBar(true);
    showFooter(true);
}

function showFooter(show){
    document.getElementById("mainFooter").style.display = show == true ? "block" : "none";
    document.getElementById("mainContainer").style.paddingBottom = show == true ? "25px" : "0px";
}

function showNavBar(show){
    document.getElementById("mainNavBar").style.display = show == true ? "block" : "none";
    document.getElementById("mainToolBar").style.left = show == true ? "50px" : "0px";
    document.getElementById("mainTabBar").style.left = show == true ? "50px" : "0px";
    document.getElementById("mainContainer").style.marginLeft = show == true ? "50px" : "0px";
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
    if(evt != null){
        for(i=0; i < tabLinks.length; i++)
        {
            tabLinks[i].className = tabLinks[i].className.replace(" active","");
        }
    }
    var toolBarTitle = document.getElementById("toolBarTitle");
    switch (contentID) {
        case "login":
            toolBarTitle.innerHTML = "Settings";
            changePageColor("#607D8B", "#78909C");
            break;
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
    if(evt != null){
        evt.currentTarget.className += " active";
    }
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
    document.getElementById("footerPhone").innerHTML = USER.phones.length;
}

function updateWelcome(){
    document.getElementById("WelcomeCardTitle").innerHTML = "<img src=\"images/svgs/face_black.svg\"> Welcome, " + USER.name;
    document.getElementById("clockTime").innerHTML = "<h4>Clocked In: " + USER.clockin + "</h4><h5>That is " + getTimeSinceClockedIn() +" ago.</h5>";
}
//--------------------------END-----------------------------------//


//--------------------REPAIR---------------------------------------//
function startRepair(dispatch){
/*    //create phone
    var phone = new Phone();
    //give the phone its dispatch number
    phone.dispatch = dispatch;                           //this will be done in main.
    //put the phone into the user's array of phones
    USER.phones.push(phone);
    //update the user in data base*/
    //updateUSERInDB();
    //start the repair in the main process with the correct username
    //ipcRenderer.send('startRepair', dispatch);
    var searchBar;
    console.log("STARTING REPAIR " + dispatch + " -----------------------------");
    gsxDriver.get("https://gsxapp.apple.com/WebApp/home.htm");
    gsxDriver.sleep(1000);
    searchBar = gsxDriver.findElement(By.id("search_GSX_input"));
    searchBar.sendKeys(dispatch);
    searchBar.sendKeys(webdriver.Key.RETURN);

    gsxDriver.sleep(4000);

    getPhoneInfo(event, dispatch);
}

function getPhoneInfo(event, dispatch) {
  var phone = new Phone(dispatch);
  var dispatchRE = new RegExp("[Rr]")
  var phoneModel = gsxDriver.findElement(By.css("h3.swappable-text.model"));
  var phoneSerial = gsxDriver.findElement(By.css("p#tester"));
  var shipToAddress = gsxDriver.findElement(By.css("div#shipToAddress.box_slot div.slot_details"))
  var color = gsxDriver.findElement(By.css((dispatchRE.test(dispatch) ? "div.box_slot p#tester + p" : "div.box_slot p#carrier_meid + p")));
  
  phoneModel.getInnerHtml().then(function(html){
    phone.model = html;
    console.log("model: " + phone.model);
  });

  phoneSerial.getInnerHtml().then(function(html){
    html = html.replace(/<strong>([A-Za-z])\w+[\s#]+<[/]strong>/g, '');
    phone.serial = html;
    console.log("DISPATCH: " + phone.dispatch);
    console.log("SERIAL: " + phone.serial);
  });

  shipToAddress.getInnerHtml().then(function(html){
    var addressString = html.match(/\d+[ ](?:[A-Za-z0-9.-]+[ ]?)+(?:|Avenue|Lane|Road|Boulevard|Drive|Street|AVE|Dr|Rd|Blvd|Ln|St)\.?/);
    phone.address = (addressString.length > 0 ? addressString[0] : "No Address Found");
    
    if(addressString.length > 0){
      switch(phone.address){
        case "340 University Avenue": 
          phone.place = "APPLE STORE PALO ALTO";
          break;
        case "183 Stanford Shopping Center":
          phone.place = "APPLE STORE STANFORD";
          break;
        case  "2421 BROADWAY ST":
          phone.place = "MOBILE KANGAROO REDWOOD CITY"
          break;
        case "100 W EL CAMINO REAL":
          phone.place = "MOBILE KANGAROO MOUNTAIN VIEW";
        case "52 N SANTA CRUZ AVE":
          phone.place = "CLICKAWAY LOS GATOS"
          break;
        default:
          phone.place = "WE DON'T HAVE THIS ADDRESS ON RECORD, GET IT";
          break;
      }
      console.log("SHIP TO: " + phone.place + "\n     " + phone.address);
    }
  });

  color.getInnerHtml().then(function(html){
    var gray = new RegExp("GRAY");
    var gold = new RegExp("GOLD");
    var silver = new RegExp("SILVER|SLVR");
    var white = new RegExp("WHT");
    var black = new RegExp("BLACK");
    
    if(gray.test(html)){
      phone.color = "SPACE GRAY";
    }
    else if(gold.test(html)){
      phone.color = "GOLD";
    }
    else if(silver.test(html)){
      phone.color = "SILVER";
    }
    else if(white.test(html)){
      phone.color = "WHITE";
    }
    else if(black.test(html)){
      phone.color = "BLACK";
    }
    else{
      console.log("COLOR: WE HAVEN'T RECORDED THIS COLOR, GET IT " + html);
    }
    console.log("COLOR: " + phone.color);

    phone.screen.pn = getScreenPartNumber(phone.model, phone.color);
    //phone.screws = getScrewPartNumbers(phone.model);
    console.log("screen pn#: " + phone.screen.pn);
    console.log("screws pn#: " + phone.screws);
    USER.phones.push(phone);
    console.log("AFTER PUSH, USER PHONES LENGTH: " + USER.phones.length);
    setUpPhoneCard();
  });
}

function getScreenPartNumber(model, color){  
  var i, j, re;
  for(i = 0; i < phoneModels.length; i++){
    re = new RegExp(phoneModels[i]);
    if(re.test(model)){
      for(j = 0; j < phoneColors.length; j++){
        re = new RegExp(phoneColors[j]);
        if(re.test(color)){
          return screenPartNumbers[getIndexForScreenPartNumber(i+1, j)];
        }
      }
    }
  }
}

function setUpPhoneCard(){
    var i, p, parent, html;
    i = USER.phones.length-1;
    console.log("IIIIIIII: " + i);
    p = USER.phones[i];
    console.log("LOGING PHONE: " + USER.phones[i]);
    console.log("LOGING P: " + p);
    parent = document.getElementById("PhoneToBeFixed");
    html = "<section class=\"card-header\">" + 
                    "<img class=\"title-icon\" src=\"images/svgs/iphone/" 
                + "iphone_rose.svg" + "\">" +
                "<p class=\"card-title\">" + p.model + " " + p.color + "</p>" +
                "</section>" + 
                    "<section class=\"dispatch\">" + 
                        "<img class=\"icon\" src=\"images/svgs/receipt_black.svg\">" +
                        "<div class=\"content\">" +
                            "<p>Dispatch Number</p>" + 
                            "<svg class=\"barcode\"" + 
                                "jsbarcode-format=\"CODE39\"" +
                                "jsbarcode-value=\"" + p.dispatch + "\""+
                                "jsbarcode-textmargin=\"0\"" + 
                                "jsbarcode-height=\"30px\"" + 
                                "jsbarcode-width=\"1\"" +
                                "jsbarcode-fontOptions=\"bold\"" +
                                "jsbarcode-font=\"Roboto Condensed\">" +
                            "</svg>" + 
                            "<p>Serial Number</p>" + 
                            "<svg class=\"barcode\"" + 
                                "jsbarcode-format=\"CODE39\"" +
                                "jsbarcode-value=\"" + p.serial + "\""+
                                "jsbarcode-textmargin=\"0\"" + 
                                "jsbarcode-height=\"30px\"" + 
                                "jsbarcode-width=\"1\"" +
                                "jsbarcode-fontOptions=\"bold\"" +
                                "jsbarcode-font=\"Roboto Condensed\">" +
                            "</svg>" +
                        "</div>" +
                    "</section>" +
                    "<section class=\"place\">" +
                        "<img class=\"icon\" src=\"images/svgs/place_black.svg\">" +
                        "<div class=\"content\">" +
                            "<p>" + p.PLACE + " " + p.ADDRESS + "</p>" +
                        "</div>" +
                    "</section>" +
                    "<section class=\"time\">" +
                        "<img class=\"icon\" src=\"images/svgs/timer/timer_black.svg\">" +
                        "<div class=\"content\">" +
                            "<p>Repair Started: 1:50.9PM</p>" +
                            "<p>Repair Ended: 5:30.5PM</p>" +
                            "<p>Repair Time: 3'40''</p>" +
                        "</div>" +
                    "</section>" +
                    "<section class=\"note\">" +
                        "<img class=\"icon\" src=\"images/svgs/note/note_black.svg\">" +
                        "<div class=\"content\">" +
                            "<p>No Note</p>" +
                        "</div>" +
                    "</section>" +
                    "<section class=\"screen\">" +
                        "<img class=\"icon\" src=\"images/svgs/smartphone_black.svg\">" +
                        "<div class=\"content\">" +
                            "<p>Part Number</p>" +
                            "<svg class=\"barcode\"" + 
                                "jsbarcode-format=\"CODE39\"" +
                                "jsbarcode-value=\"" + p.screen.pn + "\""+
                                "jsbarcode-textmargin=\"0\"" + 
                                "jsbarcode-height=\"30px\"" + 
                                "jsbarcode-width=\"1\"" +
                                "jsbarcode-fontOptions=\"bold\"" +
                                "jsbarcode-font=\"Roboto Condensed\">" +
                            "</svg>" +
                            "<p>Serial Number</p>" +
                            "<svg class=\"barcode\"" + 
                                "jsbarcode-format=\"CODE39\"" +
                                "jsbarcode-value=\"" + p.screen.pn + "\""+
                                "jsbarcode-textmargin=\"0\"" + 
                                "jsbarcode-height=\"30px\"" + 
                                "jsbarcode-width=\"1\"" +
                                "jsbarcode-fontOptions=\"bold\"" +
                                "jsbarcode-font=\"Roboto Condensed\">" +
                            "</svg>" +
                            "<p>Return Order Number</p>" +
                            "<svg class=\"barcode\"" + 
                                "jsbarcode-format=\"CODE39\"" +
                                "jsbarcode-value=\"" + p.screen.rn + "\""+
                                "jsbarcode-textmargin=\"0\"" + 
                                "jsbarcode-height=\"30px\"" + 
                                "jsbarcode-width=\"1\"" +
                                "jsbarcode-fontOptions=\"bold\"" +
                                "jsbarcode-font=\"Roboto Condensed\">" +
                            "</svg>" +
                        "</div>" +
                    "</section>" +
                    "<section class=\"screws\">" +
                        "<img class=\"icon\" src=\"images/svgs/screwdriver_black.svg\">" +
                        "<div class=\"content\">"+
                            "<p>661-00141</p>" +
                            "<p>661-00141</p>" +
                        "</div>" +
                    "</section>";
    parent.innerHTML = html;
    JsBarcode(".barcode").init();
    parent.style.display = "block";
}

//-----------------------END--------------------------------------//

//-------------------USER METHODS---------------------------------//
function getEfficiency() {
    var i, totalTime=0;
    for (i=0; i < USER.phones.length; i++){
        totalTime += getTotalTime(i);
    }
    return totalTime/(USER.phones.length);
}

function getTimeSinceClockedIn(){
    return timeConversion(new Date() - USER.clockin);
}
//-----------------------END-------------------------------------//

//--------------------PHONE METHODS-----------------------------//
function getDispatch(index){
    return USER.phones[index].dispatch;
}
  
function getTimeStarted(index){
    return USER.phones[index].started;
}

function repaired(index){
    USER.phones[index].ended = new Date();
}

function getTotalTime(){
    return (USER.phones[index].started - USER.phones[index].ended);
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

function TitleCase(str){
  //cristian ponce -> Cristian Ponce
  return str.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
}