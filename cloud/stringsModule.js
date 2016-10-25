module.exports = {
	getStrings : function() {
		var XMLPath = __dirname + "/strings.xml";
		//var rawJSON = loadXMLDoc(XMLPath);
		var strings = loadXMLDoc(XMLPath);
		function loadXMLDoc(filePath) {
			var fs = require('fs');
			var xml2js = require('xml2js');
			var json;
			var strings = {};
			try {
				var fileData = fs.readFileSync(filePath, 'utf-8');
				var parser = new xml2js.Parser();
				parser.parseString(fileData.substring(0, fileData.length), function(err, result) {
					json = JSON.stringify(result);
					var string = "{";
					for(var i = 0; i < result.resources.string.length; ++i) {
						var obj = result.resources.string[i];
						console.log(obj);
						
						string += '"' + obj.$.name + '" : "' + obj._ + '"';
						if(i < result.resources.string.length - 1) string += ',';
					}
					string += '}';
					strings = JSON.parse(string);
				});
				console.log("File '" + filePath + "/ was successfully read.\n");
				return strings;
			} catch(ex) {console.log(ex)}
		}
		return strings;
	}
};
