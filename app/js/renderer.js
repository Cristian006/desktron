// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer} = electron;


document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init(); 
    }
};

ipcRenderer.on('GSX-Login-Reply', (event, arg) => {
    console.log(arg); // prints "pong"
    openPinDialog();
});

//WebPage Set Up
function init() {
    console.log("IN IT - RENDER PROCESS");

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

    document.getElementById("loginButton").addEventListener("click", function(e){
        login();
    })
};

//GSX Functions
function login() {
    var userName = document.getElementById('user-name').value;
    var userPass = document.getElementById('user-password').value;
    if(userName != "" && userPass != "")
    {
        console.log("logging in the renderer process");
        document.getElementById("loginSection").style.display = 'none';
        document.getElementById("loadingSpinner").style.display = 'block';
        ipcRenderer.send('GSX-Login-Message', userName, userPass); // prints "pong"
    }
}

function openPinDialog(){
    var dialog = document.getElementById("Pin-PopUp");
    dialog.style.display = "block";
}