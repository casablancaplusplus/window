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
		
		var categories = [];
		var tags = [];
		categories.push(ad.get('place_name'));
		tags.push(ad.get('place_name'));
		categories.push(ad.get('category_name'));
		tags.push(ad.get('category_name'));
		categories.push(ad.get('type_name'));
		tags.push(ad.get('type_name'));
		if(ad.get('is_urgent')) {
			categories.push(strings.urgent);
			tags.push(strings.urgent);
		}
		//categories.push(ad.get('city_name'));
		//tags.push(ad.get('city_name'));
		

		var desc = ad.get('desc');
		var length = 140;
		if(desc.length < 140) length = desc.length;


		var params = {
			status: 'publish',
			title: ad.get('title'),
			content: ad.get('desc'),
			excerpt: desc.substring(1, length),
			comment_status: 'open',
			categories: categories,
			tags: tags
		}

		console.log(params); // TODO remove this
			
		Parse.Cloud.httpRequest({
			method: 'POST',
			url: url + '/posts',
			params: params,
			headers: {
				Authorization: 'Basic' + ' ' + authToken
			}
		}).then(function(httpResponse) {
			console.log("POSTED TO WEBSITE 200");
			// TODO create the categories and update the post with them
		}, function(httpResponse) {
			console.log("FAILED WEBSITE POST");
		});
		} catch(ex) {console.log(ex);}
	}

	// TODO implement the delete function for expiration purposes
}
	



		
