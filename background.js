///Options
//Get options when run
let loggingStyle;

chrome.storage.local.get(
    { loggingStyle: 'prettier' },
    (items) => {
        loggingStyle = items.loggingStyle;
    }
);

//Watch for option changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes) {
        loggingStyle = changes.loggingStyle.newValue;
    }
});

///GetCurrentTabg used by orchestrator functions
async function getCurrentTab(callback) {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    callback(tab);
}

///Debug Log
//Get current tab and perform debug log in it
const debugLogOrchestrator = () => {
    const callDebugLogInTab = (tab) => {
        chrome.scripting.executeScript({
            target : {tabId : tab.id},
            func : debugLog,
            args : [ loggingStyle ],
            world : 'MAIN'
        })
    }

    getCurrentTab(callDebugLogInTab);
};

//Listen for debug log
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "debugLog") debugLogOrchestrator();
    }
);

//Perform debugging log
const debugLog = (loggingStyle) => {
    let pageData = null;
    let cacheData = null;

    const logPageData = () => {
        let date = new Date(Date.now()).toLocaleTimeString();

        if (loggingStyle === 'prettier') {
            let mainGroupLabel = '%cUnqork Data Found (' + date + '):'
            let subGroupLabel = '%cSubmission Data'
            let cacheGroupLabel = '%cCache Data'
            const logStyling = 'color: cyan; font-weight: bold; background: rgb(40,40,40);';
            
            console.group(mainGroupLabel, logStyling);
            console.group(subGroupLabel, logStyling);
            console.log(pageData);
            console.groupEnd(subGroupLabel);

            if (cacheData != null && Object.keys(cacheData).length > 0) {
                console.group(cacheGroupLabel, logStyling);
                console.log(cacheData);
                console.groupEnd(cacheGroupLabel);
            }

            if (pageData.validationErrors.length > 0) {
                console.warn('Validation errors were found.');
            }

            if (Object.keys(pageData.integratorErrors).length > 0) {
                console.warn('Integration errors were found.');
            }

            console.groupEnd(mainGroupLabel);
        }
        else {
            console.log(pageData);
        }
    }

    //Verify what is available to log
    if (typeof angular != 'undefined') {
        try {
            if (typeof angular.element(document.body).injector().get("CacheService").cache != 'undefined') {
                cacheData = angular.element(document.body).injector().get("CacheService").cache
            }
        }
        catch {
            console.log('No unqork cache data found.');
        }

        try {
            if (typeof angular.element('.unqorkio-form').scope().submission != 'undefined') {
                pageData = angular.element('.unqorkio-form').scope().submission;
                logPageData();
            }
        }
        catch {
            console.log('No unqork page data found.');
        }        
    }
    else {
        console.log('No unqork page found.');
    }
}

///Update Data
//Get current tab and perform data update in it
const updateDataOrchestrator = (param, value) => {
    let callUpdateInTab = (tab) => {
        chrome.scripting.executeScript({
            target : {tabId : tab.id},
            func : updateData,
            args : [ param, value ],
            world : 'MAIN'
        })
    }

    getCurrentTab(callUpdateInTab);
};

//Listen for update data
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "updateData") updateDataOrchestrator(request.param, request.value);
    }
);

//Perform update data
const updateData = (param, value) => {
    if (typeof angular != 'undefined') {
        try {
            angular.element('.unqorkio-form').scope().submission.data[param] = value;

            let date = new Date(Date.now()).toLocaleTimeString();
            const logStyling = 'color: cyan; font-weight: bold; background: rgb(40,40,40);';
            let formattedValue;
            if (!value) {
                formattedValue = `""`;
            }
            else {
                formattedValue = value;
            }
            console.log('%cUnqork Data Updated (' + date + '): ' + param + " = " + formattedValue, logStyling);
        }
        catch {
            console.log("Could not update page data.");
        }
    }
}

///Delete Data
//Get current tab and perform data deltion in it
const deleteDataOrchestrator = (param) => {
    let callDeleteInTab = (tab) => {
        chrome.scripting.executeScript({
            target : {tabId : tab.id},
            func : deleteData,
            args : [ param ],
            world : 'MAIN'
        })
    }

    getCurrentTab(callDeleteInTab);
};

//Listen for delete data
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "deleteData") deleteDataOrchestrator(request.param);
    }
);

//Perform delete data
const deleteData = (param, value) => {
    if (typeof angular != 'undefined') {
        try {
            delete angular.element('.unqorkio-form').scope().submission.data[param];
            let date = new Date(Date.now()).toLocaleTimeString();
            const logStyling = 'color: cyan; font-weight: bold; background: rgb(40,40,40);';
            console.log('%cUnqork Data Removed (' + date + '): ' + param, logStyling);
        }
        catch {
            console.log("Could not remove page data.");
        }
    }
}

///Trigger Component
//Get current tab and perform debug log in it
const triggerComponentOrchestrator = (name) => {
    let callTriggerInTab = (tab) => {
        chrome.scripting.executeScript({
            target : {tabId : tab.id},
            func : triggerComponent,
            args : [ name ],
            world : 'MAIN'
        })
    }

    getCurrentTab(callTriggerInTab);
};

//Listen for update data
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.msg == "triggerComponent") triggerComponentOrchestrator(request.name);
    }
);

//Perform update data
const triggerComponent = (name) => {
    if (typeof angular != 'undefined') {
        try {
            components = [];
            UnqorkioUtils.eachComponent(
                [angular.element('.unqorkio-form').scope().form],
                componentInForm => components.push(componentInForm)
            );
            component = components.find(i => i.key === name)

            if (typeof component != 'undefined') {
                component.execute();
                let date = new Date(Date.now()).toLocaleTimeString();
                const logStyling = 'color: cyan; font-weight: bold; background: rgb(40,40,40);';
                console.log('%cUnqork Component Triggered (' + date + '): ' + name, logStyling);
            }
            else {
                console.log("Could not find component to trigger.");
            }
        }
        catch {
            console.log("Could not trigger component.");
        }
    }
}