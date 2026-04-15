import app from "./app";
import config from "./config/config";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import SwaggerParser from "swagger-parser";
import serverless from "serverless-http";
import { OpenAPIV3 } from "openapi-types";

if (config.serverless === "false") {
  const absolutePath = path.resolve();
  const swaggerFile = YAML.load(path.join(absolutePath, "docs/api.yml"));

  // @ts-ignore: Ignore the error for dereference method
  SwaggerParser.dereference(swaggerFile)
    .then((swaggerDocument: OpenAPIV3.Document) => {
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

      const PORT = config.port;

      app.listen(PORT, () => {
        console.log(
          `Server is running on port ${PORT} \nAccess the API documentation at http://localhost:${PORT}/api-docs`
        );
      });
    })
    .catch((error: Error) => {
      console.error("❌ Error loading OpenAPI file:", error);
    });
}

export const handler = serverless(app);
