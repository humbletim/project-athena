//
//  inventory.js
//
//  Created by kasenvr@gmail.com on 2 Apr 2020
//  Copyright 2020 Vircadia and contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function () { // BEGIN LOCAL_SCOPE
var AppUi = Script.require('appUi');
var ui;
var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

// VARIABLES
var inventoryDataSettingString = "inventoryApp.data";
var inventoryData;

var inventorySettingsString = "inventoryApp.settings";
var inventorySettings;

var RECEIVING_ITEM_QUEUE_LIMIT = 5;
var receivingItemQueue = [];

// APP EVENT AND MESSAGING ROUTING

function onWebAppEventReceived(event) {
    var eventJSON = JSON.parse(event);
    if (eventJSON.app == "inventory") { // This is our web app!
        // print("inventory.js received a web event: " + event);
        
        if (eventJSON.command == "ready") {
            initializeInventoryApp();
        }
        
        if (eventJSON.command == "web-to-script-inventory") {
            receiveInventory(eventJSON.data);
        }
        
        if (eventJSON.command == "web-to-script-settings") {
            receiveSettings(eventJSON.data);
        }
        
        if (eventJSON.command == "use-item") {
            useItem(eventJSON.data);
        }
        
        if (eventJSON.command == "share-item") {
            shareItem(eventJSON.data);
        }
        
        if (eventJSON.command == "web-to-script-request-nearby-users") {
            sendNearbyUsers();
        }
        
        if (eventJSON.command == "web-to-script-request-receiving-item-queue") {
            sendReceivingItemQueue();
        }
        
        if (eventJSON.command == "web-to-script-update-receiving-item-queue") {
            updateReceivingItemQueue(eventJSON.data);
        }
        
    }
}

tablet.webEventReceived.connect(onWebAppEventReceived);

function sendToWeb(command, data) {
    var dataToSend = {
        "app": "inventory",
        "command": command,
        "data": data
    }
    
    tablet.emitScriptEvent(JSON.stringify(dataToSend));
}

var inventoryMessagesChannel = "com.vircadia.inventory";

function onMessageReceived(channel, message, sender, localOnly) {
    if (channel == inventoryMessagesChannel) {
        var messageJSON = JSON.parse(message);
        // Window.alert("Passed 0 " + messageJSON.recipient + " vs " + MyAvatar.sessionUUID);
        if (messageJSON.command == "share-item" && messageJSON.recipient == MyAvatar.sessionUUID) { // We are receiving an item.
            // Window.alert("Passed 1 " + messageJSON.recipient + " vs " + MyAvatar.sessionUUID);
            pushReceivedItemToQueue(sender, AvatarList.getAvatar(sender).displayName, messageJSON.type, messageJSON.name, messageJSON.url);
        } 
    }
    // print("Message received:");
    // print("- channel: " + channel);
    // print("- message: " + message);
    // print("- sender: " + sender);
    // print("- localOnly: " + localOnly);
}

function sendMessage(dataToSend) {
    Messages.sendMessage(inventoryMessagesChannel, JSON.stringify(dataToSend));
}

// END APP EVENT AND MESSAGING ROUTING

// SEND AND RECEIVE INVENTORY STATE

function receiveInventory(receivedInventoryData) {
    inventoryData = receivedInventoryData;
    saveInventory();
}

function sendInventory() {
    sendToWeb("script-to-web-inventory", inventoryData);
}

// END SEND AND RECEIVE INVENTORY STATE

// SEND AND RECEIVE SETTINGS STATE

function receiveSettings(receivedSettingsData) {
    inventorySettings = receivedSettingsData;
    saveSettings();
}

function sendSettings() {
    sendToWeb("script-to-web-settings", inventorySettings);
}

// END SEND AND RECEIVE SETTINGS STATE

function saveInventory() {
    Settings.setValue(inventoryDataSettingString, inventoryData);
}

function loadInventory() {
    inventoryData = Settings.getValue(inventoryDataSettingString);
}

function saveSettings() {
    Settings.setValue(inventorySettingsString, inventorySettings);
}

function loadSettings() {
    inventorySettings = Settings.getValue(inventorySettingsString);
}

function pushReceivedItemToQueue(senderUUID, senderName, type, name, url) {
    var packageRequest = {
        "senderUUID": senderUUID,
        "senderName": senderName,
        "data": {
            "type": type,
            "name": name,
            "url": url
        }
    }
    
    if (receivingItemQueue.length === RECEIVING_ITEM_QUEUE_LIMIT) {
        receivingItemQueue = receivingItemQueue.slice(1, 5);
    }
    
    receivingItemQueue.push(packageRequest);
}

function sendReceivingItemQueue() {
    sendToWeb("script-to-web-receiving-item-queue", receivingItemQueue);
}

function updateReceivingItemQueue(data) {
    receivingItemQueue = data;
}

function sendNearbyUsers() {
    var nearbyUsers = AvatarList.getAvatarsInRange(MyAvatar.position, 25); // Find all users within 25m.
    var nearbyUsersToSend = [];
    
    nearbyUsers.forEach(function(user, i) {
        var objectToWrite;
        var aviName = AvatarList.getAvatar(user).displayName;
        // Window.alert("aviName" + aviName + "user" + user + "MyAvatar.sessionUUID" + MyAvatar.sessionUUID);
        if (user != MyAvatar.sessionUUID) { // Don't add ourselves to the list!
            objectToWrite = { "name": aviName, "uuid": user };
            nearbyUsersToSend.push(objectToWrite);
        }        
    });

    sendToWeb("script-to-web-nearby-users", nearbyUsersToSend);
}

function useItem(item) {
    
    //TODO: Add animation support for avatars...?
    
    // Convert the item.type before checking it...
    item.type = item.type.toUpperCase();
    
    // Depending on the type, we decide how to load this item.
    if (item.type == "SCRIPT") {
        ScriptDiscoveryService.loadScript(item.url, true, false, false, true, false); // See SDS.loadScript in APIDocs for more.
    }
    
    if (item.type == "MODEL") {
        var entityID = Entities.addEntity({
            type: "Model",
            position: Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 0, z: -1.5 })),
            rotation: MyAvatar.orientation,
            modelURL: item.url,
            collisionless: true,
        });
    }
    
    if (item.type == "AVATAR") {
        MyAvatar.useFullAvatarURL(item.url);
    }
    
    if (item.type == "PLACE") {
        location.handleLookupString(item.url, true); // https://apidocs.vircadia.dev/location.html#.handleLookupString
    }
    
    if (item.type == "JSON") {
        // https://apidocs.vircadia.dev/Clipboard.html#.importEntities
        var jsonToLoad = item.url;
        if (jsonToLoad) {
            if (Clipboard.importEntities(jsonToLoad)) {
                Clipboard.pasteEntities(
                    Vec3.sum(
                        MyAvatar.position,
                        Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 0, z: -1.5 })
                    )
                );
            }
        }
    }
    
    if (item.type == "UNKNOWN") {
        // We don't know how to handle this yet.
        Window.alert("Unknown item type, unable to use.");
    }
}

function shareItem(data) {
    data.command = "share-item";
    sendMessage(data);
}

function initializeInventoryApp() {
    sendSettings();
    sendInventory();
    sendReceivingItemQueue();
}

function onOpened() {
    console.log("hello world!");
}

function onClosed() {
    console.log("hello world!");
}

function startup() {
    
    loadInventory();
    loadSettings();
    
    Messages.messageReceived.connect(onMessageReceived);
    Messages.subscribe(inventoryMessagesChannel);
    
    ui = new AppUi({
        buttonName: "INVENTORY",
        home: Script.resolvePath("index.html"),
        graphicsDirectory: Script.resolvePath("./"), // Where your button icons are located
        onOpened: onOpened,
        onClosed: onClosed
    });
}
startup();

Script.scriptEnding.connect(function () {
    Messages.messageReceived.disconnect(onMessageReceived);
    Messages.unsubscribe(inventoryMessagesChannel);
});

}()); // END LOCAL_SCOPE