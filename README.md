# GPop
A command line app for updating your GMail POP whitelist

If you use a cloud server (Heroku, etc.) to POP from a GMail account that is not set up with two-factor authentication, you will find that Google often refuses the POP request even though the username and password are correct.  This is because cloud server IPs are constantly changing, and Google feels that this is a security risk.  Google provides a way to whitelist a recently-rejected IP address, but you have to do it from a browser, and it's a little goofy the way it's implemented.  There does not seem to be any official web API to add an IP to the whitelist.  This app pretends to be a browser and navigates the Google web pages for whitelisting an IP so you don't have to do the clicking by yourself.
