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
const appFavIcon = "app/images/lightbulb/lightbulb.png";
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
var phoneModels = ["[Ii]Phone 6$", "[Ii]Phone 6 Plus$", "[Ii]Phone 6S$", "[Ii]Phone6S Plus$"];
var phoneColors = ["SPACE GRAY", "SILVER", "GOLD", "ROSE GOLD"];
var screenPartNumbers = ["661-00141","661-00142","661-00143","661-00159","661-00160","661-00161","661-03053","661-03054","661-03055","661-03056","661-02900","661-02901","661-02902","661-02903"];
var screwPartNumbers = ["661-00135, 661-00136, 661-00137", "661-00235, 661-00236, 661-00237", "661-00335, 661-00336, 661-00337", "661-00435, 661-00436, 661-00437"];

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

ipcMain.on('startRepair', (event, dispatch) => {
  updateUSERFromDB();
  startRepair(event, dispatch);
});

function startRepair(event, dis){
  var searchBar;
  console.log("STARTING REPAIR " + dis + " -----------------------------");
  mainDriver.get("https://gsxapp.apple.com/WebApp/home.htm");
  mainDriver.sleep(1000);    	
  searchBar = getSearchBar();
  searchBar.sendKeys(dis);
  searchBar.sendKeys(webdriver.Key.RETURN);

  mainDriver.sleep(4000);

  getPhoneInfo(event, dis);
}

function updateUSERFromDB(){
    db.find({}, function (err, docs){
        console.log("FOUND DOC IN UPDATE USER FORM DB: " + docs[0].name);
        USER.name = docs[0].name;
        USER.clockin = docs[0].clockin;
        USER.clockout = docs[0].clockout;
        USER.phones = docs[0].phones;
        console.log("PHONES: " + USER.phones.length);
    });
}

function updateUSERInDB(){
    db.update({ name: USER.name }, USER, {}, function (err, numReplaced) {
          console.log("UPDATED " + numReplaced + " USER(s).");
    });
}


function getSearchBar(){
  return mainDriver.findElement(By.id("search_GSX_input"));
}

//TODO: when logging in check to see if we can find a doc with their user name already in the database
//if so use that one if not create a new one. so we can close the program re open it and it would save everything for the day

//send in pin number to modal dialog to login
//get dispatch as a string
function getPhoneInfo(event, dispatch) {
  var dispatchRE = new RegExp("[Rr]")
  var phoneModel = mainDriver.findElement(By.css("h3.swappable-text.model"));
  var phoneSerial = mainDriver.findElement(By.css("p#tester"));
  var shipToAddress = mainDriver.findElement(By.css("div#shipToAddress.box_slot div.slot_details"))
  var color = mainDriver.findElement(By.css((dispatchRE.test(dispatch) ? "div.box_slot p#tester + p" : "div.box_slot p#carrier_meid + p")));

  var phone = new Phone();
  phone.dispatch = dispatch;
  
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
    phone.screws = getScrewPartNumbers(phone.model);
    console.log("screen pn#: " + phone.screen.pn);
    console.log("screws pn#: " + phone.screws);
    USER.phones.push(phone);
    db.update({ name: USER.name }, USER, {}, function (err, numReplaced) {
          console.log("UPDATED " + USER.name + " " + numReplaced + " USER(s).");
          console.log("CALLING PHONE INFO");
          event.sender.send('Phone-Info');
    });
  });
}

var checkForPopUpTimer = setInterval(checkForClosingPopUp, 180000);

function checkForClosingPopUp(){
  console.log("CHECKING FOR POPUP");
  /*if(loggedIn){
    //check for logout pop up
    //if(mainDriver.findElement(By.id()));  
  }*/
}

function getScrewPartNumbers(model){
  var re, i;
  for(i = 0; i < phoneModels.length; i++){
    re = new RegExp(phoneModels[i]);
    if(re.test(model)){
      return screwPartNumbers[i];
    }
  }
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

function getIndexForScreenPartNumber(i, j){
  return ((i==1) ? (i*j) : (i==2) ? ((i*j) + 1) : (i==3) ? ((i*2)+j) : ((i*2)+j+2));
}

function TitleCase(str){
  //cristian ponce -> Cristian Ponce
  return str.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
}