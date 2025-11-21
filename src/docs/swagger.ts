import swaggerUi from "swagger-ui-express";
import { Express } from "express";
// @ts-ignore: no declaration file for 'yamljs'
import YAML from "yamljs";
import path from "path";

export const setupSwagger = (app: Express) => {
    const baseDocument = YAML.load(path.join(__dirname, "swagger.yaml"));
    const componentsDocument = YAML.load(path.join(__dirname, "components.yaml"));

    const authPaths = YAML.load(path.join(__dirname, "paths/auth.yaml"));
    const transactionPaths = YAML.load(path.join(__dirname, "paths/transaction.yaml"));

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