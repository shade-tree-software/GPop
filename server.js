const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const axios = require('axios');
const jquery = require('jquery');
const fetch = require('node-fetch');


fetch('http://gmail.com')
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    const {window} = new JSDOM(text);
    const $ = jquery(window);
    let $form = $('form');
    let action = $form.attr('action');
    $form.find('input[name=Email]').val('andrewhamilton');
    let formData = $form.serialize();
    console.log(action);
    console.log(formData);

    axios.request({
      url: action,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function (response) {
      const {window} = new JSDOM(response.data);
      const $ = jquery(window);
      let $form = $('form');
      console.log($form.html());
    })
      .catch(function (error) {
        console.log(error);
      });
  })
  .catch(function (error) {
    console.log('Request failed', error)
  });
