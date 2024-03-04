const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');
const bodyParser = require('body-parser');
const { Employee, getAllTablesAndStructure }  = require('./src/public/model/models');
const { Sequelize } = require('sequelize');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory for views
app.set('views', path.join(__dirname, 'src', 'public', 'views'));

// Serve static files from the 'src/public' directory
app.use(express.static(path.join(__dirname, 'src', 'public','views')));

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
const uploadFolder = 'uploads';
const uploadFolderPath = path.join(__dirname, uploadFolder);
if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath);
}

// Initialize multer
const upload = multer({ dest: uploadFolderPath });


let dt = [];
app.post('/sendfiles', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Check file type synchronously
    const fileType = path.extname(file.originalname).toLowerCase();
    if (fileType !== '.xlsx' && fileType !== '.csv') {
        return res.status(400).send('Unsupported file format. Please upload an Excel file (xlsx) or CSV file.');
    }

    try {
        // Read and process file asynchronously
        if (fileType === '.xlsx') {
            // Read Excel file
            const workbook = await xlsx.readFile(file.path);

            // Convert first sheet to JSON
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const excelData = xlsx.utils.sheet_to_json(worksheet);

            console.log(excelData);
            return res.render('uploadexcelfiles', { dt: excelData });
        } else if (fileType === '.csv') {
            // Read CSV file asynchronously
            const csvData = [];
            const fileStream = fs.createReadStream(file.path);

            fileStream.pipe(csvParser())
                .on('data', (row) => {
                    csvData.push(row);
                });

            await new Promise((resolve, reject) => {
                fileStream.on('end', () => {
                    console.log(csvData);
                    res.render('uploadexcelfiles', { dt: csvData });
                    resolve();
                });

                fileStream.on('error', (err) => {
                    reject(err);
                });
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Error while processing file.');
    }
});

// Example route to retrieve all employees
app.get('/employees', async (req, res) => {
    try {
      const employees = await Employee.findAll();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: 'Error fetching employees' });
    }
  });
  
  // Example route to create a new employee
  app.post('/employees', async (req, res) => {
    const { Nom, Prenom, Departement, Email, Date } = req.body;
    try {
      const newEmployee = await Employee.create({ Nom, Prenom, Departement, Email, Date });
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ error: 'Error creating employee' });
    }
  });



app.get('/sendfiles', (req, res) => {
    res.render('uploadexcelfiles', { dt });
});

// Define your routes
let messages = 'Welcome to our website!';
app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/', (req, res) => {
    res.render('home');
});


const sidebarItems = [
    'etudiant',
    'stages',
    'enseignant',
    'encadrant',
    'sendfiles',
    'database'
];

// Dynamically create routes for each sidebar item
sidebarItems.forEach(item => {
    app.get(`/${item}`, (req, res) => {
        res.render(item);
    });
});
// Start the server
getAllTablesAndStructure()
  .then(tablesStructure => {
    console.log('Tables and their structures:', tablesStructure);
  })
  .catch(error => {
    console.error('Error:', error);
  });

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
