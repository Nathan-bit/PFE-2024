const express = require('express');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const csvParser = require('csv-parser');
const bodyParser = require('body-parser');
const unidecode = require('unidecode');
const sequelize = require('sequelize');
const {   Employer, Etudiant ,getDataFromTable, getAllTablesAndStructure }  = require('./src/public/model/models');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Middleware
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

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

app.get('/databases', (req, res) => {
    res.render('database',{items: items});
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
        res.render(item,{dt:dt , item: item,items:items});
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
  
  /* const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
};



// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig); */


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});
app.post('/saveToDatabase', async (req, res) => {
    const { Data, Options, TableName } = req.body;
  
    try {
      // Check if TableName is missing
      if (!TableName) {
       res.status(400).json({ error: 'Table name is required.' });
      //  res.send({ error: 'Table name is required.' });
        return;
      }

      // Check if Options is missing or invalid
      if (Options !== '1' && Options !== '2') {
        res.status(400).json({ error: 'Invalid Options value. Use 1 or 2.' });
        return;
      }
  
      // Handle data insertion based on the specified options
      if (Options === '1') {
        // Insert new data only
        const query = 'INSERT INTO ?? SET ?';
        await pool.query(query, [TableName, Data]);
        res.status(200).json({ message: 'Data inserted successfully.' });
      } else if (Options === '2') {
        // Insert new data and update existing data
        for (const item of Data) {
          const query = 'INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?';
          await pool.query(query, [TableName, item, item]);
        }
        res.status(200).json({ message: 'Data inserted and updated successfully.' });
      }
    } catch (error) {
      console.error('Error saving data to database:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
});


/* app.post('/saveToDatabase', async (req, res) => {
    const { Data, Options, TableName } = req.body;
  
    try {
      // Handle data insertion based on the specified options
      if (Options === '1') {
        // Insert new data only
        const query = 'INSERT INTO ?? SET ?';
        await pool.query(query, [TableName, Data]);
        res.status(200).json({ message: 'Data inserted successfully.' });
      } else if (Options === '2') {
        // Insert new data and update existing data
        for (const item of Data) {
          const query = 'INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?';
          await pool.query(query, [TableName, item, item]);
        }
        res.status(200).json({ message: 'Data inserted and updated successfully.' });
      } else {
        res.status(400).json({ error: 'Invalid Options value.' });
      }
    } catch (error) {
      console.error('Error saving data to database:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
   */
  // Start the server

 
/* app.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body;
   console.log("Data",Data,"Options",Options,"TableName",TableName)
  // Check if the table exists in the database
  const tableExists = await new Promise((resolve, reject) => {
    pool.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = ?`, [TableName], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0].count > 0);
      }
    });
  });

  if (!tableExists) {
    res.status(400).json({ error: 'Table not found' });
    return;
  }

  // Save the data to the database
  if (Options === '1') {
    // Insert new data only
    const promises = Data.map(data => {
      return new Promise((resolve, reject) => {
        const keys = Object.keys(data).join(',');
        const values = Object.values(data).map(value => `'${value}'`).join(',');
        pool.query(`INSERT INTO ${TableName} (${keys}) VALUES (${values})`, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    });

    try {
      await Promise.all(promises);
      res.json({ message: 'Data inserted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error inserting data' });
    }
  } else if (Options === '2') {
    // Insert new data and update old data
    const promises = Data.map(data => {
      return new Promise((resolve, reject) => {
        const keys = Object.keys(data).join(',');
        const values = Object.values(data).map(value => `'${value}'`).join(',');
        pool.query(`INSERT INTO ${TableName} (${keys}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${keys} = VALUES(${keys})`, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    });

    try {
      await Promise.all(promises);
      res.json({ message: 'Data inserted and updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error inserting and updating data' });
    }
  } else {
    res.status(400).json({ error: 'Invalid options' });
  }
}); */


/* app.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body; // Assuming Data, Options, and TableName are sent in the request body

  try {
      console.log('Data received:', Data); // Log the data before saving to identify any circular references

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
          results = await Promise.all(Data.map(row => connection.query(query, [serializeRow(row)])));
      } else if (Options === '2') {
          results = await Promise.all(Data.map(row => connection.query(query, [serializeRow(row), serializeRow(row)])));
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

function serializeRow(row) {
  // This function serializes each row to remove circular references
  return JSON.parse(JSON.stringify(row));
} */



let itemss = [];

getDataFromTable('eMploYers')
  .then(tableData => {
    // Assign the retrieved data to itemss
    itemss = tableData;
    // You can use itemss here within this .then() block
    console.log('Data from table "Etudiant":', itemss);
  })
  .catch(error => {
    console.error('Error:', error);
  });

  app.post('/getDataFromTable', (req, res) => {
    const TableName = req.body.selectedValue;
    console.log("Received data:", TableName);
                  
    // Assuming getDataFromTable returns a promise
    getDataFromTable(TableName)
        .then(tableData => {
            // Assign the retrieved data to data
            const data = tableData;
            // You can use data here within this.then() block

            
            // Send the response back to the client
            res.send(data);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send('Error occurred while fetching data from the table');
        });
});



app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
});
