// script to be executed on page level

function getElementByXpath(path) {
	if (path == null || typeof(path) == 'undefined' || path.trim() == '') {
		return null;
	}

	return document.evaluate(
		path.trim(),
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE, null
	).singleNodeValue;
}

function handleRadioField(fieldMeta, fieldValue) {
	if (!(fieldValue != null && typeof(fieldValue) != "undefined" && fieldValue != ""))
		fieldValue = "";
	{
		for (i in fieldMeta.values_map) {
			if (fieldMeta.values_map[i].data_value == null || typeof(fieldMeta.values_map[i].data_value) == 'undefined') {
				fieldMeta.values_map[i].data_value = '';
			}

			if (fieldMeta.values_map[i].data_value.toLowerCase() == fieldValue.toLowerCase()) {
				var radioElement = getElementByXpath(fieldMeta.values_map[i].xpath);
				if (radioElement != null) {
					radioElement.click();
				}

				var radioClickElement = getElementByXpath(fieldMeta.values_map[i].click_xpath);
				if (radioClickElement != null) {
					radioClickElement.click();
				}

				break;
			}
			else{
				var radioElement = getElementByXpath(fieldMeta.values_map[i].xpath);
				if (radioElement != null && radioElement.value != null && typeof(radioElement.value) != 'undefined' && radioElement.value.toLowerCase() == fieldValue.toLowerCase()) {
					radioElement.click();
				}

				var radioClickElement = getElementByXpath(fieldMeta.values_map[i].click_xpath);
				if (radioClickElement != null && radioClickElement.value != null && typeof(radioClickElement.value) != 'undefined' && radioClickElement.value.toLowerCase() == fieldValue.toLowerCase()) {
					radioClickElement.click();
				}
			}
		}
	}
}

function handleFormField(fieldMeta, fieldValue) {
	if (fieldMeta.type == 'Radio') {
		handleRadioField(fieldMeta, fieldValue);
		return;
	}

	var fieldElement = getElementByXpath(fieldMeta.xpath);
	console.log(fieldElement);
	if (fieldElement == null) {
		return;
	}

	if (fieldValue != null && typeof(fieldValue) != "undefined" && fieldValue != "") {
		switch(fieldMeta.type){
			case 'Dropdown':
				var selectedValue = '';
				for (i in fieldMeta.values_map) {
					if (fieldMeta.values_map[i].data_value == null || typeof(fieldMeta.values_map[i].data_value) == 'undefined') {
						fieldMeta.values_map[i].data_value = '';
					}

					if (fieldMeta.values_map[i].data_value.toLowerCase() == fieldValue.toLowerCase()) {
						selectedValue = fieldMeta.values_map[i].form_value;

						break;
					}
				}
				
				for (i in fieldElement.options) {
					if (fieldElement.options[i].value == selectedValue) {
						fieldElement.selectedIndex = i;
						fieldElement.options[i].selected = true;

						break;
					}
				}
			break;
			case 'Date':
				//var date = new Date(fieldValue);
				fieldElement.value = fieldValue;
			break;
			case 'Checkbox':
				var clickElement = getElementByXpath(fieldMeta.click_xpath);
				if (fieldValue.toLowerCase() == 'true') {
					if (!fieldElement.checked) {
						if (clickElement != null) {
							clickElement.click();
						} else {
							fieldElement.click();
						}
					}
				} else {
					if (fieldElement.checked) {
						if (clickElement != null) {
							clickElement.click();
						} else {
							fieldElement.click();
						}
					}
				}
			break;
			default:
				fieldElement.value = fieldValue;
		}

		if (fieldMeta.data_field == 'DOB' && (fieldMeta.format == 'yyyy' || (fieldMeta.format == 'mm') || (fieldMeta.format == 'dd')))
		{
			var date = new Date(fieldValue);
			switch(fieldMeta.format){
			case 'yyyy':
				fieldElement.value = date.getFullYear();
				break;
			case 'mm':
				fieldElement.value = date.getMonth() + 1;
				break;
			case 'dd':
				fieldElement.value = date.getDate();
				break;
			}
		}
		
		if (fieldMeta.type != 'Checkbox') {
			var clickElement = getElementByXpath(fieldMeta.click_xpath);
			if (clickElement != null) {
				clickElement.click();
			}
		}
	}

	if (!fieldElement.disabled) {
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent("change", false, true);
		fieldElement.dispatchEvent(evt);
		
		evt = document.createEvent("HTMLEvents");
		evt.initEvent("blur", false, true);
		fieldElement.dispatchEvent(evt);
		
		evt = document.createEvent("HTMLEvents");
		evt.initEvent("keyup", false, true);
		fieldElement.dispatchEvent(evt);
		
		evt = document.createEvent("HTMLEvents");
		evt.initEvent("keydown", false, true);
		fieldElement.dispatchEvent(evt);
	}
}

function handleFormFilling(requestString) {
	var request= JSON.parse(requestString);
	var fields = request.requestInfo.mapping[request.destPageId]['fields'];

	for (i in fields) {
		var field = fields[i];

		var fieldValue = request.requestInfo.data[field.data_field];
		if (fieldValue != null && typeof(fieldValue) != "undefined") {
			fieldValue += "";
			fieldValue = fieldValue.trim();
		}
		console.log(field, fieldValue);
		handleFormField(field, fieldValue);
	}
	
}

chrome.runtime.onMessage.addListener(function(requestString, sender, sendResponse)    {
	console.log("chrome.runtime.onMessage content");

	handleFormFilling(requestString);
	
	// sometimes form does not fill up
	setTimeout(function() {
		handleFormFilling(requestString);
	}, 1000);
});


window.addEventListener("message", function(event) {
	console.log("content window message");
	// We only accept messages from this window to itself [i.e. not from any iframes]
	if (event.source != window) {
		return;
	}

	if (event.data.type && (event.data.type == "CLC_AUTOFILL")) { 
		var confirmationMsg = "You have requested to open application form for " + 
								event.data.requestData.product + " of " + event.data.requestData.bank + "\n" +
								"You will loose previous configuration (if any) \n" +
								"Do you want to continue?";
		
		if(confirm(confirmationMsg)){
			this.console.log("confirmed");
			this.console.log(event.data.requestData);
			chrome.runtime.sendMessage(event.data.requestData);
			//this.console.log("sent");
			setTimeout(function(){
				//chrome.runtime.sendMessage(event.data.requestData);
				var formWindow = window.open(event.data.requestData.url);
			}, 500);
		}
	}
}, false);
