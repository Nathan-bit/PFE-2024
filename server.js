const express = require('express');
const iconv = require('iconv-lite');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');
const bodyParser = require('body-parser');
const unidecode = require('unidecode');
const sequelize = require('sequelize');
const {   Employer, Etudiant , getAllTablesAndStructure }  = require('./src/public/model/models');
const mysql = require('mysql');
const moment = require('moment');

const app = express();
const port = 3000;

/*  const connection = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    database: 'test',
    password: '',
    port: 3306,
  });
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database: ', err);
      return;
    }
    console.log('Connected to MySQL database');
  }); */
 
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
            let excelData = xlsx.utils.sheet_to_json(worksheet);

            // Apply unidecode to keys
            excelData = excelData.map((row) => {
                const transformedRow = {};
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        const newKey = unidecode(key).replace(/[^\w\s]/gi, ''); // Remove special characters and convert accented characters
                        transformedRow[newKey] = row[key];
                    }
                }
                return transformedRow;
            });

          //  console.log(excelData);
            return res.render('uploadexcelfiles', { dt: excelData ,items: items});
        } else if (fileType === '.csv') {
            // Read CSV file asynchronously
            const csvData = [];

            fs.createReadStream(file.path, { encoding: 'latin1' })
                .pipe(csvParser())
                .on('data', (row) => {
                    // Remove special characters and convert accented characters
                    const transformedRow = {};
                    for (const key in row) {
                        if (row.hasOwnProperty(key)) {
                            const newKey = unidecode(key).replace(/[^\w\s]/gi, ''); // Remove special characters and convert accented characters
                            transformedRow[newKey] = row[key];
                        }
                    }
                    csvData.push(transformedRow);
                })
                .on('end', () => {
                  //  console.log(csvData);

                    res.render('uploadexcelfiles', { dt: csvData ,items: items});
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                    return res.status(500).send('Error while processing file.');
                });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Error while processing file.');
    }
});

app.get('/sendfiles', (req, res) => {
    res.render('uploadexcelfiles',{dt, items: items });
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
let items =[]
getAllTablesAndStructure()
  .then(tablesStructure => {
        items=tablesStructure
   //console.log('Tables and their structures:', items);
  })
  .catch(error => {
    console.error('Error:', error);
  });

  
 /*  app.post('/saveToDatabase', async (req, res) => {
    try {
        // Extract data from the request body
        let { Data, Options, TableName } = req.body;
        
        // Parse Data if it's a string
        if (typeof Data === 'string') {
            Data = JSON.parse(Data);
        }
         
        console.log(Data, Options, TableName);

        // Construct the SQL query based on Options
        let sqlQuery;
        let values = [];
        if (Options == '1') {
            // Insert new data only
            sqlQuery = `INSERT INTO ${TableName} (${Object.keys(Data[0]).join(', ')}) VALUES ?`;
            values = Data.map(item => Object.values(item));
        } else if (Options == '2') {
            // Insert new data and update old data
            sqlQuery = `INSERT INTO ${TableName} (${Object.keys(Data[0]).join(', ')}) VALUES ? ON DUPLICATE KEY UPDATE `;
            const updateValues = Object.keys(Data[0]).map(key => `${key} = VALUES(${key})`).join(', ');
            sqlQuery += updateValues;
            values = Data.map(item => Object.values(item));
        } else {
            // Respond with error message for invalid Options
            return res.status(400).json({ message: 'Invalid Options value' });
        }

        // Execute the SQL query
        connection.query(sqlQuery, [values], (error, results, fields) => {
            if (error) {
                // Respond with error message
                return res.status(500).json({ message: 'Error saving data', error: error.message });
            }
            // Sending response after query execution
            res.status(200).json({ message: 'Data inserted and updated successfully' });
        });
    } catch (error) {
        // Respond with error message
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
});
 */
/* 
   app.post('/saveToDatabase', async (req, res) => {
    try {
        // Extract data from the request body
        const { Data, Options, TableName } = req.body;

        // Get the appropriate model based on TableName
        const Model = sequelize.models[TableName];

        if (!Model) {
            // Respond with error message for invalid TableName
            return res.status(400).json({ message: 'Invalid TableName value' });
        }

        if (Options == '1') {
            // Insert new data only
            await Promise.all(Data.map(async (item) => {
                await Model.bulkCreate(item);
            }));
            res.status(200).json({ message: 'Data inserted successfully' });
        } else if (Options == '2') {
            // Insert new data and update old data
            await Promise.all(Data.map(async (item) => {
                // Check if the item exists
                const existingItem = await Model.findByPk(item.Email);
                if (existingItem) {
                    // If the item exists, update it
                    await existingItem.update(item);
                } else {
                    // If the item doesn't exist, create it
                    await Model.bulkCreate(item);
                }
            }));
            res.status(200).json({ message: 'Data inserted and updated successfully' });
        } else {
            // Respond with error message for invalid Options
            return res.status(400).json({ message: 'Invalid Options value' });
        }
    } catch (error) {
        // Respond with error message
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
}); 
 */
// Endpoint to handle the AJAX requestapp.post('/saveToDatabase', (req, res) => {
  // Extract data from the request body
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
};
app.use(express.json());

app.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body; // Assuming Data, Options, and TableName are sent in the request body

  try {
      // Create a MySQL connection
      const connection = await mysql.createConnection(dbConfig);

      // Construct the query based on the option
      let query;
      if (Options === '1') {
          // Insert data only if it does not exist
          query = `INSERT IGNORE INTO ${TableName} SET ?`;
      } else if (Options === '2') {
          // Insert data and update if it already exists
          query = `INSERT INTO ${TableName} SET ? ON DUPLICATE KEY UPDATE ?`;
      } else {
          throw new Error('Invalid option provided');
      }

      // Execute the query
      let results;
      if (Options === '1') {
          results = await Promise.all(Data.map(row => connection.query(query, [sanitizeRow(row)])));
      } else if (Options === '2') {
          results = await Promise.all(Data.map(row => connection.query(query, [sanitizeRow(row), sanitizeRow(row)])));
      }

      // Close the connection
      await connection.end();

      console.log('Data saved successfully:', results);
      // Respond with success message or other data as needed
      res.status(200).json({ message: 'Data saved successfully', results });
  } catch (error) {
      console.error('Error saving data:', error.message);
      // Respond with an error message
      res.status(500).json({ error: 'Error saving data' });
  }
});

function sanitizeRow(row) {
  // This function sanitizes the row by removing any circular references
  // and converting it to a plain object
  const sanitizedRow = {};
  for (let key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
          sanitizedRow[key] = row[key];
      }
  }
  return sanitizedRow;
}



app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
});
