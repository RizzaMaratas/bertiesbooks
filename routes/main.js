module.exports = function(app, shopData) {

    const bcrypt = require('bcrypt');

    // Handle our routes
    app.get('/', function(req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function(req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search', function(req, res) {
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function(req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {
                availableBooks: result
            });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    app.get('/register', function(req, res) {
        res.render('register.ejs', shopData);
    });

    app.post('/registered', function(req, res) {
        const saltRounds = 10;
        const plainPassword = req.body.password;

        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                return console.error(err.message);
            }

            // Check if the email or username already exists
            let checkExistingQuery = "SELECT * FROM userDetails WHERE email = ? OR username = ?";
            let checkExistingValues = [req.body.email, req.body.username];

            db.query(checkExistingQuery, checkExistingValues, (err, results) => {
                if (err) {
                    return console.error(err.message);
                }

                if (results.length > 0) {
                    // Email or username already exists
                    let errorMessage = '';
                    if (results.some(result => result.email === req.body.email)) {
                        errorMessage += 'Email already exists. ';
                    }
                    if (results.some(result => result.username === req.body.username)) {
                        errorMessage += 'Username already exists. ';
                    }
                    // Send separate error messages for email and username conflicts
                    if (errorMessage.includes('Email') && errorMessage.includes('Username')) {
                        res.send('Email and username already exist. Please choose different ones.');
                    } else {
                        res.send(errorMessage + 'Please choose another one.');
                    }
                } else {
                    // Insert the new user if email and username are unique
                    let insertQuery = "INSERT INTO userDetails (username, first, last, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
                    let newUser = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];

                    db.query(insertQuery, newUser, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        } else {
                            let response = 'Hello ' + req.body.first + ' ' + req.body.last + ', you are now registered! We will send an email to you at ' + req.body.email + '.';
                            response += ' Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                            res.send(response);
                        }
                    });
                }
            });
        });
    });

    app.get('/list', function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {
                availableBooks: result
            });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    app.get('/listusers', function(req, res) {
        let sqlquery = "SELECT first,last,username,email FROM userDetails";

        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                // If there's an error, send an error response or redirect
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }

            let newData = Object.assign({}, shopData, {
                users: result
            });
            console.log(newData);

            // Render the page only if there's no error
            res.render("listUsers.ejs", newData);
        });
    });

    app.get('/addbook', function(req, res) {
        res.render('addbook.ejs', shopData);
    });

    app.post('/bookadded', function(req, res) {
        // saving data in database
        let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
        // execute sql query
        let newrecord = [req.body.name, req.body.price];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            } else
                res.send(' This book is added to database, name: ' + req.body.name + ' price ' + req.body.price);
        });
    });

    app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {
                availableBooks: result
            });
            console.log(newData)
            res.render("bargains.ejs", newData)
        });
    });

    app.get('/login', function(req, res) {
        res.render('login.ejs', shopData);
    });

    app.post('/loggedin', function(req, res) {
        const username = req.body.username;
        const password = req.body.password;

        // select the hashed password for the user from the database
        let sqlQuery = "SELECT hashedPassword FROM userDetails WHERE username = ?";
        db.query(sqlQuery, [username], (err, result) => {
            if (err) {
                // handle other errors (e.g., database connection issues)
                console.error(err);
                return res.status(500).send("Error accessing the database. Please try again later.");
            }

            // check if the user was found in the database
            if (result.length > 0) {
                const hashedPassword = result[0].hashedPassword;

                // compare the password supplied with the password retrieved from the database
                bcrypt.compare(password, hashedPassword, function(err, result) {
                    if (err) {
                        // handle bcrypt compare error
                        console.error(err);
                        return res.status(500).send("Error. Please try again later.");
                    } else if (result == true) {
                        // passwords match, user is logged in
                        // Send HTML response with "Return to Homepage" button
                        res.send(`
                            <p>Login successful!</p>
                            <a href="/">Return to Homepage</a>
                        `);
                    } else {
                        // passwords do not match
                        res.send("Incorrect username or password.");
                    }
                });
            } else {
                // user not found in the database
                res.send("User not found.");
            }
        });
    });

    app.get('/deleteuser', function(req, res) {
        res.render('deleteuser.ejs', {
            message: ''
        }); // passing an empty message initially
    });

    app.post('/deleteuser', function(req, res) {
        const usernameToDelete = req.body.username;

        // perform the delete operation in the database
        let deleteQuery = "DELETE FROM userDetails WHERE username = ?";
        db.query(deleteQuery, [usernameToDelete], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error deleting user. Please try again later.");
            }

            if (result.affectedRows > 0) {
                // user deleted successfully
                res.render('deleteUser.ejs', {
                    message: `User '${usernameToDelete}' deleted successfully.`
                });
            } else {
                // no user found with the provided username
                res.render('deleteUser.ejs', {
                    message: `No user found with the username '${usernameToDelete}'.`
                });
            }
        });
    });
}