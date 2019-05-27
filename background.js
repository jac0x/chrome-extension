// script to be executed on extension level
var requestedObject;

// Listening to messages page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	this.console.log("chrome.runtime.onMessage background");
	this.console.log(request);

	requestedObject = request;
	
    chrome.contextMenus.removeAll(function() {
		var parent = chrome.contextMenus.create({
			"id": "clcContextMenu",
			"title": "TCLC Autofill - " + requestedObject.bank + " - " + requestedObject.product
		});

		for (var key in requestedObject.mapping) {
			if (requestedObject.mapping.hasOwnProperty(key)) {
				var child1 = chrome.contextMenus.create({
					"id": key,
					"title": requestedObject.mapping[key].name, 
					"parentId": parent
				});
			}
		}
	});
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	this.console.log("chrome.contextMenus.onClicked");
	this.console.log(requestedObject);

	chrome.tabs.sendMessage(
		tab.id, 
		JSON.stringify({
			destPageId: info.menuItemId,
			requestInfo: requestedObject
		})
	);
});
