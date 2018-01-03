const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const axios = require('axios');
const jquery = require('jquery');
const fetch = require('node-fetch');
const fs = require('fs');

const express = require('express')
const app = express()

const captchaAddress = 'https://accounts.google.com/DisplayUnlockCaptcha';
const userAgent = 'MidnightBrowser/1.0';

let convertCookies = function (responseCookies) {
  let cookies = [];
  responseCookies.forEach(function (cookie) {
    cookies.push(cookie.split(';')[0]);
  });
  return cookies.join('; ');
};

let contactGmail = function (account, cb, err) {
  console.log('Contacting GMail...');
  fetch('http://gmail.com').then(function (response) {
    return response.text();
  }).then(function (htmlText) {
    handleUsernameForm(htmlText, account, cb, err);
  }).catch(err);
}

let handleUsernameForm = function (htmlText, account, cb, err) {
  console.log('Filling out username form...');
  console.log(account.username);
  const {window} = new JSDOM(htmlText);
  const $ = jquery(window);
  let $form = $('form');
  let action = $form.attr('action');
  $form.find('input[name=Email]').val(account.username);
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
    handlePasswordForm(response, account.password, cb, err);
  }).catch(err);
};

let handlePasswordForm = function (prevResponse, password, cb, err) {
  console.log('Filling out password form...');
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
    err(new Error(response.data));
  }).catch(function (error) {
    if (error.response.status == 302) {
      handleRedirect(error.response, cookies, cb, err);
    } else {
      err(error);
    }
  });
};

let handleRedirect = function (prevResponse, prevCookies, cb, err) {
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
    handleLoggedIn(response, cookies, cb, err);
  }).catch(function (error) {
    if (error.response.status == 302) {
      handleRedirect(error.response, cookies, cb, err);
    } else {
      err(error);
    }
  });
};

let handleLoggedIn = function (prevResponse, prevCookies, cb, err) {
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
    handleUnlockForm(response, cookies, cb, err);
  }).catch(err);
};

let handleUnlockForm = function (prevResponse, prevCookies, cb, err) {
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
    console.log('done')
    cb($h1.html());
  }).catch(err);
};

app.use(function (req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(302, 'https://' + req.hostname + req.originalUrl);
  } else {
    next();
  }
})

app.get('/', (req, res) => {
  let account = {username: req.query.username, password: req.query.password}
  contactGmail(account, (successMessage) => res.send(successMessage), (error) => res.status(500).send('Error: ' + error.message))
})

let port = process.env.PORT || 9000
app.listen(port, function () {
  console.log(`Listening on port ${port}`)
})