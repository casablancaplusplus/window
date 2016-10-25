// TODO set the right permissions for users on the messages collection

module.exports = {
	sendRejectionMsg: function(title, user, adId) {
		var MsgObject = Parse.Object.extend("messages");
		var MsgObj = new MsgObject();
		MsgObj.set('msg_type', 'ad_status');
		MsgObj.set('ad_status', 'rejected');
		MsgObj.set('adId', adId);
		MsgObj.set('user', user);
		MsgObj.set('ad_title', title);
		MsgObj.set('seen', false);
		MsgObj.set('clicked', false);
		MsgObj.save(null, {
			success: function(savedAd) {
				console.log("sent rejection message to " + user);
				// TODO send notification to tuser
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
