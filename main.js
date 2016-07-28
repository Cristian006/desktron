const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;
// Module to create a native menu
const {Menu} = electron;
//Module to receive calls from the renderer process
const {ipcMain} = electron;//require('electron');
// App Icon
const appFavIcon = "app/images/lightbulb/lightbulb.png"
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const moment = require('moment');

const nedb = require('nedb');
var db = new nedb({filename : __dirname + '/app/data/db.json', autoload: true});
var phoneDB  = require('./app/data/phones.json');
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800, 
    height: 600, 
    'minHeight': 600, 
    'minWidth': 800, 
    title: "Desktron", 
    backgroundColor: "#EEEEEE", 
    icon: appFavIcon, 
    frame: false
  });
  
  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/app/index.html`);

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();

var mainDriver = null;
var loggedIn = false;
var user = '';

chrome.setDefaultService(service);

//GSX LOGIN
ipcMain.on('GSX-Login-Message', (event, name, pass) => {
  console.log("logging in the main process");
  mainDriver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
  mainDriver.get('https://gsx.apple.com/');
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

  mainDriver.getTitle().then(function(title) {
    console.log(title);
    if(title.includes("Login")){
        //USERNAME
        var inputElementForUserID = mainDriver.findElement(By.name('appleId'));
        inputElementForUserID.sendKeys(name);
        //PASSWORD
        var inputElementForUserPass = mainDriver.findElement(By.name('accountPassword'));
        inputElementForUserPass.sendKeys(pass);
        inputElementForUserPass.submit();
    }
  });

  mainDriver.getTitle().then(function(title) {
    if(title.includes("My Apple ID")){
      //we logged in
      loggedIn = true;
      mainDriver.findElement(By.id('send-code-to-trusted-device')).click();
      mainDriver.findElement(By.name('rememberMeSelected')).click();
      event.sender.send('GSX-Login-Reply', user);
    }
    else if (title.includes("Login")){
      event.sender.send('GSX-Login-Reply', 'false');
      console.log("WE DID NOT LOG IN" + title);
    }
  });
});

//Send pin numbers to the modal dialog on gsx
ipcMain.on('GSX-Pin-Message', (event, pinNumbers) => {
  mainDriver.findElements(By.className("digit-input")).then(elements => sendInPin(elements, pinNumbers));
});
ipcMain.on('startRepair', (event, username, phoneDispatch) => {
  var searchBar;
  console.log("STARTING REPAIR " + phoneDispatch + " -----------------------------");
  mainDriver.get("https://gsxapp.apple.com/WebApp/home.htm");
  mainDriver.sleep(1000);    	
  searchBar = getSearchBar();
  searchBar.sendKeys(phoneDispatch);
  searchBar.sendKeys(webdriver.Key.RETURN);

  mainDriver.sleep(4000);
  
  getPhoneInfo(phoneDispatch);
});

function getSearchBar(){
  return mainDriver.findElement(By.id("search_GSX_input"));
}

//TODO: when logging in check to see if we can find a doc with their user name already in the database
//if so use that one if not create a new one. so we can close the program re open it and it would save everything for the day

//send in pin number to modal dialog to login
//get dispatch as a string
function getPhoneInfo(dispatch) {
  var dispatchRE = new RegExp("[Rr]")
  var phoneModel = mainDriver.findElement(By.css("h3.swappable-text.model"));
  var phoneSerial = mainDriver.findElement(By.css("p#tester"));
  var shipToAddress = mainDriver.findElement(By.css("div#shipToAddress.box_slot div.slot_details"))
  var color = mainDriver.findElement(By.css((dispatchRE.test(dispatch) ? "div.box_slot p#tester + p" : "div.box_slot p#carrier_meid + p")));

  var phone = {
    MODEL : '',
    DISPATCH : 0,
    SERIAL : 0,
    PLACE : '',
    ADDRESS : '',
    COLOR : '',
    NOTE : '',
    SCREEN : {
      PN : '',
      SN : '',
      RN : ''      
    },
    STARTED : null,
    ENDED : null,
    TOTAL : null
  }

  phone.DISPATCH = dispatch;
  
  phoneModel.getInnerHtml().then(function(html){
    phone.MODEL = html;
    console.log("MODEL: " + phone.MODEL);
  });

  phoneSerial.getInnerHtml().then(function(html){
    html = html.replace(/<strong>([A-Za-z])\w+[\s#]+<[/]strong>/g, '');
    phone.SERIAL = html;
    console.log("DISPATCH: " + phone.DISPATCH);
    console.log("SERIAL: " + phone.SERIAL);
  });

  shipToAddress.getInnerHtml().then(function(html){
    var addressString = html.match(/\d+[ ](?:[A-Za-z0-9.-]+[ ]?)+(?:|Avenue|Lane|Road|Boulevard|Drive|Street|AVE|Dr|Rd|Blvd|Ln|St)\.?/);
    phone.ADDRESS = (addressString.length > 0 ? addressString[0] : "No Address Found");
    
    if(addressString.length > 0){
      switch(phone.ADDRESS){
        case "340 University Avenue": 
          phone.PLACE = "APPLE STORE PALO ALTO";
          break;
        case "183 Stanford Shopping Center":
          phone.PLACE = "APPLE STORE STANFORD";
          break;
        case  "2421 BROADWAY ST":
          phone.PLACE = "MOBILE KANGAROO REDWOOD CITY"
          break;
        case "100 W EL CAMINO REAL":
          phone.PLACE = "MOBILE KANGAROO MOUNTAIN VIEW";
        case "52 N SANTA CRUZ AVE":
          phone.PLACE = "CLICKAWAY LOS GATOS"
          break;
        default:
          phone.PLACE = "WE DON'T HAVE THIS ADDRESS ON RECORD, GET IT";
          break;
      }
      console.log("SHIP TO: " + phone.PLACE + "\n     " + phone.ADDRESS);
    }
  });

  color.getInnerHtml().then(function(html){
    var gray = new RegExp("GRAY");
    var gold = new RegExp("GOLD");
    var silver = new RegExp("SILVER|SLVR");
    var white = new RegExp("WHT");
    var black = new RegExp("BLACK");
    
    if(gray.test(html)){
      phone.COLOR = "SPACE GRAY";
    }
    else if(gold.test(html)){
      phone.COLOR = "GOLD";
    }
    else if(silver.test(html)){
      phone.COLOR = "SILVER";
    }
    else if(white.test(html)){
      phone.COLOR = "WHITE";
    }
    else if(black.test(html)){
      phone.COLOR = "BLACK";
    }
    else{
      console.log("COLOR: WE HAVEN'T RECORDED THIS COLOR, GET IT " + html);
    }
    console.log(phone.COLOR);

    phone.SCREEN.PN = getScreenPartNumber(phone.MODEL, phone.COLOR);
  });

  console.log(phone);
}

function sendInPin(elements, numbers){
  var i;
  
  for (i=0; i < elements.length; i++){
    elements[i].sendKeys(numbers[i]);
    if(i==(elements.length-1)){
      mainDriver.findElement(By.name('setupLink')).click();
    }
  }
  
  var newUser = {
    userName : user,
    clockedInTime : new Date(),
    clockedOutTime : null,
    phones : []
  }
  
  db.remove({}, { multi: true }, function (err, numRemoved) {
    console.log("REMOVED " + numRemoved);
  });
  
  db.insert(newUser, function (err, newDoc) {   
    // Callback is optional
    // newDoc is the newly inserted document, including its _id
    // newDoc has no key called notToBeSaved since its value was undefined
    console.log("NEW DOC " + newDoc.userName + " " + newDoc.phones.length);
  });

  db.find({}, function (err, docs){
      console.log("FOUND DOC " + docs[0].userName);
  });
  
  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/app/home.html`);
  mainDriver.getTitle().then(function(title) {
    console.log(title);
  });
}

var checkForPopUpTimer = setInterval(checkForClosingPopUp, 180000);

function checkForClosingPopUp(){
  console.log("CHECKING FOR POPUP");
  if(loggedIn){
    //check for logout pop up
    //if(mainDriver.findElement(By.id()));  
  }
}

function getScreenPartNumber(model, color){
  switch(model){
    case "IPHONE 6":
        switch(color){
          case "SPACE GRAY":
            return phoneDB.IPhone6.SGRY.screen;
          case "SILVER":
            return phoneDB.IPhone6.SLVR.screen;
          case "GOLD":
            return phoneDB.IPhone6.GLD.screen;
          default:
            return "";
        }
    case "IPHONE 6 PLUS":
      switch(color){
          case "SPACE GRAY":
            return "661-00159";
          case "SILVER":
            return "661-00160";
          case "GOLD":
            return "661-00161";
          default:
            return "";
        }
    case "IPHONE 6S":
      switch(color){
          case "SPACE GRAY":
            return "661-03053";
          case "SILVER":
            return "661-03054";
          case "GOLD":
            return "661-03055";
          case "ROSE GOLD":
            return "661-03056";
          default:
            return "";
        }
    case "IPHONE 6S PLUS":
      switch(color){
          case "SPACE GRAY":
            return "661-02900";
          case "SILVER":
            return "661-02901";
          case "GOLD":
            return "661-02902";
          case "ROSE GOLD":
            return "661-02903";
          default:
            return "";
        }
    default:
      return "";
  }
}

function TitleCase(str){
  //cristian ponce -> Cristian Ponce
  return str.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
}