const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;
// Module to create a native menu
const {Menu} = electron;
//Module to recieve calls from the renderer process
const {ipcMain} = electron;//require('electron');

// App Icon
const appFavIcon = "app/images/lightbulb/lightbulb.png"

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;

const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build(); 
chrome.setDefaultService(service);

ipcMain.on('GSX-Login-Message', (event, arg) => {
  console.log("logging in the main process");
  driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
  driver.get('https://gsx.apple.com/');
  driver.getTitle().then(function(title) {
    console.log(title);
    if(title.includes("Login")){
        //USERNAME
        var inputElementForUserID = driver.findElement(By.name('appleId'));
        inputElementForUserID.sendKeys('cristian.ponce@iqor.com');
        
        //PASSWORD
        var inputElementForUserPass = driver.findElement(By.name('accountPassword'));
        inputElementForUserPass.sendKeys('Ramonponce_97');
        
        inputElementForUserPass.submit();
    }
  });
  driver.getTitle().then(function(title) {
    event.sender.send('GSX-Login-Reply', 'REPLY');
    console.log(title);
  });

  driver.sleep(3000);
  console.log("before quit");
  driver.quit();
  win.reload(true);
  event.sender.send('GSX-Login-Reply', 'REPLY');
  
});