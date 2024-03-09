
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
app.get('/i', (req, res) => {
  res.render('index');
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
    database: 'fss'
});

app.post('/saveToDatabase', async (req, res) => {
  const { Data, Options, TableName } = req.body;

  try {
    // Check if TableName is missing
    if (!TableName) {
      res.status(400).json({ error: 'Table name is required.' });
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
      for (const item of Data) {
        try {
          const query = 'INSERT INTO ?? SET ?';
          await pool.query(query, [TableName, item]);
        } catch (error) {
          // Ignore duplicate key errors
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error('Error inserting data:', error);
            res.status(500).json({ error: 'Internal server error.' });
            return;
          }
        }
      }
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




let itemss = [];

getDataFromTable('eMploYers')
  .then(tableData => {
    // Assign the retrieved data to itemss
    itemss = tableData;
    // You can use itemss here within this .then() block
   // console.log('Data from table "Etudiant":', itemss);
  })
  .catch(error => {
    console.error('Error:', error);
  });

  app.post('/getDataFromTable', (req, res) => {
    const TableName = req.body.selectedValue;
   // console.log("Received data:", TableName);
                  
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
app.post('/saveChanges', (req, res) => {
  const { editedData, TableName } = req.body;

  // Log the received data
 // console.log('TableName:', TableName);

  // Extract the ID and other updated fields from editedData
  const { ID, ...updateData } = editedData;

  // Construct the SQL query to update the record
  const sql = `UPDATE ${TableName} SET ? WHERE ID = ?`;

  // Execute the query
  pool.query(sql, [updateData, ID], (error, results) => {
      if (error) {
          console.error('Error updating database:', error);
          res.status(500).send('Error updating database');
      } else {
          console.log('Database updated successfully');
          res.send('Database updated successfully');
      }
  });
});

app.post('/deleteRow', (req, res) => {
  const { rowData, TableName } = req.body;

  // Log the received data
  console.log('Row data to delete:', rowData);
  console.log('TableName:', TableName);

  // Extract the ID of the row to delete
  const { ID } = rowData;

  // Construct the SQL query to delete the record
  const sql = `DELETE FROM ${TableName} WHERE ID = ?`;

  // Execute the query
  pool.query(sql, [ID], (error, results) => {
      if (error) {
          console.error('Error deleting row from database:', error);
          res.status(500).send('Error deleting row from database');
      } else {
          console.log('Row deleted successfully');
          res.send('Row deleted successfully');
      }
  });
});


app.get('/connexion/login', (req, res) => {
  res.render('../connexion/login', { title: 'Login' });
});
app.get('/connexion/register', (req, res) => {
  res.render('../connexion/register', { title: 'register' });
});

app.post('/reset-password', (req, res) => {
  const email = req.body.email;

  // Here you would implement your logic to send the email
  // For demonstration purposes, let's assume it always succeeds
  // You can replace this with your actual email sending logic
  console.log(email);
               if(email=='test@gmail.com')
               {
                let message =' Password reset instructions successfuly sent to :'
                res.status(200).json({ message:message  });
                console.log(message);
                
               }else{

                 res.status(400).json({ error: " The address mail you provide doesn't exist.  Please try again." })
               }

  // Send success response
 // res.status(200).json({ message: 'Password reset instructions sent successfully.' });
});


app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
});
