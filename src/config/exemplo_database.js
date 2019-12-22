// crie o "database.js" nesta pasta "config" e preencha as credenciais

module.exports = {
  dialect: "postgres",
  host: "localhost",
  port: "5432",
  username: "<username>",
  password: "<password>",
  database: "<database>",
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true
  }
};
