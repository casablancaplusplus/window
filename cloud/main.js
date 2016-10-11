Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


/**
* this function submits a new ad after
* validating the request parameters 
* and making sure that the user does not
* have a waiting or published ad in the supplied category
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
		var pubedAdQuery = new Parse.Query("published_ad");
		pubedAdQuery.equalTo("user", user.id);
		pubedAdQuery.equalTo("category_name", categoryName);
		// ads younger than one month are active
		// create a one month old Date object
		var nowMillis = Date.now();
		var millisInMonth = 2678400000; // 31 day month
		var monthOldMillis = nowMillis - millisInMonth;
		var monthOldDate = new Date(monthOldMillis); // this date is one month old
		pubedAdQuery.greaterThan("created_at", monthOldDate);
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
					newAdQuery.equalTo("ad_status", "wating");
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
								adObj.set('ad_status', 'wating');
								adObj.set('type_name', req.params.type_name);
								adObj.set('category_name', req.params.category_name);
								adObj.set('place_name', req.params.place_name);
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
	
})


