// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer} = electron;
var loggingIn = false;
function init() {
    if(loggingIn){
        document.getElementById("loginSection").style.display = 'none';
        document.getElementById("loadingSpinner").style.display = 'block';
    }
    else{
        document.getElementById("loginSection").style.display = 'block';
        document.getElementById("loadingSpinner").style.display = 'none';
    }

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

    document.getElementById("loginButton").addEventListener("click", function (e){
        loggingIn = true;
        console.log("logging in the renderer process");
        document.getElementById("loginSection").style.display = 'none';
        document.getElementById("loadingSpinner").style.display = 'block';
        ipcRenderer.send('GSX-Login-Message', 'logging into GSX'); // prints "pong"   
    });
};

ipcRenderer.on('GSX-Login-Reply', (event, arg) => {
    console.log("We succesfully logged in using the correct credentials");
    console.log(arg); // prints "pong"
});

document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init(); 
    }
};