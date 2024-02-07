import { Router } from "express";
import productsModel from "../models/products.models.js";
import { ProductService } from "../services/products.mongo.dao.js";

import { handlePolicies } from "../utils.js";

const router = Router();
const controller = new ProductService();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const sort = req.query.sort;

    const categoryContent = req.query.category;
    const statusContent = req.query.status;

    let statusContentBoolean;

    if (statusContent === "true") {
      statusContentBoolean = true;
    } else {
      statusContentBoolean = false;
    }

    let products;
    let queryConditions = {};

    if (categoryContent) {
      queryConditions.category = categoryContent;
    }

    if (statusContent != undefined) {
      queryConditions.status = statusContentBoolean;
    }

    if (sort) {
      products = await productsModel.paginate(queryConditions, {
        offset: (page - 1) * limit,
        limit: limit,
        sort: { price: sort },
        lean: true,
      });
    } else {
      products = await productsModel.paginate(queryConditions, {
        offset: (page - 1) * limit,
        limit: limit,
        lean: true,
      });
    }

    res.status(200).send({ status: "OK", data: products });
  } catch (error) {
    res.status(500).send({ status: "ERR", data: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const products = await controller.getAllProdutcs();
    res.status(200).send({ status: "OK", data: products });
  } catch (error) {
    res.status(400).send({ status: "ERR", data: error.message });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const pId = req.params.pid;
    const product = await controller.getProduct(pId);

    res.status(200).send({ status: "OK", data: product });
  } catch (err) {
    res.status(404).send({ status: "ERR", data: err.message });
  }
});

router.post("/", handlePolicies(["ADMIN"]), async (req, res) => {
  try {
    const newProduct = req.body;
    const productAdded = await controller.addProduct(newProduct);
    res.status(200).send({
      status: "OK",
      data: `Product added with ID: ${productAdded._id}`,
    });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const pId = req.params.pid;
    const productUpdate = req.body;

    await controller.updateProduct(pId, productUpdate);

    res
      .status(200)
      .send({ status: "OK", data: `product with ID: ${pId} has updated` });
  } catch (error) {
    res.status(400).send({ status: "ERR", data: error.message });
  }
});

router.delete("/:pid", handlePolicies(["ADMIN"]), async (req, res) => {
  try {
    const pId = req.params.pid;

    await controller.deleteProduct(pId);

    res
      .status(200)
      .send({ status: "OK", data: `Product with ID: ${pId} has deleted` });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

export default router;
