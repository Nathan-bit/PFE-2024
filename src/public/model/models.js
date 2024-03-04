// employers.js

const { Sequelize, DataTypes } = require('sequelize');

// Replace 'database_name', 'username', 'password', and 'host' with your MySQL database credentials
const sequelize = new Sequelize('stb', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port : 3306
});

// Define the Employee model
const Employee = sequelize.define('Employers', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nom: {
    type: DataTypes.STRING
  },
  Prenom: {
    type: DataTypes.STRING
  },
  Departement: {
    type: DataTypes.STRING
  },
  Email: {
    type: DataTypes.STRING,
    unique:true
  },
  Date: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'Employers', // Change this according to your table name
  timestamps: true // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

const Etudiant = sequelize.define('Etudiant', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nom: {
    type: DataTypes.STRING
  },
  Prenom: {
    type: DataTypes.STRING
  },
  Departement: {
    type: DataTypes.STRING
  },
  Email: {
    type: DataTypes.STRING,
    unique:true
  },
  Date: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'Etudiant', // Change this according to your table name
  timestamps: false // Set to true if you want Sequelize to manage createdAt and updatedAt fields
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
      console.error('Error fetching tables and their columns:', error.message);
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
    await Employee.sync({ alter: true });
    await Etudiant.sync({ alter: true });
    console.log("Employee model synced");
  } catch (error) {
    console.error('Error syncing Employee model:', error);
  }
}

// Call the functions to connect and sync the model
connectToDatabase();
syncModel();

module.exports = {
  Employee,Etudiant,
  getAllTablesAndStructure
};
