// TODO set the right permissions for users on the messages collection
var stringsModule = require('./stringsModule.js');
var notifier = require('./notificationModule.js');
var strings = stringsModule.getStrings();

module.exports = {
	sendWaitingMsg: function(title, user, adId) {
		var MsgObject = Parse.Object.extend("messages");
		var MsgObj = new MsgObject();
		MsgObj.set('msg_type', 'ad_status');
		MsgObj.set('ad_status', 'waiting');
		MsgObj.set('adId', adId);
		MsgObj.set('user', user.id);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent waiting message to " + user.id);
				// TODO test this notification
				var params = {};
				params.include_player_ids = [user.get('onesignal_id')];
				params.contents = {en : strings.ad_submitted_subtitle};
				params.headings = {en : strings.ad_submitted_title};
				notifier.sendNotification(params);
			}, error: function(error) {
				console.log(error);
			}
		});
	},

	sendRejectionMsg: function(title, user, adId) {
		var MsgObject = Parse.Object.extend("messages");
		var MsgObj = new MsgObject();
		MsgObj.set('msg_type', 'ad_status');
		MsgObj.set('ad_status', 'rejected');
		MsgObj.set('adId', adId);
		MsgObj.set('user', user.id);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent rejection message to " + user);
				// TODO test this notification
				var params = {};
				params.include_player_ids = [user.get('onesignal_id')];
				params.contents = {en : strings.ad_status_subtitle};
				params.headings = {en : strings.ad_rejected_title};
				notifier.sendNotification(params);
			}, error: function(error) {
				console.log(error);
			}
		});
	},

	sendPublishmentMsg: function(title, user, adId) {
		var MsgObject = Parse.Object.extend("messages");
		var MsgObj = new MsgObject();
		MsgObj.set('msg_type', 'ad_status');
		MsgObj.set('ad_status', 'published');
		MsgObj.set('adId', adId);
		MsgObj.set('user', user);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent publishment message to " + user);
				// TODO send notification to tuser
			}, error: function(error) {
				console.log(error);
			}
		});
	}
	
	// TODO add Admin message type
}
