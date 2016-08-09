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

//OPEN PIN MODAL
ipcRenderer.on('GSX-Login-Reply', (event, user) => {
    console.log(user); // prints user name
    openPinModal();
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
    });

    document.getElementById("pinButton").addEventListener("click", function (e) {
        sendKeysToPinModal();
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
        ipcRenderer.send('GSX-Login-Message', userName, userPass);
    }
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
    ipcRenderer.send('GSX-Pin-Message', numbers);
}