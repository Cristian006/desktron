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
class Person {
  constructor(){
    this._name = "";
    this._phones = [];
    this._clockInTime;
    this._clockOutTime;
    this._position = "";
  }
}

class Phone{
  constructor(dispatch){
    this._dispatch = dispatch;
    this._serial = 0;
    this._timeStarted = new Date();
    this._timeEnded;
    this._repairTech = user;
  }

  Repaired(){
    this._timeEnded = new Date();
  }

  getTotalTime(){
    return (this._timeStarted - this._timeEnded);
  }
}

const webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();

var mainDriver = null;
var loggedIn = false;
var user = '';

var USER = new Person();

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

ipcMain.on('GSX-Pin-Message', (event, pinNumbers) => {
  mainDriver.findElements(By.className("digit-input")).then(elements => sendInPin(elements, pinNumbers));
});

function sendInPin(elements, numbers){
  var i;
  for (i=0; i < elements.length; i++){
    elements[i].sendKeys(numbers[i]);
    if(i==(elements.length-1)){
      mainDriver.findElement(By.name('setupLink')).click();
    }
  }

  var doc = {
    userName : user,
    clockedInTime : new Date(),
    clockedOutTime : null,
    phones : []
  }

  db.remove({}, { multi: true }, function (err, numRemoved) {
    console.log("REMOVED " + numRemoved);
  });

  db.insert(doc, function (err, newDoc) {   
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
  }
}

function TitleCase(str){
  //cristian ponce -> Cristian Ponce
  return str.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
}