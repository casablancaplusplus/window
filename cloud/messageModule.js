// TODO set the right permissions for users on the messages collection
var stringsModule = require('./stringsModule.js');
var notifier = require('./notificationModule.js');
var strings = stringsModule.getStrings();

module.exports = {
	sendAdminMsg: function(msgTitle, msgUrl, userIds, playerIds) {
		var MsgObject = Parse.Object.extend('messages');
		var msgObj = new MsgObject();
		msgObj.set('msg_type', 'admin_msg');
		msgObj.set('msg_title', msgTitle);
		msgObj.set('msg_url', msgUrl);
		msgObj.set('seen', false);
		msgObj.set('clicked', false);
		msgObj.set('user_array', userIds);
		msgObj.save({
			success: function(savedObj) {
				console.log("SENT Admin Message"); // TODO remove this line
				var params = {};
				params.include_player_ids = playerIds;
				params.contents = {en : strings.admin_message_subtitle};
				params.headings = {en : msgTitle};
				params.data = {notification_type : "admin_msg", url: msgUrl};
				notifier.sendNotification(params);
			}, error: function(error) {
				console.log(error);
			}
		});
	},
	sendExpirationMsg: function(title, user, adId) {
		var MsgObject = Parse.Object.extend("messages");
		var MsgObj = new MsgObject();
		MsgObj.set('msg_type', 'ad_status');
		MsgObj.set('ad_status', 'expired');
		MsgObj.set('adId', adId);
		MsgObj.set('user', user.id);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent expiration message to " + user.id);
				// TODO test this notification
				var params = {};
				params.include_player_ids = [user.get('onesignal_id')];
				params.contents = {en : strings.ad_expired_title};
				params.headings = {en : strings.ad_status_subtitle};
				params.data = {notification_type : "ad_status_change"};
				notifier.sendNotification(params);
			}, error: function(error) {
				console.log(error);
			}
		});
	},

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
				params.data = {notification_type : "ad_status_change"};
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
				params.data = {notification_type : "ad_status_change"};
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
		MsgObj.set('user', user.id);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent publishment message to " + user);
				// TODO test this notification
				var params = {};
				params.include_player_ids = [user.get('onesignal_id')];
				params.contents = {en : strings.ad_status_subtitle};
				params.headings = {en : strings.ad_published_title};
				params.data = {notification_type : "ad_status_change"};
				notifier.sendNotification(params);
			}, error: function(error) {
				console.log(error);
			}
		});
	}
	
	// TODO add Admin message type
}
