const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

function generateRandomString() {
  let randomString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (var i = 6; i > 0; --i) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  if (req.cookies.username && req.cookies.username) {
    res.render("urls_index", {templateVars: urlDatabase, username: req.cookies["username"]});
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/login", (req, res) => {
  res.render("url_login", {username: req.cookies["username"], password: req.cookies["password"]});
})

app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  res.cookie("username", username);
  res.cookie("password", password);
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username", req.params.username);
  res.redirect("/");
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["username"]});
});

app.get("/urls", (req, res) => {
  if (req.cookies.username && req.cookies.password) {
    res.render("urls_index", {templateVars: urlDatabase, username: req.cookies["username"]});
  } else {
    res.render("url_login", {username: req.cookies["username"], password: req.cookies["password"]});
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let randomStr = generateRandomString();
  if (!req.body.longURL) {
    res.redirect("/urls/new");
  } else {
      urlDatabase[randomStr] = req.body.longURL;
      res.redirect('/urls/' + randomStr);

    }
});

app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    res.render("urls_index", {templateVars: urlDatabase});
  } else {
      res.redirect(urlDatabase[shortURL]);
    }
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  if (longURL) {
  urlDatabase[shortURL] = longURL;
  };
  res.redirect("/urls/" + shortURL);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
