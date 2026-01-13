{
	"info": {
		"_postman_id": "5eaa586e-23c5-46ec-9301-6f8915c4e837",
		"name": "3MarkApex",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "29972505"
	},
	"item": [
		{
			"name": "SmartOffice API Sandbox",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "sitename",
						"value": "PREPRODNEW",
						"description": "Please add the site name provided by the SmartOffice team in the value field.",
						"type": "default"
					},
					{
						"key": "username",
						"value": "PREPRODNEW_SDC_UAT_tdaniel",
						"description": "Please add the user name provided by the SmartOffice team in the value field .",
						"type": "default"
					},
					{
						"key": "api-key",
						"value": "",
						"description": "Please add the API Key provided by the SmartOffice team in the value field.",
						"type": "default"
					},
					{
						"key": "api-secret",
						"value": "",
						"description": "Please add the API Secret provided by the SmartOffice team in the value field.",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "<request version=\"1.0\">\r\n    <header>\r\n        <office></office>\r\n        <user></user>\r\n        <password></password>\r\n    </header>\r\n    <search>\r\n        <object>\r\n            <Contact>\r\n                <LastName/>\r\n                <FirstName/>\r\n            </Contact>\r\n        </object>\r\n        <condition>\r\n            <expr prop='LastName' op='starts'>\r\n                <v>A</v>\r\n            </expr>\r\n        </condition>\r\n    </search>\r\n</request>",
					"options": {
						"raw": {
							"language": "xml"
						}
					}
				},
				"url": {
					"raw": "https://api.sandbox.smartofficecrm.com/3markapex/v1/send",
					"protocol": "https",
					"host": [
						"api",
						"sandbox",
						"smartofficecrm",
						"com"
					],
					"path": [
						"3markapex",
						"v1",
						"send"
					]
				}
			},
			"response": []
		}
	]
}