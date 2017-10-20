const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const axios = require('axios');
const jquery = require('jquery');
const fetch = require('node-fetch');

const captchaAddress = 'https://accounts.google.com/DisplayUnlockCaptcha';
const userAgent = 'MidnightBrowser/1.0';

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
  let username = process.argv[2];
  console.log(username);
  const {window} = new JSDOM(htmlText);
  const $ = jquery(window);
  let $form = $('form');
  let action = $form.attr('action');
  $form.find('input[name=Email]').val(username);
  let formData = $form.serialize();
  axios.request({
    url: action,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    }
  }).then(function (response) {
    handlePasswordForm(response);
  }).catch(function (error) {
    console.log('Error: ', error);
  });
};

let handlePasswordForm = function (prevResponse) {
  console.log('Filling out password form...');
  let password = process.argv[3];
  console.log(password);
  let cookies = convertCookies(prevResponse.headers['set-cookie']);
  const {window} = new JSDOM(prevResponse.data);
  const $ = jquery(window);
  let $form = $('form');
  let action = $form.attr('action');
  $form.find('input[name=Passwd]').val(password);
  let formData = $form.serialize();
  axios.request({
    url: action,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'User-Agent': userAgent
    },
    maxRedirects: 0
  }).then(function (response) {
    console.log(response.data);
  }).catch(function (error) {
    if (error.response.status == 302) {
      handleRedirect(error.response, cookies);
    } else {
      console.log('Error: ', error);
    }
  });
};

let handleRedirect = function (prevResponse, prevCookies) {
  let url = prevResponse.headers.location;
  let cookies = prevCookies;
  if (prevResponse.headers['set-cookie']) {
    cookies = cookies + '; ' + convertCookies(prevResponse.headers['set-cookie']);
  }
  console.log('\nredirected to ' + url);
  axios.request({
    url: url,
    method: 'get',
    headers: {
      'Cookie': cookies,
      'User-Agent': userAgent
    },
    maxRedirects: 0
  }).then(function (response) {
    handleLoggedIn(response, cookies);
  }).catch(function (error) {
    if (error.response.status == 302) {
      handleRedirect(error.response, cookies);
    } else {
      console.log('Error: ', error);
    }
  });
};

let handleLoggedIn = function (prevResponse, prevCookies) {
  console.log('\nLogged in to GMail');
  let cookies = prevCookies;
  if (prevResponse.headers['set-cookie']) {
    cookies = cookies + '; ' + convertCookies(prevResponse.headers['set-cookie']);
  }
  console.log('\nattempting ' + captchaAddress);
  axios.request({
    url: captchaAddress,
    method: 'get',
    headers: {
      'Cookie': cookies,
      'User-Agent': userAgent
    },
    maxRedirects: 0
  }).then(function (response) {
    handleUnlockForm(response, cookies);
  }).catch(function (error) {
    if (error.response.status == 302) {
      console.log('redirect requested');
    } else {
      console.log('Error: ', error);
    }
  });
};

let handleUnlockForm = function(prevResponse, prevCookies){
  console.log('\nFilling out unlock form...');
  let cookies = prevCookies;
  if (prevResponse.headers['set-cookie']) {
    cookies = cookies + '; ' + convertCookies(prevResponse.headers['set-cookie']);
  }
  const {window} = new JSDOM(prevResponse.data);
  const $ = jquery(window);
  let $form = $('form');
  let formData = $form.serialize();
  console.log('\nattempting ' + captchaAddress);
  axios.request({
    url: captchaAddress,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'User-Agent': userAgent
    },
    maxRedirects: 0
  }).then(function (response) {
    const {window} = new JSDOM(response.data);
    const $ = jquery(window);
    let $h1 = $('h1');
    console.log($h1.html());
  }).catch(function (error) {
    if (error.response.status == 302) {
      console.log('redirect requested');
    } else {
      console.log('Error: ', error);
    }
  });
};
