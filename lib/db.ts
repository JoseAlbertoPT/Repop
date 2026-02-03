import mysql from "mysql2/promise"

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "repodefi",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})
