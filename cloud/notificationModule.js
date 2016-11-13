var stringsModule = require('./stringsModule.js');

var strings = stringsModule.getStrings();
var appId = "8bcee91d-cac0-4c7b-bd14-8795dc0f678e";

/**
 * by bulk notification we mean the notification that will be sent to the 
 * users that have subscribed to the specific category and city
 */
var bulkIds = []; // the players that will recieve the bulk notification 
var bulkHeading = ""; // the title of the bulk notification 
var bulkContent = ""; // the content of the bulk notification 
var objectId = "";
module.exports = {
	sendNotification : function(params) {
		params.app_id = appId;
		Parse.Cloud.httpRequest({
			method: "POST",
			url: "https://onesignal.com/api/v1/notifications",
			headers: {
				"Content-Type":"application/json;charset=utf-8",
				"Authorization":"Basic YzFlOWNhOTEtN2NiNC00YzgwLTgwZDAtMDFkNDEwNjhkZWU2",
			},
			body: JSON.stringify(params)
		}).then(function(httpResponse) {
			console.log("notification 200: " + httpResponse);
		}, function(httpResponse) {
			console.log("notification failed: " + JSON.stringify(httpResponse));
		});
	},
	sendBulkNotification: function() {
		var params = {};
		params.app_id = appId;
		params.include_player_ids = bulkIds;
		console.log("BULK IDS : " + bulkIds + bulkHeading); // TODO remove this
		params.contents = {en : bulkContent};
		params.headings = {en : bulkHeading};
		params.data = {notification_type : "new_published_ad", object_id : objectId};
		this.sendNotification(params);
	},
	prepareBulkNotification : function(ad) {
		bulkIds = [];
		bulkHeading = "";
		bulkContent = "";
		objectId = ad.id;
		// fetch the users subscribed the category and city
		var q = new Parse.Query('User');
		q.select("onesignal_id");
		q.equalTo("subscribed_cats", ad.get('category_name'));
		q.equalTo("subscribed_cities", ad.get('city_name'));
		return q.find().then(function(results) {

			console.log("RESULT LENGTH: " + results.length); // TODO remove this
				for(var i = 0; i < results.length; i++) {
					bulkIds.push(results[i].get('onesignal_id'));
				}
				console.log("BULK IDS: " + bulkIds); // TODO remove this
				// heading
				bulkHeading += strings.ad;
				bulkHeading += ' ';
				bulkHeading += ad.get('type_name');
				bulkHeading += ' ';
				bulkHeading += strings.new_;

				// content
				bulkContent += strings.in_;
				bulkContent += ' ';
				bulkContent += strings.zamineye;
				bulkContent += ' ';
				bulkContent += ad.get('category_name');
				bulkContent += ' ';
				bulkContent += strings.in_;
				bulkContent += ' ';
				bulkContent += strings.city;
				bulkContent += ' ';
				bulkContent += ad.get('city_name');
				bulkContent += ' ';
				bulkContent += strings.was_published;

			console.log("promise did resolve"); // TODO remove

			return "resolved";

		}, function(error) {
			return error;
		});
	}
}

