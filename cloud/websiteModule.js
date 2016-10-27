var FormData = require('form-data');
var stringModule = require('./stringsModule.js');

var strings = stringModule.getStrings();

var ip = "192.168.1.7";
var url = "http://" + ip +"/wordpress/wp-json/wp/v2";
var authToken = "bmF6YXI6a2RDcyBYOWJoIGN5eHEgYlVjQQ==";

module.exports = {
	postToWebsite: function(ad) {

		try {
		console.log("POSTING TO WEBSITE"); // TODO remove this

		// TODO set the image as the featured_media if it exists
		
		//if(ad.get('is_urgent')) {
	//		categories.push(strings.urgent);
//			tags.push(strings.urgent);
//		}

		var desc = ad.get('desc');
		var length = 140;
		if(desc.length < 140) length = desc.length;


		var params = {
			status: 'publish',
			title: ad.get('title'),
			content: ad.get('desc'),
			excerpt: desc.substring(1, length),
			comment_status: 'open'
		}

		var tagResponse;
		var categoryResponse;

		Parse.Cloud.httpRequest({
			method: 'GET',
			url: url + '/tags?per_page=100'
		}).then(function(httpResponse) {
			tagResponse = JSON.parse(httpResponse.text);
			return Parse.Cloud.httpRequest({
				method: 'GET',
				url: url + '/categories?per_page=100'
			}).then(function(httpResponse){
				categoryResponse = JSON.parse(httpResponse.text);
				console.log("cats : " +  JSON.stringify(categoryResponse));
			}, function(httpResponse) {
				console.log(httpResponse);
			});

		}, function(httpResponse) {
			console.log(httpResponse);
		}).then(function(result) {
			var categories = [];
			var tags = [];
			console.log("I'm here "); // TODO remove this
			// fetch the categories
			for(var i = 0; i < categoryResponse.length; i++) {
				var catObj = categoryResponse[i];
				if(catObj.name == ad.get('category_name')) {
					categories.push(catObj.id);
					break;
				}
			}
			
			// fetch the tags
			for(var i = 0; i < tagResponse.length; i++) {
				var tagObj = tagResponse[i];
				if(tagObj.name == ad.get('category_name') ||
				tagObj.name == ad.get('type_name') ||
				tagObj.name == ad.get('city_name') ||
				tagObj.name == strings.urgent) tags.push(tagObj.id);
			}

			console.log("tags : " + tags + " cats " + categories); // TODO remove this

			params.categories = categories;
			params.tags = tags;

			return Parse.Cloud.httpRequest({
				method: 'POST',
				url: url + '/posts',
				params: params,
				headers: {
					Authorization: 'Basic' + ' ' + authToken
				}
			}).then(function(httpResponse) {
				console.log("POSTED TO WEBSITE 200");
			}, function(httpResponse) {
				console.log("FAILED WEBSITE POST");
			});

		}, function(result) {
			console.log(result);
		})

			
		} catch(ex) {console.log(ex);}
	}

	// TODO implement the delete function for expiration purposes
}
	



		
