// TODO this is important: the user should be able to submit two ads with the same category but in different cities

var messager = require('./messageModule.js');
var notifier = require('./notificationModule.js');
var stringModule = require('./stringsModule.js');
var websiteModule = require('./websiteModule.js');

var strings = stringModule.getStrings();


/**
* this function submits a new ad after
* validating the request parameters 
* and making sure that the user does not
* have a waiting or published ad in the supplied category
* 
**/
Parse.Cloud.define('submit_new_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// does the user have an active published ad in this category ?
		var categoryName = req.params.category_name;
		var pubedAdQuery = new Parse.Query("published_ads");
		pubedAdQuery.equalTo("user", user.id);
		pubedAdQuery.equalTo("category_name", categoryName);
		// ads younger than one month are active
		// create a one month old Date object
		var nowMillis = Date.now();
		var millisInMonth = 2678400000; // 31 day month
		var monthOldMillis = nowMillis - millisInMonth;
		var monthOldDate = new Date(monthOldMillis); // this date is one month old
		pubedAdQuery.greaterThan("createdAt", monthOldDate);
		console.log("now millis: " + nowMillis);
		console.log("31 day month: " + millisInMonth);
		console.log("monthOldDate: " + monthOldDate);
		pubedAdQuery.count({
			success: function(count) {
				if(count > 0) {
					// show the user a dialog with the right message
					// error 1001: you already have a published ad in this category
					res.error(1001);
				} else {
					// does the user have a new ad in this category that is waiting ?
					var newAdQuery = new Parse.Query("new_ad");
					newAdQuery.equalTo("user", user.id);
					newAdQuery.equalTo("category_name", categoryName);
					newAdQuery.equalTo("ad_status", "waiting");
					newAdQuery.count({
						success: function(count) {
							if(count > 0) {
								// show the user a proper dialog
								// error 1002: you already have a waiting ad in this category
								res.error(1002);
							} else {
								// create the object
								var adObject = Parse.Object.extend("new_ad");
								var adObj = new adObject();
								adObj.set('user', user.id);
								adObj.set('virtual_created_at', Date.now());
								adObj.set('ad_status', 'waiting');
								adObj.set('type_name', req.params.type_name);
								adObj.set('category_name', req.params.category_name);
								adObj.set('place_name', req.params.place_name);
								adObj.set('city_name', req.params.city_name);
								adObj.set('image_name', req.params.image_name);
								adObj.set('title', req.params.title);
								adObj.set('is_urgent', req.params.is_urgent);
								adObj.set('phone', req.params.phone);
								adObj.set('email', req.params.email);
								adObj.set('website', req.params.website);
								adObj.set('desc', req.params.desc);
								adObj.save(null, {
									success: function(savedAd) {
										res.success(200);
										messager.sendWaitingMsg(
											savedAd.get('title'),
											req.user,
											savedAd.id);

									}, error: function(error) {
										res.error(error);
									}
								})

							}
						},
						error: function(error) {
							res.error(error);
						}
					})
				}

			},
			error: function(error) {
				res.error(error);
			}
		})

	}
	
});

/**
 * this function removes the already rejected ad from the new_ad collection
 * and then submits the edited version in the new_ad collection
 *
 */
Parse.Cloud.define('submit_edited_new_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// remove the rejected ad from the new_ad table
		var rejectedAdQ = new Parse.Query('new_ad');
		rejectedAdQ.get(req.params.ad_id, {
			success: function(rejectedAd) {
				// does the ad belong to the user requesting this operation ? if yes do it, otherwise, give error
				if(req.user.id == rejectedAd.get('user')) {
				// destroy the ad
				rejectedAd.destroy({
					success: function() {
						// submit the new ad
						var adObject = Parse.Object.extend("new_ad");
						var adObj = new adObject();
						adObj.set('user', user.id);
						adObj.set('virtual_created_at', Date.now());
						adObj.set('ad_status', 'waiting');
						adObj.set('type_name', req.params.type_name);
						adObj.set('category_name', req.params.category_name);
						adObj.set('place_name', req.params.place_name);
						adObj.set('city_name', req.params.city_name);
						adObj.set('image_name', req.params.image_name);
						adObj.set('title', req.params.title);
						adObj.set('is_urgent', req.params.is_urgent);
						adObj.set('phone', req.params.phone);
						adObj.set('email', req.params.email);
						adObj.set('website', req.params.website);
						adObj.set('desc', req.params.desc);
						adObj.save(null, {
							success: function(savedAd) {
								res.success(200);

								messager.sendWaitingMsg(
									savedAd.get('title'),
									req.user,
									savedAd.id);

							}, error: function(error) {
								res.error(error);
							}
						})
					}, error: function(error) {
						res.error(error);
					}
				});
				} else {
					res.error("Oh Dear! you are not allowed to perform this operation!!!");
				}
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});
				
			
/**
 * this function removes the alread "published" ad from the published_ads collection
 * and then submits the edited version to the new_ad collection to be checked again
 */
Parse.Cloud.define('submit_edited_published_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// remove the rejected ad from the published_ads collection 
		var publishedAdQ = new Parse.Query('published_ads');
		publishedAdQ.get(req.params.ad_id, {
			success: function(publishedAd) {
				// does this ad belong to the user requesting this operation ? if yes, do it, otherwise, don't
				if(req.user.id == publishedAd.get('user')) {
					var postIdInWebsite = publishedAd.get('wordpress_post_id'); // used to delete the ad from the website
				// destroy the ad
				publishedAd.destroy({
					success: function() {
						// submit the new ad
						var adObject = Parse.Object.extend("new_ad");
						var adObj = new adObject();
						adObj.set('user', user.id);
						adObj.set('virtual_created_at', Date.now());
						adObj.set('ad_status', 'waiting');
						adObj.set('type_name', req.params.type_name);
						adObj.set('category_name', req.params.category_name);
						adObj.set('place_name', req.params.place_name);
						adObj.set('city_name', req.params.city_name);
						adObj.set('image_name', req.params.image_name);
						adObj.set('title', req.params.title);
						adObj.set('is_urgent', req.params.is_urgent);
						adObj.set('phone', req.params.phone);
						adObj.set('email', req.params.email);
						adObj.set('website', req.params.website);
						adObj.set('desc', req.params.desc);
						adObj.save(null, {
							success: function(savedAd) {
								res.success(200);

								messager.sendWaitingMsg(
									savedAd.get('title'),
									req.user,
									savedAd.id);

								// DELETE the ad from the website
								websiteModule.deleteFromWebsite(postIdInWebsite);
								

							}, error: function(error) {
								res.error(error);
							}
						})
					}, error: function(error) {
						res.error(error);
					}
				});
				} else {
					res.error("Honey, you are not allowed to perform this operation!!!");
				}
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});

	
/**
 * delete a waiting ad
 */
Parse.Cloud.define('delete_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {

		var waitingAdQ = new Parse.Query('new_ad');
		waitingAdQ.get(req.params.ad_id, {
			success: function(obj) {
				// does the ad belong to the user requesting this operation ? if yes do it, otherwise, don't
				if(user.id == obj.get('user')) {
					// destroy the obj
					obj.destroy({
						success: function() {
							res.success(200);
						}, error: function(error) {
							res.error(error);
						}
					});
				} else {
					res.error("Hey, you are not allowed to perform this operation. EOD");
				}
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});


/**
 * delete a published ad
 */
Parse.Cloud.define('delete_published_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {

		var publishedAdQ = new Parse.Query('published_ads');
		publishedAdQ.get(req.params.ad_id, {
			success: function(obj) {
				// does the ad belong to the user requesting this operation ? if yes do it, otherwise, don't
				if(user.id == obj.get('user')) {
					// destroy the obj
					obj.destroy({
						success: function() {
							res.success(200);
						}, error: function(error) {
							res.error(error);
						}
					});
				} else {
					res.error("Hey, you are not allowed to perform this operation. EOD");
				}
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});


/**
 * send an admin message to all the users
 */
Parse.Cloud.define('send_admin_message', function(req, res) {
	Parse.Cloud.useMasterKey();

	// TODO check user role
	var userq = new Parse.Query('User');
	userq.select("onesignal_id");
	userq.find({
		success: function(results) {
			var playerIds = [];
			var userIds = [];
			for(var i = 0; i < results.length; ++i) {
				var result = results[i];
				if(result.get("onesignal_id") != "" && result.get('onesignal_id') != undefined) {
					playerIds.push(result.get('onesignal_id'));
					console.log(result.onesignal_id);
				}
				userIds.push(results[i].id);
			}
			messager.sendAdminMsg(req.params.message_title, req.params.message_url, userIds, playerIds);
			res.success(200);
		}, error: function(error) {
			res.error(error);
		}
	})
});
	
/**
 * publish an ad
 */
Parse.Cloud.define('publish_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	// TODO check user role
	

	// fetch the ad
	var newAd = new Parse.Query("new_ad");
	newAd.get(req.params.object_id, {
		success: function(obj) {
			// create a duplicate and save it to the published_ads collection
			var adObject = Parse.Object.extend("published_ads");
			var adObj = new adObject();
			adObj.set('user', obj.get('user'));
			adObj.set('virtual_created_at', Date.now());
			adObj.set('type_name', obj.get('type_name'));
			adObj.set('category_name', obj.get('category_name'));
			adObj.set('place_name', obj.get('place_name'));
			adObj.set('city_name', obj.get('city_name'));
			adObj.set('image_name', obj.get('image_name'));
			adObj.set('title', obj.get('title'));
			adObj.set('is_urgent', obj.get('is_urgent'));
			adObj.set('phone', obj.get('phone'));
			adObj.set('email', obj.get('email'));
			adObj.set('website', obj.get('website'));
			adObj.set('desc', obj.get('desc'));
			adObj.set('ad_status', 'published');
			adObj.save(null, {
				success: function(savedAd) {
					res.success(200);

					// delete the ad from the new_ad collection
					obj.destroy({success: function() {}, error: function(error) { console.log(error); }});

					// send message to the user
					// we need the user object for the msg
					var userQ = new Parse.Query('User');
					userQ.get(savedAd.get('user'), {
						success: function(user) {
							messager.sendPublishmentMsg(savedAd.get('title'), user, savedAd.id);
						}, error: function(error) {
							console.log("could not fetch user: " + error);
						}
					});

					// TODO test this  notification to the users subscribed to this category that a new ad was pubed
					var promise = notifier.prepareBulkNotification(savedAd);
					promise.then(function(result) {
						notifier.sendBulkNotification();
					}, function(error) {
						console.log(error);
					});

					// post to the website TODO test this
					websiteModule.postToWebsite(savedAd);
				
				}, error: function(error) {
					res.error(error);
				}
			});
		}, error: function(error) {
			res.error(error);
		}
	})
});

/**
 * reject an ad
 */
Parse.Cloud.define('reject_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	// TODO check user role (should be moderator)
	
	var newAd = new Parse.Query('new_ad');
	newAd.get(req.params.object_id, {
		success: function(obj) {
			// update the object
			obj.set('ad_status', 'rejected');
			obj.set('rejection_reason', req.params.rejection_reason);
			obj.set('rejection_reason_desc', req.params.rejection_reason_desc);
			obj.save(null, {
				success: function(updateObj) {
					res.success(200);

					// send message to the user
					// we need the user object for the msg
					var userQ = new Parse.Query('User');
					userQ.get(obj.get('user'), {
						success: function(user) {
							messager.sendRejectionMsg(obj.get('title'), user, obj.id);
						}, error: function(error) {
							console.log("reject ad: " + error);
						}
					});
				}, error: function(error) {
					res.error(error);
				}
			})
		}, error: function(error) {
			res.error(error);
		}
	})
});


Parse.Cloud.define('submit_invitation', function(req, res) {
	Parse.Cloud.useMasterKey();

	// make sure the inv code is supplied
	var invCode = req.params.invitation_code;
	if(invCode == null || invCode == undefined) {
		res.error("no invitation code was supplied");
	} else {
		// find the user who generated this code
		var inviter = new Parse.Query("User");
		inviter.equalTo('invitation_code', invCode);
		inviter.find({
			success: function(results) {
				if(results.length == 0) {
					// TODO replace with error code and give user proper error msg
					res.error("Invalid invitation code");
				} else {
					var user = results[0];
					// submit an invitation record
					var invitationObject = Parse.Object.extend("invitation");
					var invObj = new invitationObject();
					invObj.set('inviter', user.id);
					var invitee = req.user;
					if(invitee != null && invitee != undefined)
						invObj.set('invitee', invitee.id); 
					else invObj.set('invitee', 'some user');
					invObj.set('inv_code', invCode);
					invObj.save({
						success: function(savedObj) {
							res.success(200);
							// TODO test this notification to the inviter stating that someone used their code
							var userQ = new Parse.Query('User');
							userQ.select('onesignal_id');
							userQ.get(user.id, {
							success: function(user) {
								var params = {};
								params.include_player_ids = [user.get('onesignal_id')];
								params.contents = {en : strings.dametoon_garm_content };
								params.headings = {en : strings.dametoon_garm_heading };
								notifier.sendNotification(params);

							}, error: function(error) {
								console.log("could not fetch user: " + error);
							}
							});

						}, error: function(error) {
							res.error(error);
						}
					});
				}
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});

/**
 * generate a unique 6 letter random code
 */
Parse.Cloud.define('generate_inv_code', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("you are not registered");
	} else {
		// generate a random six letter code
		var code = '';
		var possibleChars = 'abcdefghijklmnopqrstuvwxyz';
		for(var i = 0; i < 6; i++) 
			code += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));

		// update the user's invitation_code field
		user.set('invitation_code', code);
		user.save({
			success: function(savedUser) {
				res.success(code);
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});


Parse.Cloud.define('subscribe_cats', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// update the user's category subscribtion fields
		user.set('subscribed_cats', req.params.chosen_cats);
		console.log("chosen cats: " + req.params.chosen_cats);
		user.save({
			success: function(user) {
				res.success(200);
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});

/**
 * subscribe to a single cat
 */
Parse.Cloud.define('subscribe_to_cat', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		var alreadySubed = false;
		var currentCats = req.user.get('subscribed_cats');
		if(currentCats != undefined) {
			// is the user already subscribed to this cat ?
			for(var i = 0; i < currentCats.length; i++) {
				if(currentCats[i] == req.params.new_cat) {
					alreadySubed = true
					res.success(200);
				}
			}
		}

		if(!alreadySubed) {
		// add the cat and update the user
		if(currentCats == undefined) currentCats = [];
		currentCats.push(req.params.new_cat);
		user.set('subscribed_cats', currentCats);
		user.save({
			success:function(user) {
				res.success(200);
			}, error: function(error) {
				res.error(error);
			}
		});
		}
	}
});

	

Parse.Cloud.define('subscribe_cities', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// update the user's category subscribtion fields
		user.set('subscribed_cities', req.params.chosen_cities);
		console.log("chosen cities: " + req.params.chosen_cities);
		user.save({
			success: function(user) {
				res.success(200);
			}, error: function(error) {
				res.error(error);
			}
		});
	}
});

/**
 * turn on notifications
 */
Parse.Cloud.define('turn_on_notifications', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// make sure the user is himself
		if(user.id == req.params.id) {
			user.set('is_notifiable', true);
			user.save({
				success: function(user) {
					res.success(200);
				}, error: function(error) {
					res.error(error);
				}
			});
		} else {
			res.error("you are not allowed to perform this operation");
		}
	}
});

/**
 * turn off notifications
 */
Parse.Cloud.define('turn_off_notifications', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// make sure the user is himself
		if(user.id == req.params.id) {
			user.set('is_notifiable', false);
			user.save({
				success: function(user) {
					res.success(200);
				}, error: function(error) {
					res.error(error);
				}
			});
		} else {
			res.error("you are not allowed to perform this operation");
		}
	}
});


Parse.Cloud.define('make_msgs_seen', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// make sure the user is himself
		if(user.id == req.params.user_id) {
			// query the msgs
			var msgQ = new Parse.Query('messages');
			msgQ.equalTo('seen', false);
			msgQ.each(function(result) {
				result.set('seen', true);
				result.save();
			}, {
				success: function(result) {
					res.success(200);
				}, error: function(error) {
					res.error(error);
				}
			});

		} else {
			res.error("you are not allowed to perform this operation");
		}
	}
});

/**
 * expire the ads that are a month old
 */ // TODO delete the ad from the wordpress website
Parse.Cloud.define('expire_ads', function(req, res) {
	Parse.Cloud.useMasterKey();

	console.log('Ran Expiration Job');

	// query the ads that are a month old
	var adQ = new Parse.Query('published_ads');
	// TODO test in production
	var nowMillis = Date.now();
	var millisInMonth = 2678400000; // 31 day month
	var monthOldMillis = nowMillis - millisInMonth;
	var monthOldDate = new Date(monthOldMillis); // 1 month old date
	adQ.lessThan('createdAt', monthOldDate);

	/*
	// 30 sex old date
	var nowMillis = Date.now();
	var millisInMonth = 30*1000; // 30 seconds month
	var monthOldMillis = nowMillis - millisInMonth;
	var monthOldDate = new Date(monthOldMillis); // 30 second old date
	adQ.lessThan('createdAt', monthOldDate);
	*/

	adQ.each(function(ad) {
		// duplicate in the expired_ads collection and delete it then notify the user
		var adObject = Parse.Object.extend('expired_ads');
		var adObj = new adObject();
		adObj.set('user', ad.get('user'));
		adObj.set('virtual_created_at', Date.now());
		adObj.set('type_name', ad.get('type_name'));
		adObj.set('category_name', ad.get('category_name'));
		adObj.set('place_name', ad.get('place_name'));
		adObj.set('city_name', ad.get('city_name'));
		adObj.set('image_name', ad.get('image_name'));
		adObj.set('title', ad.get('title'));
		adObj.set('is_urgent', ad.get('is_urgent'));
		adObj.set('phone', ad.get('phone'));
		adObj.set('email', ad.get('email'));
		adObj.set('website', ad.get('website'));
		adObj.set('desc', ad.get('desc'));
		adObj.set('ad_status', 'expired');
		return adObj.save().then(function(savedAd) {
			// DELETE from website
			// TODO test in production
			websiteModule.deleteFromWebsite(ad.get('wordpress_post_id'));
			ad.destroy({
				success:function() {
						res.success(200);
						console.log('Expired an ad');
					}, error: function(error) {
						res.error(error);
						console.log('Expired an ad but failed to delete from the published collection: ' + error);
					}
				});

			var userQ = new Parse.Query('User');
			userQ.get(savedAd.get('user'), {
				success: function(user) {
					// notify the user
					messager.sendExpirationMsg(ad.get('title'), user, ad.id);
				}, error: function(error) {
					console.log(error);
				}
			});

			
		});
	});
});
			
			
/*
 * extend an expired ad
 */
Parse.Cloud.define('extend_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// and ask the user to sign up manually 
		// because the anonymous registration is not working for them
		res.error("user is not registered");
	} else {
		// make sure the user is himself
		if(user.id == req.params.id) {
			// fetch the ad from the expired collection
			var adQ = new Parse.Query('expired_ads');
			adQ.get(req.params.ad_id, {
				success: function(obj) { // expired ad
					// create a new published ad
					// create a duplicate and save it to the published_ads collection
			var adObject = Parse.Object.extend("published_ads");
			var adObj = new adObject();
			adObj.set('user', obj.get('user'));
			adObj.set('virtual_created_at', Date.now());
			adObj.set('type_name', obj.get('type_name'));
			adObj.set('category_name', obj.get('category_name'));
			adObj.set('place_name', obj.get('place_name'));
			adObj.set('city_name', obj.get('city_name'));
			adObj.set('image_name', obj.get('image_name'));
			adObj.set('title', obj.get('title'));
			adObj.set('is_urgent', obj.get('is_urgent'));
			adObj.set('phone', obj.get('phone'));
			adObj.set('email', obj.get('email'));
			adObj.set('website', obj.get('website'));
			adObj.set('desc', obj.get('desc'));
			adObj.set('ad_status', 'published');
			adObj.save(null, {
				success: function(savedAd) {
					res.success(200);

					// delete the ad from the expired collection
					obj.destroy({success: function() {}, error: function(error) { console.log(error); }});

					// send message to the user
					// we need the user object for the msg
					var userQ = new Parse.Query('User');
					userQ.get(savedAd.get('user'), {
						success: function(user) {
							messager.sendPublishmentMsg(savedAd.get('title'), user, savedAd.id);
						}, error: function(error) {
							console.log("could not fetch user: " + error);
						}
					});

					// TODO test this  notification to the users subscribed to this category that a new ad was pubed
					var promise = notifier.prepareBulkNotification(savedAd);
					promise.then(function(result) {
						notifier.sendBulkNotification();
					}, function(error) {
						console.log(error);
					});

					websiteModule.postToWebsite(savedAd);
				
				}, error: function(error) {
					res.error(error);
				}
			});
				}, error: function(error) {
					res.error(error);
				}
			});
		} else {
			res.error("you are not allowed to perform this operation");
		}
	}
});


