const express = require('express')
let books = require('./booksdb.js')
let isValid = require('./auth_users.js').isValid
let users = require('./auth_users.js').users
const public_users = express.Router()
const jwt = require('jsonwebtoken')
const session = require('express-session')
const axios = require('axios')

public_users.use(
	session({secret: 'fingerpint'}, (resave = true), (saveUninitialized = true))
)

public_users.post('/register', (req, res) => {
	const username = req.body.username
	const password = req.body.password

	if (username && password) {
		if (!isValid(username)) {
			users.push({username: username, password: password})
			return res.status(200).json({
				message: 'User successfully registered. Now you can login',
			})
		} else {
			return res.status(404).json({message: 'User already exists!'})
		}
	}
	return res.status(404).json({message: 'Unable to register user.'})
})

const getAllBooks = async () => {
	try {
		const allBooksPromise = await Promise.resolve(books)
		if (allBooksPromise) {
			return allBooksPromise
		} else {
			return Promise.reject(new Error('No books found.'))
		}
	} catch (err) {
		console.log(err)
	}
}

public_users.get('/', async function (req, res) {
	const data = await getAllBooks()
	res.json(data)
})

const getBooksDetailsByISBN = async isbn => {
	try {
		const ISBNPromise = await Promise.resolve(isbn)
		if (ISBNPromise) {
			return Promise.resolve(isbn)
		} else {
			return Promise.reject(new Error('Could not retrieve ISBN Promise.'))
		}
	} catch (error) {
		console.log(error)
	}
}

public_users.get('/isbn/:isbn', async (req, res) => {
	const isbn = req.params.isbn
	const data = await getBooksDetailsByISBN(isbn)
	res.send(books[data])
})

const findAuthor = async author => {
	try {
		if (author) {
			const newAuthorArray = []
			Object.values(books).map(book => {
				if (book.author === author) {
					newAuthorArray.push(book)
				}
			})
			return Promise.resolve(newAuthorArray)
		} else {
			return Promise.reject(
				new Error('Could not retrieve Author Promise.')
			)
		}
	} catch (error) {
		console.log(error)
	}
}

public_users.get('/author/:author', async (req, res) => {
	const author = req.params.author
	const data = await findAuthor(author)
	res.send(data)
})

const findTitle = async title => {
	try {
		if (title) {
			const newTitleArray = []
			Object.values(books).map(book => {
				if (book.title === title) {
					newTitleArray.push(book)
				}
			})
			return Promise.resolve(newTitleArray)
		} else {
			return Promise.reject(
				new Error('Could not retrieve Author Promise.')
			)
		}
	} catch (error) {
		console.log(error)
	}
}

// Get all books based on title
public_users.get('/title/:title', async (req, res) => {
	const title = req.params.title
	const data = await findTitle(title)
	res.send(data)
})

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
	const reviewISBN = req.params.isbn

	Object.entries(books).map(book => {
		if (book[0] === reviewISBN) {
			res.send(book[1].reviews)
		}
	})
})


const authenticatedUser = (username, password) => {
	const matchingUsers = users.filter(
		user => user.username === username && user.password === password
	)
	return matchingUsers.length > 0
}

public_users.post('/login', (req, res) => {
	const username = req.body.username
	const password = req.body.password

	if (!username || !password) {
		return res.status(404).json({message: 'Error logging in'})
	}

	if (authenticatedUser(username, password)) {
		let accessToken = jwt.sign(
			{
				data: password,
			},
			'my_secret_key',
			{expiresIn: 60 * 60}
		)

		req.session.authorization = {
			accessToken,
			username,
		}
		return res.status(200).send('User successfully logged in')
	} else {
		return res
			.status(208)
			.json({message: 'Invalid Login. Check username and password'})
	}
})

public_users.put('/auth/review/:isbn', (req, res) => {
	const isbn = req.params.isbn
	const review = req.body.review
	const username = req.session.authorization.username
	if (books[isbn]) {
		let book = books[isbn]
		book.reviews[username] = review
		return res.status(200).send('Review successfully posted')
	} else {
		return res.status(404).json({message: `ISBN ${isbn} not found`})
	}
})

public_users.delete('/auth/review/:isbn', (req, res) => {
	const isbn = req.params.isbn
	const username = req.session.authorization.username
	if (books[isbn]) {
		let book = books[isbn]
		delete book.reviews[username]
		return res.status(200).send('Review successfully deleted')
	} else {
		return res.status(404).json({message: `ISBN ${isbn} not found`})
	}
})

module.exports.general = public_users