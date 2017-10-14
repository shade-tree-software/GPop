const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const {window} = new JSDOM('<body></body>');
const $ = require("jquery")(window);
const fetch = require('node-fetch');

fetch('http://gmail.com')
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    console.log($(text).find('form').html());
  })
  .catch(function (error) {
    console.log('Request failed', error)
  });
