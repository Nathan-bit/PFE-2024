// employers.js

const { Sequelize, DataTypes } = require('sequelize');

// Replace 'database_name', 'username', 'password', and 'host' with your MySQL database credentials
const sequelize = new Sequelize('data', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port : 3306
});

// Define the Employee model
const Employee = sequelize.define('Employee', {
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
    type: DataTypes.STRING
  },
  Date: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'employee', // Change this according to your table name
  timestamps: true // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

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
    console.log("Employee model synced");
  } catch (error) {
    console.error('Error syncing Employee model:', error);
  }
}

// Call the functions to connect and sync the model
connectToDatabase();
syncModel();

module.exports = Employee;
