import app from "./app.js";
import "./database.js";

//Creo la función
// que se encarga de ejecutar el servidor
async function main() {
  const port = process.env.PORT || 4000;
  app.listen(port);
  console.log("Server on port " + port);
}

main();
