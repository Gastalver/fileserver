// Modulos de nodejs estrictamente necesarios
var http = require("http"), fs = require("fs");


// Declaración e instanciación inicial del objeto 'methods', vacío.
var methods = Object.create(null);

// Creación del servidor que responderá a todas las peticiones HTTP que reciba por el puerto 8000.

http.createServer(function(req, res) {

    // Definición de una función RESPOND, genérica, instrumental, para generar la cabecera y el cuerpo de las respuestas HTTP.
    function respond(code, body, type) {
        // Configuración y escritura de la cabecera
        if (!type) type = "text/plain";
        res.writeHead(code, {"Content-Type": type});
        // Envío del body
        if (body && body.pipe) body.pipe(res);
        else res.end(body);
    }

    // Request Handlers
    // req.method, de express: Contains a string corresponding to the HTTP method of the request: GET, POST, PUT, and so on.
    // Si existe un método en el objeto methods igual al verbo del objeto request, ejecutalo
    // pasándole como parámetros la URL
       if (req.method in methods)
           //Ejecuta el método, pasándole como parámetro un string con el pathname precedido de un punto, el objeto respond, y el objeto request.
           methods[req.method](urlToPath(req.url), respond, req);
       else
     // Si no existe, usa la función RESPOND con el codigo 405 y un mensaje del error en el body. 
        respond(405, "Method " + req.method + " not allowed.");

}).listen(8000);

// Función que convierte (parse) el string URL del request en un objeto URL, gracias a un método del módulo URL de nodejs,
// que coge la parte pathname de la URL (la que va detrás del host y que no comprende el query
// y la devuelve decodificada y precedida de un punto. 
// Ejemplo de URI codificada http%3A%2F%2Fw3schools.com%2Fmy%20test.asp%3Fname%3Dst%C3%A5le%26car%3Dsaab
// Ejemplo de URI decodificada http://w3schools.com/my test.asp?name=ståle&car=saab
function urlToPath(url) {
  var path = require("url").parse(url).pathname;
  return "." + decodeURIComponent(path);
}

// fs.stat(path, callback) devuelve un objeto con todas las propiedades del archivo/directorio indicado en path
// cfr. https://nodejs.org/api/fs.html#fs_fs_stat_path_callback


methods.GET = function(path, respond) {
  fs.stat(path, function(error, stats) {
    if (error && error.code == "ENOENT")
      respond(404, "File not found");
    else if (error)
      respond(500, error.toString());
    else if (stats.isDirectory())
      fs.readdir(path, function(error, files) {
        if (error)
          respond(500, error.toString());
        else
          respond(200, files.join("\n"));
      });
    else
      respond(200, fs.createReadStream(path),
              require("mime").lookup(path));
  });
};

methods.DELETE = function(path, respond) {
  fs.stat(path, function(error, stats) {
    if (error && error.code == "ENOENT")
      respond(204);
    else if (error)
      respond(500, error.toString());
    else if (stats.isDirectory())
      fs.rmdir(path, respondErrorOrNothing(respond));
    else
      fs.unlink(path, respondErrorOrNothing(respond));
  });
};

function respondErrorOrNothing(respond) {
  return function(error) {
    if (error)
      respond(500, error.toString());
    else
      respond(204);
  };
}

methods.PUT = function(path, respond, req) {
  var outStream = fs.createWriteStream(path);
  outStream.on("error", function(error) {
    respond(500, error.toString());
  });
  outStream.on("finish", function() {
    respond(204);
  });
  req.pipe(outStream);
};
