const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const BASE_URL = "http://127.0.0.1:5000";

const getAllBooks = () =>
  new Promise((resolve) => {
    resolve(books);
  });

const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/books/${isbn}`).then((response) => response.data);

const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/books/author/${encodeURIComponent(author)}`);
  return response.data;
};

const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/books/title/${encodeURIComponent(title)}`);
  return response.data;
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  const allBooks = await getAllBooks();
  return res.status(200).json(allBooks);
});

public_users.get('/books/author/:author',function (req, res) {
  const author = req.params.author.toLowerCase();
  const matchedBooks = Object.entries(books).reduce((result, [isbn, book]) => {
    if (book.author.toLowerCase() === author) {
      result[isbn] = book;
    }

    return result;
  }, {});

  return res.status(200).json(matchedBooks);
});

public_users.get('/books/:isbn',function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({ [isbn]: book });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const { isbn } = req.params;

  try {
    const book = await getBookByISBN(isbn);
    return res.status(200).json(book);
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { message: "Unable to retrieve book" });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const matchedBooks = await getBooksByAuthor(req.params.author);
    return res.status(200).json(matchedBooks);
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { message: "Unable to retrieve books by author" });
  }
});

public_users.get('/books/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const matchedBooks = Object.entries(books).reduce((result, [isbn, book]) => {
    if (book.title.toLowerCase() === title) {
      result[isbn] = book;
    }

    return result;
  }, {});

  return res.status(200).json(matchedBooks);
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const matchedBooks = await getBooksByTitle(req.params.title);
    return res.status(200).json(matchedBooks);
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { message: "Unable to retrieve books by title" });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
