from flask import Flask
app = Flask(__name__)


import datetime

import pymongo
from pymongo import MongoClient
with open('../MongoDB/pass', 'r') as inFile:
    link = str(inFile.readline()[:-1])

client = MongoClient(link)
db = client.test_database




@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/add_info')
def addInfos():
	post = {"author": "Nathalie", "text": "My first blog post!","tags": ["mongodb", "python", "pymongo"],"date": datetime.datetime.utcnow()}
	posts = db.posts
	post_id = posts.insert_one(post).inserted_id
	print(post_id)
	return 'success'

@app.route('/get_info')
def getInfos():
	posts = db.posts
	post = posts.find_one({"author": "Mike"})
	print(post)
	return str(post)


app.run("localhost", 5000, debug=True)