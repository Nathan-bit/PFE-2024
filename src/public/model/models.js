const { Sequelize, DataTypes } = require('sequelize');



let DB='';
// Replace 'database_name', 'username', 'password', and 'host' with your MySQL database credentials
const sequelize = new Sequelize('fss', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306
});

// Define the Employer model
const Employer = sequelize.define('Employer', {
  EMAIL: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true
  },
      NOM: {
    type: DataTypes.STRING
  },
  PRENOM: {
    type: DataTypes.STRING
  },
  SEXE: {
    type: DataTypes.STRING,
   
  },

  DEPARTEMENT: {
    type: DataTypes.STRING
  },
  DATE: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'Employers',
  timestamps: true
});


// Define the Etudiant model
const Etudiant = sequelize.define('Etudiant', {
  EMAIL: {
    type: DataTypes.STRING, 
    primaryKey: true,
    unique: true
  },
 
  
  NOM: {
    type: DataTypes.STRING
  },
  PRENOM: {
    type: DataTypes.STRING
  },
  SEXE: {
    type: DataTypes.STRING,  
  },
  DEPARTEMENT: {
    type: DataTypes.STRING
  },
  DATE: {
    type: DataTypes.DATE
  },
 
}, {
  tableName: 'Etudiants', // Change this according to your table name
  timestamps: true // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

// Function to get all tables and their structures
async function getAllTablesAndStructure() {
  try {
    // Retrieve table names and their column names
    const tablesAndColumns = await sequelize.query(`
          SELECT table_name, column_name
          FROM information_schema.columns
          WHERE table_schema = :databaseName;
      `, {
      replacements: { databaseName: sequelize.config.database },
      type: sequelize.QueryTypes.SELECT
    });

    // Ensure we have some data returned
    if (!Array.isArray(tablesAndColumns) || tablesAndColumns.length === 0) {
      throw new Error('No tables and columns found');
    }

    // Group the columns by table name
    const tablesStructure = {};
    tablesAndColumns.forEach(row => {
      const { table_name, column_name } = row;
      if (!tablesStructure[table_name]) {
        tablesStructure[table_name] = [];
      }
      tablesStructure[table_name].push(column_name);
    });

    return tablesStructure;
  } catch (error) {
    // console.error('Error fetching tables and their columns:', error.message);
    return null;
  }
}


async function getDataFromTable(TableName) {
  try {
    // Retrieve data from the specified table
    const tableData = await sequelize.query(`SELECT * FROM ${TableName}`, {
      type: sequelize.QueryTypes.SELECT
    });

    // Ensure we have some data returned
    if (!Array.isArray(tableData) || tableData.length === 0) {
      throw new Error(`No data found in table '${TableName}'`);
    }

    return tableData;
  } catch (error) {
    // console.error('Error fetching data from table:', error.message);
    return null;
  }
}



// Establish connection to the database
async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Sync the model with the database
async function syncModel() {
  try {
    await Employer.sync({ alter: true });
    await Etudiant.sync({ alter: true });
  } catch (error) {
    console.error('Error syncing models:', error);
  }
}

sequelize.sync()
  .then(() => {
    // console.log('Database & tables synced');
  })
  .catch(err => {
    // console.error('Error syncing database:', err);
  });

// Call the functions to connect and sync the model
connectToDatabase();
syncModel();

module.exports = {
  Employer,
  Etudiant,
  getAllTablesAndStructure,
  getDataFromTable

  //getAllTablesAndData
};
