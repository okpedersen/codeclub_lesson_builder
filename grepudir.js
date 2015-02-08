var request = require('request'),
    xpath = require('xpath'),
    fs = require('fs'),
    xml2json = require('xml2json'),
    dom = require('xmldom').DOMParser;

var api_url = "http://data.udir.no/kl06/odata/Kompetansem%C3%A5l";
var json_filepath = "./grepudir.json";

request(api_url, function(error, response, body) {
    if(!error && response.statusCode==200) {
      var doc = new dom().parseFromString(body);
      var entries = xpath.select('//entry', doc);
      console.log(entries);
    }
});

/*
request(api_url, function(error, response, body) {
    if(!error && response.statusCode==200) {
      var json = xml2json.toJson(body);
      var fstream = fs.createWriteStream(json_filepath);
      fstream.once('open', function(fd) {
        fstream.write(json);
      })
    }
});
*/
