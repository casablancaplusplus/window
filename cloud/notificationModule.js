var appId = "30fb777b-5219-4919-bd01-29cfa4583a79";

module.exports = {
	sendNotification : function(params) {
		params.app_id = appId;
		Parse.Cloud.httpRequest({
			method: "POST",
			url: "https://onesignal.com/api/v1/notifications",
			headers: {
				"Content-Type":"application/json;charset=utf-8",
				"Authorization":"Basic NTZjZTVlNzItODY3Ni00YjFjLWJmMjYtMjdhZTMyZmM1Nzdk",
			},
			body: JSON.stringify(params)
		}).then(function(httpResponse) {
			console.log("notification 200: " + httpResponse);
		}, function(httpResponse) {
			console.log("notification failed: " + JSON.stringify(httpResponse));
		});
	}
}
