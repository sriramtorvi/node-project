

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

//Handlers
let handlers = {};


handlers.users = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
};

//container user submethod  
handlers._users = {};

//Users - post
//Required data firstName, lastName, phone, password, tosAgreement
handlers._users.post = (data,callback) => {
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        //Make sure user doesn't already exists
        _data.read('users',phone, (err, data) => {
            if(err) {
                let hashedPassword = helpers.hash(password);

                if(hashedPassword){ 
                    //create user
                    const userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    _data.create('users',phone,userObject,(err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create new user'});
                        }
                    });
                } else {
                    callback(500, {'Error' : 'Could not hash user\'s password'});
                }
            } else {
                callback(400, {'Error' : 'User already exists'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }

};

// users get
// required data - phone
handlers._users.get = (data,callback) => {
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone.trim() : false;
    if (phone){
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
            if(tokenIsValid) {
                //Lookup for user
                _data.read('users',phone,(err,data) => {
                    if(!err && data) {
                        // Delete hashed password before returning the object
                        delete data.hashedPassword;
                        callback(200,data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{'Error' : 'Missing or invalid token'});
            }
        });
        
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};
//users put
// required field - phone
// option fields - firstName, lastName, password (atleast one of them)
handlers._users.put = (data,callback) => {
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10? data.payload.phone.trim() : false;

    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    if(phone){
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
            if(tokenIsValid) {
                if(firstName || lastName || password){
                    _data.read('users',phone,(err,userData) => {
                        if(!err && userData){
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //store user data
                            _data.update('users',phone,userData,(err) => {
                                if(!err){
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500,{'Error' : 'Could not update user'});
                                }
                            });
                        } else {
                            callback(400,{'Error' : 'Specified user does not exists'});
                        }
                    });
        
                } else {
                    callback(400,{'Error' : 'Missing fields to update'});
                }
            } else {
                callback(403,{'Error' : 'Missing or invalid token'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }


};
//users delete
// Required fields - phone
handlers._users.delete = (data,callback) => {
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone.trim() : false;
    if (phone){
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
            if(tokenIsValid) {
                //Lookup for user
                _data.read('users',phone,(err,data) => {
                    if(!err && data) {
                        _data.delete('users',phone,(err) => {
                            if(!err){
                                callback(200);
                            } else{
                                callback(500,{'Error' : 'Could not delete the specified user'});
                            }
                        })
                    } else {
                        callback(400,{'Error' : 'Could not find the specified user'});
                    }
                });                
            } else {
                callback(403,{'Error' : 'Missing or invalid token'});
            }
        });
       
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};


//Tokens
handlers.tokens = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {};

//token post
handlers._tokens.post = (data,callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password) {
        _data.read('users',phone,(err,userData) => {
            if(!err && userData){
                let hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    //Create token with expiration of 1 hour
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    _data.create('tokens',tokenId,tokenObject,(err) => {
                        if(!err){
                            callback(200,tokenObject);
                        } else {
                            callback(500,{'Error' : 'Could not create token'});
                        }
                    });
                } else {
                    callback(400,{'Error' : 'Password did not match specified user\'s stored password'});
                }
            } else {
                callback(400,{'Error' : 'Could not find specified user'});
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field(s)'})
    }
};

//token get
//Required fields - id
handlers._tokens.get = (data,callback) => {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        //Lookup for tokens
        _data.read('tokens',id,(err,tokenData) => {
            if(!err && tokenData) {
                callback(200,tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

//token put
handlers._tokens.put = (data,callback) => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        _data.read('tokens',id,(err,tokenData) => {
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens',id,tokenData,(err) => {
                        if(!err){
                            callback(200);
                        } else {
                            callback(500,{'Error' : 'Could not update the token\'s expiration'});
                        }
                    });
                } else {
                    callback(400,{'Error' : 'Token already expired'});
                }
            } else {
                callback(400,{'Error' : 'Specified token does not expires'});
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required fields'});
    }
};

//users delete
// Required fields - phone
handlers._tokens.delete = (data,callback) => {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20? data.queryStringObject.id.trim() : false;
    if (id){
        //Lookup for token
        _data.read('tokens',id,(err,data) => {
            if(!err && data) {
                _data.delete('tokens',id,(err) => {
                    if(!err){
                        callback(200);
                    } else{
                        callback(500,{'Error' : 'Could not delete the specified token'});
                    }
                })
            } else {
                callback(400,{'Error' : 'Could not find the specified token'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// Verify token
handlers._tokens.verifyToken = (id,phone,callback) => {
    _data.read('tokens',id,(err,tokenData) => {
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Checks
handlers.checks = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data,callback);
    } else {
        callback(405);
    }
};

// Container for checks
handlers._checks = {};

// checks - post
handlers._checks.post = (data,callback) => {
    let protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    let method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;     

    if(protocol && url && method && successCodes && timeoutSeconds) {
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens',token,(err,tokenData) => {
            if(!err && tokenData) {
                let userPhone = tokenData.phone;
                _data.read('users',userPhone,(err,userData) => {
                    if(!err && userPhone) { 
                        let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        if(userChecks.length < config.maxChecks) {

                        } else {
                            callback(400,{'Error' : 'The user already has maximum number of checks ('+config.maxChecks+')'});
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required fields'});
    }
};



handlers.ping = (data,callback) => {
    //callback
    callback(200);
};

handlers.notFound = (data,callback) => {
    callback(404);
};

module.exports = handlers;