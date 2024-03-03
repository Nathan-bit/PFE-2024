const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory for views
app.set('views', path.join(__dirname, 'src', 'public', 'views'));

// Serve static files from the 'src/public' directory
app.use(express.static(path.join(__dirname, 'src', 'public')));

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const upload = multer({ dest: 'uploads/' });

let dt = [];

app.post('/sendfiles/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Check file type
    const fileType = path.extname(file.originalname).toLowerCase();
    if (fileType !== '.xlsx' && fileType !== '.csv') {
        return res.status(400).send('Unsupported file format. Please upload an Excel file (xlsx) or CSV file.');
    }

    // Read file and convert to JSON
    if (fileType === '.xlsx') {
        // Read Excel file
        const workbook = xlsx.readFile(file.path);

        // Convert first sheet to JSON
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = xlsx.utils.sheet_to_json(worksheet);

        dt = excelData;
        console.log(dt);
        res.render('uploadexcelfiles', { dt });
    } else if (fileType === '.csv') {
        // Read CSV file
        const csvData = [];
        fs.createReadStream(file.path)
            .pipe(csvParser())
            .on('data', (row) => {
                csvData.push(row);
            })
            .on('end', () => {
                dt = csvData;
                console.log(dt);
                res.render('uploadexcelfiles', { dt });
            });
    }
});

app.get('/sendfiles', (req, res) => {
    res.render('uploadexcelfiles', { dt });
});

// Define your routes
let messages = 'Welcome to our website!';
app.get('/home', (req, res) => {
    res.render('home', { message: messages });
});

let message = "Message from index";
app.get('/', function (req, res) {
    res.render('index', { message: message });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
