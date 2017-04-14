const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.use((req, res, next) => {
  req.user = users[req.cookies.user_id];
  res.locals.user = req.user;
  res.locals.urlArray = urlsForUser(req.cookies.user_id);
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
      users[randomID] = { id: randomID, email: userEmail, password: passWord };
      res.cookie("user_id", randomID);
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
  if (user) {
    if (req.body.password === user.password) {
      // log them in
      res.cookie("user_id", user.id).redirect("/");
    } else {
      // passwords don't match
      res.sendStatus(403);
    }
  } else {
    // email doesn't exist
    res.status(403).send("This email doesn't exist");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id").redirect("/");
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
