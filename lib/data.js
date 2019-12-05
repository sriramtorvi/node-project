/*
Library for storing data
*/

//Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};

// Base directory 
lib.baseDir = path.join(__dirname,'/../.data/');

//write data to a file
lib.create = (dir,file,data,callback) => {
    //Open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',(err,fileDescriptor) => {
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);

            //write to file and close it
            fs.writeFile(fileDescriptor,stringData,(err) => {
                if(!err){
                    fs.close(fileDescriptor,(err) =>{
                        if(!err){
                            callback(false);
                        } else {
                            callback('Error while closing file')
                        }
                    });
                } else {
                    callback('Error writing to file');
                }
            });
        } else {
            callback('Could not create new file, file already exist');
        }
    });
};

//Read data from file
lib.read = (dir,file,callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',(err,data) => {
        if(!err && data) {
            let parsedData = helpers.parsedJsonToObject(data);
            callback(false,parsedData);
        } else {
            callback(err,data);
        }
    });
};

//Update data inside a file
lib.update = (dir,file,data,callback) => {
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',(err,fileDescriptor) => {
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);

            //Using ftruncate as truncate is deprecated
            fs.ftruncate(fileDescriptor,(err) => {
                if(!err){
                    //write to file
                    fs.writeFile(fileDescriptor,stringData,(err) => {
                        if(!err){
                            //Close the file
                            fs.close(fileDescriptor,(err) => {
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Error closing file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file')
                        }
                    });
                } else {
                    callback('Error truncating the file')
                }
            });
        } else {
            callback('Could not open file,it may not exist');
        }
    });
};

//Delete file
lib.delete = (dir,file,callback) => {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',(err) => {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting file')
        }
    });
};

//Export the module
module.exports = lib;