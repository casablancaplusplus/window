var FormData = require('form-data');
var stringModule = require('./stringsModule.js');

var strings = stringModule.getStrings();

var ip = "whatsbar.ir";
var url = "http://" + ip +"/wp-json/wp/v2";

var authToken = "bmF6YXJhazpTdXdYIGZpcFogWVBiQiBvRTRBCg==";

module.exports = {
	deleteFromWebsite: function(adId) {
		console.log("DELETING AD FROM WEBSITE");
		Parse.Cloud.httpRequest({
			method: 'DELETE',
			url: url + '/posts/' + adId,
			headers: {
				Authorization: 'Basic' + ' ' + authToken
			}
		}).then(function(httpResponse) {
			console.log('DELETED AD ' + adId + ' FROM WEBSITE');
		}, function(httpResponse) {
			console.log('ERROR DELETING AD ' + adId + ' FROM WEBSITE');
		});
	},	
	postToWebsite: function(ad) {

		try {
		console.log("POSTING TO WEBSITE"); // TODO remove this

		// TODO set the image as the featured_media if it exists

		var desc = ad.get('desc');
		var length = 70;
		if(desc.length < 50) length = desc.length;

			// the content
			var content = '';
			content += desc;
			
			// add the phone number to the end of the content
			content += '<br/><br>';
			content += strings.phone_number;
			content += strings.colon;
			content += ' ';
			content += '<b>' + ad.get('phone') + '</b>';

			// add the email if it exists
			var email = ad.get('email');
			if(email != "") {
				content += '<br/>';
				content += strings.email;
				content += strings.colon;
				content += ' ';
				content += '<b>' + email + '</b>'; 
			}

			// add the website
			var website = ad.get('website');
			if(website != "") {
				content += '<br/>';
				content += strings.website;
				content += strings.colon;
				content += ' ';
				content += '<b><a href=\"http://' + website + '\">' + website + '</a></b>';
			}

		var params = {
			status: 'publish',
			title: ad.get('title'),
			content: content,
			excerpt: desc.substring(-1, length) + '...',
			comment_status: 'closed'
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
				var response = JSON.parse(httpResponse.text);
				ad.set('wordpress_post_id', response.id);
				ad.set('web_link', response.link);
				ad.save();
			}, function(httpResponse) {
				console.log("FAILED WEBSITE POST: " + httpResponse.text);
			});

		}, function(result) {
			console.log(result);
		})

			
		} catch(ex) {console.log(ex);}
	}

}
	



		
