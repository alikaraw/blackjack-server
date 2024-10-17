/* IMPORTS */
let mysql = require('mysql');

require("dotenv").config();

// let multer = require("multer");
// let path = require("path");
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './item_Images')
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// })
// const upload = multer({ storage: storage })

/* FUNCTIONS */

function CreateSQLConnection(){
    return mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_DATABASE
    });
}

function getCurrentTime() {
    let timeWithOffset = new Date().getTime() - (new Date().getTimezoneOffset() * 60000);
    return new Date(timeWithOffset).toISOString().slice(0, 19).replace('T', ' ');
}

function validateUser(conn, username, password) {
    return new Promise((resolve, reject) => {
        conn.query("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) reject(err)
            resolve(result.length == 1);  
        })
    })
}

/* EXPORTS FOR API */

exports.signup = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let last_login = q.query.last_login;
    let weekly_streak = q.query.weekly_streak;
    let balance = q.query.balance;
    
    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        // try register new user 
        conn.query("INSERT INTO users(username, password, last_login, weekly_streak, balance) VALUES (?, ?, ?, ?, ?)", [username, password, last_login, weekly_streak, balance], (err, result) => {
            if(err) {
                conn.destroy();
                if(err.code = 'ER_DUP_ENTRY') { // user is taken
                    res.writeHead(409, {'Content-type': 'text/plain'});
                    res.end('Username is already taken!');
                } else { // other errors
                    res.writeHead(500, {'Content-type':'text/plain'});
                    res.end('Error signing up.');
                }
                return;
            }

            // user registered
            conn.destroy();
            res.writeHead(200, {'Content-type':'text/plain'});
            res.end("Signed up successfully!");
        })
    })
};

exports.login = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let last_login = q.query.last_login;
    
    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        conn.query("UPDATE users SET last_login=? WHERE username=? AND password=?", [last_login, username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error loggin in.');
                return;
            }

            conn.destroy();
            if(result.affectedRows == 1) {
                res.writeHead(200, {'Content-type':'text/plain'});
                res.end("Login successfully!");
            } else {
                res.writeHead(401, {'Content-type':'text/plain'});
                res.end("Username or password is incorrect!");
            }
        })
    })
};

exports.getBalance = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        conn.query("SELECT balance from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error getting balance');
                return;
            }

            conn.destroy();
            if(result.length == 1) {
                res.writeHead(200, {'Content-type':'application/json'});
                res.end(JSON.stringify(result));
            } else {
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error getting balance.');
            }
        })
    })
}

exports.setBalance = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let balance = q.query.balance;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        conn.query("UPDATE users SET balance=? WHERE username=? AND password=?", [balance , username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error updating balance');
                return;
            }

            conn.destroy();
            if(result.affectedRows == 1) {
                res.writeHead(200, {'Content-type':'text/plain'});
                res.end('updated player balance');
            } else {
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error updating balance');
            }
        });
    })
}

exports.dailyClaim = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }
        
        conn.query("SELECT last_daily_reward, balance from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error claiming daily reward');
                return;
            }
                        
            let userBalace = result[0].balance;
            let oneDayLater = (result[0].last_daily_reward != null) ? (result[0].last_daily_reward.getTime() + (1 * 24 * 60 * 60 * 1000)) : 0;
            let currentDate = new Date().getTime();
            
            if(oneDayLater < currentDate) { // claim reward
                conn.query("UPDATE users SET last_daily_reward=?, balance=? WHERE username=? AND password=?", [getCurrentTime(), userBalace + 1500, username, password], (err, result) => {
                    if(err) {
                        conn.destroy();
                        res.writeHead(500, {'Content-type':'text/plain'});
                        res.end('Error claiming daily reward');
                        return;
                    }

                    conn.destroy();
                    if(result.affectedRows == 1) {
                        res.writeHead(200, {'Content-type':'text/plain'});
                        res.end();
                    } else {
                        res.writeHead(500, {'Content-type':'text/plain'});
                        res.end('Error claiming daily reward');
                    }
                })
            } else { // a day didnt pass
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Still haven\'t passed 24h from last claim daily reward!');
            }
        })
    })
}

exports.dailyTime = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }
        
        conn.query("SELECT last_daily_reward from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error getting daily reward time');
                return;
            }

            conn.destroy();
            if(result.length == 1) {
                res.writeHead(200, {'Content-type':'application/json'});
                res.end(JSON.stringify(result[0]));
            } else {
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error retriving daily reward time.');
            }
        })
    })
}

exports.weeklyClaim = (req, res, q) => {
    const WeeklyRewards = [
        250, // day 1
        500,
        750,
        1000,
        1250,
        1250,
        1500, // day 7
    ];    

    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }
        
        conn.query("SELECT last_weekly_reward, weekly_streak, balance from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error claiming weekly reward');
                return;
            }

            let weeklyLastReward = (result[0].last_weekly_reward  != null) ? (result[0].last_weekly_reward.getTime()) : 0;
            let oneDayLater = (weeklyLastReward) ? (weeklyLastReward + (1 * 24 * 60 * 60 * 1000)) : 0;
            let twoDayLater = (weeklyLastReward) ? (weeklyLastReward + (2 * 24 * 60 * 60 * 1000)) : 0;
            let weeklyStreak = (result[0].weekly_streak != null) ? (result[0].weekly_streak) : 0;
            let currentDate = new Date().getTime();

            let newBalance = result[0].balance + WeeklyRewards[weeklyStreak % 7] * ((Math.floor(weeklyStreak / 7) * 0.5) + 1);
            
            if(
                weeklyLastReward == 0 || // new streak
                (oneDayLater < currentDate && currentDate < twoDayLater) // next reward
            ) { // never claimed / lost streak                
                conn.query("UPDATE users SET last_weekly_reward=?, weekly_streak=?, balance=? WHERE username=? AND password=?", [getCurrentTime(), weeklyStreak + 1, newBalance , username, password], (err, result) => {
                    if(err) {                        
                        conn.destroy();
                        res.writeHead(500, {'Content-type':'text/plain'});
                        res.end('Error claiming weekly reward');
                        return;
                    }

                    conn.destroy();
                    if(result.affectedRows == 1) {
                        res.writeHead(200, {'Content-type':'text/plain'});
                        res.end();
                    } else {
                        res.writeHead(500, {'Content-type':'text/plain'});
                        res.end('Error claiming weekly reward');
                    }
                })
            } else { // failed to claim weekly reward in time
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error claiming weekly reward');
            }
        })
    })
}

exports.weeklyTime = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }
        
        conn.query("SELECT last_weekly_reward, weekly_streak from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error getting weekly reward time');
                return;
            }

            conn.destroy();
            if(result.length == 1) {
                res.writeHead(200, {'Content-type':'application/json'});
                res.end(JSON.stringify(result[0]));
            } else {
                res.writeHead(500, {'Content-type':'text/plain'});
                res.end('Error retriving weekly reward time.');
            }
        })
    })
}

exports.weeklyCheckStreak = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect((err) => {
        if(err) { // can't connect to database            
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        conn.query("SELECT last_weekly_reward from users WHERE username=? AND password=?", [username, password], (err, result) => {
            if(err) {
                conn.destroy();
                res.writeHead(500, {'Content-type': 'text/plain'});
                res.end('Error checking weekly streak');
                return;
            }
            
            let weeklyLastReward = (result[0].last_weekly_reward  != null) ? (result[0].last_weekly_reward.getTime()) : 0;
            let twoDayLater = (weeklyLastReward) ? (weeklyLastReward + (2 * 24 * 60 * 60 * 1000)) : 0;
            let currentDate = new Date().getTime();

            if(currentDate < twoDayLater) {
                conn.destroy();
                res.writeHead(200, {'Content-type': 'text/plain'});
                res.end('Weekly streak can continue');
            } else {
                conn.query("UPDATE users SET last_weekly_reward=NULL, weekly_streak=0 WHERE username=? AND password=?", [username, password], (err, result) => {
                    if(err) {
                        conn.destroy();
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error checking weekly streak');
                        return;
                    }

                    conn.destroy();
                    if(result.affectedRows == 1) {
                        res.writeHead(200, {'Content-type': 'text/plain'});
                        res.end('Weekly streak reseted');
                    } else {
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error resetting weekly streak');
                    }
                })
            }
        })
    })
}

exports.friends = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;

    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        let isUserValid = await validateUser(conn, username, password);
        
        if(isUserValid) {            
            conn.query('SELECT friends.username FROM (SELECT receiver as username FROM friend_requests WHERE sender=? and accepted=1 UNION ALL SELECT sender as username FROM friend_requests WHERE receiver=? and accepted=1) as friends JOIN users on users.username = friends.username', [username, username], (err, result) => {
                if(err) {
                    conn.destroy();
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error getting friend list');
                    return;
                }

                let Friends = [];
                for (let iFriend = 0; iFriend < result.length; iFriend++) {
                    Friends.push(result[iFriend].username)
                }
                
                conn.destroy();
                res.writeHead(200, {'Content-type': 'application/json'});
                res.end(JSON.stringify(Friends));
                return;
            })
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('ERROR: Invalid user');
        }
    })
}

exports.friendAdd = (req, res, q) => {
    let sender = q.query.sender;
    let password = q.query.password;
    let receiver = q.query.receiver;

    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        let isUserValid = await validateUser(conn, sender, password)

        if(isUserValid) {
            conn.query("SELECT * FROM users WHERE username=?", [receiver], (err, result) => {
                if(err) {
                    conn.destroy();
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error sending friend request');
                    return;
                }

                if(result.length == 1) {
                    // get requests
                    conn.query("SELECT * FROM friend_requests WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)", [sender, receiver, receiver, sender], (err, result) => {
                        if(err) {
                            conn.destroy();
                            res.writeHead(500, {'Content-type': 'text/plain'});
                            res.end('Error sending friend request');
                            return;
                        }

                        // the users never sent each other friend requests
                        // so now send friend request
                        if(result.length == 0) {
                            conn.query("INSERT INTO friend_requests (sender, receiver, accepted) VALUES (?, ?, 0)", [sender, receiver], (err, result) => {
                                conn.destroy();

                                if(err) { 
                                    res.writeHead(500, {'Content-type': 'text/plain'});
                                    res.end('Error sending friend request');
                                } else {
                                    res.writeHead(200, {'Content-type': 'text/plain'});
                                    res.end('Friend request sent.');
                                }
                            })
                        } else { // length = 1
                            if(result[0].accepted) { // already friends
                                conn.destroy();
                                res.writeHead(500, {'Content-type': 'text/plain'});
                                res.end('Already friends');
                            } else if(result[0].sender == sender) {  // already sent friend request
                                conn.destroy();
                                res.writeHead(500, {'Content-type': 'text/plain'});
                                res.end('Already send friend request for user');
                            } else { // receiver sent friend request to sender before so accept it
                                conn.query("UPDATE friend_requests SET accepted=1 WHERE sender=? AND receiver=?", [receiver, sender], (err, result) => {
                                    if(err) {
                                        conn.destroy();
                                        res.writeHead(500, {'Content-type': 'text/plain'});
                                        res.end('Error accepting friend request from receiver');
                                        return;
                                    }

                                    conn.destroy();
                                    if(result.affectedRows == 1) {
                                        res.writeHead(200, {'Content-type': 'text/plain'});
                                        res.end('Friend request accept from receiver');
                                    } else {
                                        res.writeHead(500, {'Content-type': 'text/plain'});
                                        res.end('Error accepting friend request from receiver');
                                    }
                                })
                            }
                        }
                    })
                } else {
                    conn.destroy();
                    res.writeHead(400, {'Content-type': 'text/plain'});
                    res.end('User dosen\'t exist.');
                }
            })
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('ERROR: Invalid user');
        }
    })
}

exports.friendRequests = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    
    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) { // can't connect to database
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        let isUserValid = await validateUser(conn, username, password);

        if(isUserValid) {
            conn.query("SELECT * FROM friend_requests WHERE accepted=0 AND (sender=? OR receiver=?)", [username, username], (err, result) => {
                if(err) {
                    conn.destroy();
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error loading friend requests');
                }
                
                let Requests = {
                    sent: [],
                    incoming: []
                }

                for(let iRow = 0; iRow < result.length; iRow++) {
                    if(result[iRow].sender == username) {
                        Requests.sent.push(result[iRow].receiver)
                    } else {
                        Requests.incoming.push(result[iRow].sender)
                    }
                }
                
                conn.destroy();
                res.writeHead(200, {'Content-type':'application/json'});
                res.end(JSON.stringify(Requests));
            })
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('Invalid user');
        }
    })
}

exports.friendCancel = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let cancel = q.query.cancel;

    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) {
            conn.destroy();
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            return;
        }

        let isUserValid = await validateUser(conn, username, password);

        if(isUserValid) {
            conn.query('DELETE FROM friend_requests WHERE accepted=0 AND sender=? AND receiver=?', [username, cancel], (err, result) => {
                if(err) {
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error canceling friend request');
                    conn.destroy();
                    return;
                }

                conn.destroy();
                if(result.affectedRows == 1) {
                    res.writeHead(200, {'Content-type': 'text/plain'});
                    res.end('Canceled friend request');
                } else {
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error canceling friend request');
                }
            })
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('ERROR: Invalid user');
        }
    })
}

exports.friendAction = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let sender = q.query.sender;
    let action = q.query.action;

    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) {
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            conn.destroy();
            return;
        }

        let isUserValid = await validateUser(conn, username, password);

        if(isUserValid) {
            if(action == '1') { // accept request
                conn.query('UPDATE friend_requests SET accepted=1 WHERE sender=? AND receiver=?', [sender, username], (err, results) => {
                    if(err) {
                        conn.destroy();
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error accepting friend request');
                        return;
                    }

                    conn.destroy();
                    if(results.affectedRows == 1) {
                        res.writeHead(200, {'Content-type': 'text/plain'});
                        res.end('Friend request accepted');
                    } else {
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error accepting friend request');
                    }
                })
            } else { // reject request
                conn.query('DELETE FROM friend_requests WHERE sender=? AND receiver=?', [sender, username], (err, results) => {
                    if(err) {
                        conn.destroy();
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error rejecting friend request');
                        return;
                    }

                    conn.destroy();
                    if(results.affectedRows == 1) {
                        res.writeHead(200, {'Content-type': 'text/plain'});
                        res.end('Friend request rejected');
                    } else {
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end('Error rejecting friend request');
                    }
                })
            }
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('ERROR: Invalid user');
        }
    })
}

exports.friendRemove = (req, res, q) => {
    let username = q.query.username;
    let password = q.query.password;
    let target = q.query.target;

    let conn = CreateSQLConnection();
    conn.connect(async (err) => {
        if(err) {
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end('Can\'t connect to database!');
            conn.destroy();
            return;
        }

        let isUserValid = await validateUser(conn, username, password);

        if(isUserValid) {
            conn.query("DELETE FROM friend_requests WHERE (accepted=1 AND sender=? AND receiver=?) OR (accepted=1 AND sender=? AND receiver=?)", [username, target, target, username], (err, result) => {
                if(err) {
                    conn.destroy();
                    res.writeHead(400, {'Content-type': 'text/plain'});
                    res.end('Error removing friend');
                    return;
                }

                conn.destroy();
                if(result.affectedRows == 1) {
                    res.writeHead(200, {'Content-type': 'text/plain'});
                    res.end('Removed friend');
                } else {
                    res.writeHead(500, {'Content-type': 'text/plain'});
                    res.end('Error removing friend');
                }
            })
        } else {
            conn.destroy();
            res.writeHead(401, {'Content-type': 'text/plain'});
            res.end('ERROR: Invalid user');
        }
    })
}