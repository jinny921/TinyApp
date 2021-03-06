const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["lighthouse"]}));
app.set("view engine", "ejs");
app.use(express.static('staticFiles'));
app.use(methodOverride('_method'));

//generating random 6 digit string for userID and shortURL
function generateRandomString() {
  let randomString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (var i = 6; i > 0; --i) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
};

//check if email exist in database
function findUserByEmail(email) {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  };
  return null;
};

//check if shortURL exist in database
function findShortUrl(shortURL) {
  if (urlDatabase.hasOwnProperty(shortURL)) {
    return urlDatabase[shortURL];
  }
};

//check if url's id match user's id
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

const error = {
    "401": "Please log in with correct email/password! Or register first!",
    "403": "This is not your URL!",
    "404": "This shorten URL does not exist",
    "400": "Please don't leave email/password blanck, or use an existing email"
};


//middleware for logged in users
app.use((req, res, next) => {
  req.user = users[req.session.user_id];
  res.locals.user = req.user;
  res.locals.urlArray = urlsForUser(req.session.user_id);
  next();
});

app.get("/", (req, res) => {
  if (req.user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  if (req.user) {
    res.redirect("/");
  } else {
    res.status(200);
    res.render("urls_register");
  }
});

app.post("/register", (req, res, next) => {
  let existEmail = findUserByEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    next(400);
  } else if (existEmail) {
    next(400);
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
    res.status(200);
    res.render("urls_login");
  }
});

app.post("/login", (req, res, next) => {
  let user = findUserByEmail(req.body.email);
  if (req.body.email !== "" && req.body.password !== "") {
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/");
    } else {
      next(401);
    }; 
  } else {
    next(400)
  }
});

app.post("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/");
});

app.get("/urls/new", (req, res, next) => {
  if (!req.user) {
    next(401);
  } else {
    res.status(200);
    res.render("urls_new");
  }
});

app.get("/urls", (req, res, next) => {
  if (!req.user) {
    next(401);
  } else {
    res.status(200);
    res.render("urls_index");
  }
});

app.post("/urls", (req, res) => {
  let randomStr = generateRandomString();
  if (!req.body.longURL) {
    res.redirect("/login");
  } else {
    const newURL = {
      userID: req.session.user_id,
      shortURL: randomStr,
      longURL: req.body.longURL
    };
      urlDatabase[randomStr] = newURL;
      res.redirect('/urls/' + randomStr);
    }
});

app.get("/urls/:shortURL", (req, res, next) => {
  const shortURL = req.params.shortURL;
  const existShort = findShortUrl(shortURL);
  if (!existShort) {
    next(404);
  } else if (!req.user) {
    next(401);
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    next(403);
  } else {
      res.status(200);
      res.render("urls_show", {
        shortURL: shortURL,
        longURL: urlDatabase[shortURL].longURL
      });
    }
});

app.put("/urls/:id", (req, res, next) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const existShort = findShortUrl(shortURL); 
  if (!existShort) {
    next(404);
  } else if (!req.user) {
    next(401);
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    next(403);
  } else {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect("/urls/" + shortURL);
    }
});

app.get("/u/:id", (req, res, next) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    next(404);
  } else {
      res.redirect(urlDatabase[shortURL].longURL);
    }
});

app.delete("/urls/:id", (req, res, next) => {
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    next(400);
  }
});

app.use(function(err, req, res, next) {
    res.status(err);
    res.render("err", {error: err, message: error[err]});
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
