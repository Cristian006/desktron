const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer} = electron;

document.onreadystatechange = function () {
    if (document.readyState == "complete") {
    console.log("IN IT - RENDER PROCESS asdlkfhals");
        init(); 
    }
};

//WebPage Set Up
function init() {
    console.log("IN IT - HOME RENDERER PROCESS");
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
};

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