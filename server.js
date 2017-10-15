const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const axios = require('axios');
const jquery = require('jquery');
const fetch = require('node-fetch');

let convertCookies = function(responseCookies){
  let cookies = [];
  responseCookies.forEach(function(cookie){
    cookies.push(cookie.split(';')[0]);
  });
  return cookies.join('; ');
};

fetch('http://gmail.com')
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    const {window} = new JSDOM(text);
    const $ = jquery(window);
    let $form = $('form');
    let action = $form.attr('action');
    $form.find('input[name=Email]').val('bannonswaterproof');
    let formData = $form.serialize();
    console.log(action);
console.log(formData);
    axios.request({
      url: action,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0'
      }
    }).then(function (response) {

      let cookies = convertCookies(response.headers['set-cookie']);


      const {window} = new JSDOM(response.data);
      const $ = jquery(window);
      let $form = $('form');
      let action = $form.attr('action');
      $form.find('input[name=Passwd]').val('medalist');
      let formData = $form.serialize();

      console.log(action);
      console.log(formData);
      console.log(cookies);

      //console.log('curl -v -i -X POST --data "' + formData + '" -H "Cookie: ' + cookies.join('; ') + '" ' + action);

      axios.request({
        url: action,
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0'
        },
        maxRedirects: 0
      }).then(function(response){
        console.log('success');
      })
        .catch(function (error) {
          if (error.response.status == 302){
            console.log('redirected to ' + error.response.headers.location);
            console.log(convertCookies(error.response.headers['set-cookie']));
          }else {
            console.log('Error: ', error);
          }
        });
    })
      .catch(function (error) {
        console.log('Error: ', error);
      });
  })
  .catch(function (error) {
    console.log('Request failed', error)
  });
