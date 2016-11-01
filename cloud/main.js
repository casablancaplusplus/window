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
		// TODO replace the error with a code
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
										// TODO test message and notification
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
 * TODO: you might need to check whether the user is authorized to edit this ad
 */
Parse.Cloud.define('submit_edited_new_ad', function(req, res) {
	Parse.Cloud.useMasterKey();

	var user = req.user;
	// make sure the user is not null
	if(user == null || user == undefined) {
		// TODO replace the error with a code
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

								// TODO send sms to the user
								// saying that their post was submitted and waiting moderation
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
		// TODO replace the error with a code
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

								// TODO send sms to the user
								// saying that their post was submitted and waiting moderation

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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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

	console.log("I'm here"); // TODO remove this
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
				console.log(playerIds); // TODO remove this
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

					// TODO send sms to the user indicating that their ad was published
					// TODO test this  notification to the users subscribed to this category that a new ad was pubed
					var promise = notifier.prepareBulkNotification(savedAd);
					promise.then(function(result) {
						console.log("PROMISE RESOLVED"); // TODO remove
						notifier.sendBulkNotification();
					}, function(error) {
						console.log(error);
					});
					console.log(promise); // TODO remove

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
					// TODO send sms to user
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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
		// TODO replace the error with a code
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

// TODO remove this test function
Parse.Cloud.define('send_reject_message', function(req, res) {
	messager.sendPublishmentMsg(req.params.title, req.params.user_id, req.params.ad_id);
	res.success(200);
});

// TODO remove this test
Parse.Cloud.define('test_notification', function(req, res) {
	var params = {
		app_id: "30fb777b-5219-4919-bd01-29cfa4583a79",
		include_player_ids: ["3c85a0da-eaef-46d6-b5a6-e608435d9641"],
		contents: {en: req.params.message},
		headings: {en: req.params.title},
		data: {foo : "bar"}
	};
	notifier.sendNotification(params);
	res.success(200);
});

// TODO remove this
Parse.Cloud.define('wp_rest_test', function(req, res) {

	var params = {
			status: 'publish',
			title: 'title',
			content: 'desc',
			excerpt: 'excerpt',
			comment_status: 'open',
			categories: [],
			tags: [] 
		}
			
		Parse.Cloud.httpRequest({
			method: 'POST',
			url: 'http://192.168.1.7/wordpress/wp-json/wp/v2/posts',
			params: params,
			headers:{
				Authorization: 'Basic bmF6YXI6a2RDcyBYOWJoIGN5eHEgYlVjQQ=='
			}
		}).then(function(httpResponse) {
			res.success(httpResponse);
		}, function(httpResponse) {
			res.error(httpResponse);
		});
});
