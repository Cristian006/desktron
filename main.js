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
  
  getPhoneInfo();
});

function getSearchBar(){
  return mainDriver.findElement(By.id("search_GSX_input"));
}

//TODO: when logging in check to see if we can find a doc with their user name already in the database
//if so use that one if not create a new one. so we can close the program re open it and it would save everything for the day

//send in pin number to modal dialog to login
function getPhoneInfo() {
  var phoneModel = mainDriver.findElement(By.css("h3.swappable-text.model"));
  
  phoneModel.getInnerHtml().then(function(html){
    console.log(html);
  });
  /*.then(modelText => function(){
    phoneModel = getPhoneModel(modelText[0])
    phoneModel.getText().then(text => console.log(text));
  });*/
}

function getPhoneModel(div) {
  var p;
  div.getText().then(text => function(text){
    p = text
    console.log("THE MODEL OF THIS PHONE IS" + p);
    return p;
  });
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

function TitleCase(str){
  //cristian ponce -> Cristian Ponce
  return str.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
}