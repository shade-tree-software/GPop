const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const axios = require('axios');
const jquery = require('jquery');
const fetch = require('node-fetch');
const fs = require('fs');
const sleep = require('sleep');

let convertCookies = function (responseCookies) {
  let cookies = [];
  responseCookies.forEach(function (cookie) {
    cookies.push(cookie.split(';')[0]);
  });
  return cookies.join('; ');
};

console.log('Contacting GMail...');
fetch('http://gmail.com')
  .then(function (response) {
    return response.text();
  })
  .then(function (htmlText) {
    handleUsernameForm(htmlText);
  }).catch(function (error) {
  console.log('Request failed', error)
});

let handleUsernameForm = function (htmlText) {
  console.log('Filling out username form...');
  sleep.sleep(1);
  const {window} = new JSDOM(htmlText);
  const $ = jquery(window);
  let $form = $('form');
  let action = $form.attr('action');
  $form.find('input[name=Email]').val('bannonswaterproof');
  let formData = $form.serialize();
  axios.request({
    url: action,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }).then(function (response) {
    handlePasswordForm(response);
  }).catch(function (error) {
    console.log('Error: ', error);
  });
};

let handlePasswordForm = function (previousResponse) {
  console.log('Filling out password form...');
  sleep.sleep(1);
  let cookies = convertCookies(previousResponse.headers['set-cookie']);
  const {window} = new JSDOM(previousResponse.data);
  const $ = jquery(window);
  let $form = $('form');
  let action = $form.attr('action');
  $form.find('input[name=Passwd]').val('medalist');
  let formData = $form.serialize();
  axios.request({
    url: action,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    maxRedirects: 0
  }).then(function (response) {
    console.log(response.data);
  }).catch(function (error) {
    if (error.response.status == 302) {
      redirect(error.response, cookies);
    } else {
      console.log('Error: ', error);
    }
  });
};

let redirect = function (previousResponse, prevCookies) {
  let url = previousResponse.headers.location;
  let cookies = prevCookies;
  if (previousResponse.headers['set-cookie']){
    cookies = cookies + '; ' + convertCookies(previousResponse.headers['set-cookie']);
  }
  console.log('\nredirected to ' + url);
  console.log('cookies: ' + cookies);
  axios.request({
    url: url,
    method: 'get',
    headers: {
      'Cookie': cookies,
    },
    maxRedirects: 0
  }).then(function (response) {
    fs.writeFile("index.html", response.data, function(err) {
      if(err) {
        return console.log(err);
      }
      console.log("\nThe file was saved!");
    });
  }).catch(function (error){
    if (error.response.status == 302) {
      redirect(error.response, cookies);
    } else {
      console.log('Error: ', error);
    }
  });
};
