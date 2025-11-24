import swaggerUi from "swagger-ui-express";
import { Express } from "express";
// @ts-ignore: no declaration file for 'yamljs'
import YAML from "yamljs";
import path from "path";

export const setupSwagger = (app: Express) => {
    const basePath = path.join(__dirname);

    const baseDocument = YAML.load(path.join(basePath, "swagger.yaml"));
    const componentsDocument = YAML.load(path.join(basePath, "components.yaml"));

    const authPaths = YAML.load(path.join(basePath, "paths/auth.yaml"));
    const transactionPaths = YAML.load(path.join(basePath, "paths/transaction.yaml"));


    // Gabungkan semua bagian ke dalam baseDocument
    baseDocument.paths = {
        ...authPaths,
        ...transactionPaths
    };

    baseDocument.components = componentsDocument.components;

    app.use(
        "/api-docs",
        swaggerUi.serve as any,
        swaggerUi.setup(baseDocument) as any
    );

    console.log("📘 Swagger documentation available at /api-docs");
};