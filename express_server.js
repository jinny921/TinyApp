const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["lighthouse"]}));
app.set("view engine", "ejs");
app.use(express.static('staticFiles'));

function generateRandomString() {
  let randomString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (var i = 6; i > 0; --i) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
};

function findUserByEmail(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  };
  return null;
};

function findShortUrl(shortURL) {
  if (urlDatabase.hasOwnProperty(shortURL)) {
    return urlDatabase[shortURL];
  }
}

function urlsForUser(id) {
  return Object.keys(urlDatabase).map(shortURL =>
    urlDatabase[shortURL]
    ).filter(url => 
    url.userID === id
    ); 
};

var urlDatabase = {
  "b2xVn2": {
    userID: "userRandomID",
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: "user2RandomID",
    shortURL: "9sm5xK",
    longURL: "http://www.google.com"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "$2a$10$o/UfsinL7B.DPrjV23k6huqZu39bC1gL1mkhop4/rK6ufq/WbKPnC"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "$2a$10$qMwUpf3w1jfvZblLo4fiMOIws7/H.ZMhGs.gXxw/4bl4CAQRdhimu"
  }
};

app.use((req, res, next) => {
  req.user = users[req.session.user_id];
  res.locals.user = req.user;
  res.locals.urlArray = urlsForUser(req.session.user_id);
  next();
});

app.get("/", (req, res) => {
  if (req.user) {
    res.render("urls_index");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  let existEmail = findUserByEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    res.sendStatus(400);
  } else if (existEmail) {
    res.sendStatus(400);
  } else {
      let userEmail = req.body.email;
      let passWord = req.body.password;
      let randomID = generateRandomString();
      let hash = bcrypt.hashSync(passWord, 10);
      users[randomID] = { id: randomID, email: userEmail, password: hash };
      req.session.user_id = users[randomID];
      res.redirect("/");
  }
});

app.get("/login", (req, res) => {
  if (req.user) {
    res.redirect("/");
  } else {
    res.render("urls_login");
  }
});

app.post("/login", (req, res) => {
  let user = findUserByEmail(req.body.email);
  if (!user) {
    res.status(403).send("This email doesn't exist, please register");
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/");
  } else {
    res.status(403).send("Email and Password doesn't match");
  } 
});

app.post("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/");
});

app.get("/urls/new", (req, res) => {
  if (!req.user) {
    res.render("urls_login");
  } else {
    res.render("urls_new");
  }
});

app.get("/urls", (req, res) => {
  if (req.user) {
    res.render("urls_index");
  } else {

    res.render("urls_login");
  }
});

app.post("/urls", (req, res) => {
  let randomStr = generateRandomString();
  if (!req.body.longURL) {
    res.redirect("/urls/new");
  } else {
    const newURL = {
      userID: req.cookies.user_id,
      shortURL: randomStr,
      longURL: req.body.longURL

    }
      urlDatabase[randomStr] = newURL;
      console.log(urlDatabase);
      res.redirect('/urls/' + randomStr);
    }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const existShort = findShortUrl(shortURL);

  if (!existShort) {
    res.status(404).send("This is shortURL doesn't exist!");
  } else if (!req.user) {
    res.status(401).send("Please log in first");
  } else if (urlDatabase[shortURL].userID !== req.cookies.user_id) {
    res.status(403).send("This is not your URL!");
  } else {
      res.render("urls_show", {
        shortURL: shortURL,
        longURL: urlDatabase[shortURL].longURL
      });
  }
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const existShort = findShortUrl(shortURL);
  
  if (!existShort) {
    res.status(404).send("This is shortURL doesn't exist!");
  } else if (!req.user) {
    res.status(401).send("Please log in first");
  } else if (urlDatabase[shortURL].userID !== req.cookies.user_id) {
    res.status(403).send("This is not your URL!");
  } else {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect("/urls/" + shortURL);
  }
});

app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    res.render("urls_index");
  } else {
      res.redirect(urlDatabase[shortURL]);
    }
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID === req.cookies.user_id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("This is not your URL!");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
