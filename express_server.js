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
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  res.locals.urlDatabase = urlDatabase;
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
  res.render("urls_login");
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
      urlDatabase[randomStr] = req.body.longURL;
      res.redirect('/urls/' + randomStr);
    }
});

app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  });
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  if (longURL) {
  urlDatabase[shortURL] = longURL;
  };
  res.redirect("/urls/" + shortURL);
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
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
