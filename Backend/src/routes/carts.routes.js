import { Router } from "express";
import mongoose, { mongo } from "mongoose";
import { format } from "date-fns";
import cartsModel from "../models/carts.models.js";
import ticketModel from "../models/ticket.models.js";
import productsModel from "../models/products.models.js";

import { handlePolicies } from "../utils.js";

const router = Router();

class Carts {
  static carts = [];

  constructor() {
    this.products = [];
  }
}

router.post("/", async (req, res) => {
  try {
    const newCart = new Carts();
    const newCardDb = await cartsModel.create(newCart);

    res.status(200).send(`Su carrito con ID:${newCardDb._id} ha sido creado`);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cId = req.params.cid;
    const cart = await cartsModel
      .findOne({ _id: cId })
      .populate({ path: "products", model: productsModel })
      .lean();
    res.status(200).send(cart);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.post("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    const productIdObj = new mongoose.Types.ObjectId(productId);
    const cart = await cartsModel.findOne({ _id: cartId });

    if (
      cart.products.some((product) => product.productId.equals(productIdObj))
    ) {
      await cartsModel.updateOne(
        { _id: cartId, "products.productId": productIdObj },
        { $inc: { "products.$.quantity": 1 } }
      );
    } else {
      await cartsModel.updateOne(
        { _id: cartId },
        { $push: { products: { productId: productIdObj, quantity: 1 } } }
      );
    }

    res.status(200).send(`Se agrego el producto con id: ${productIdObj}`);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    await cartsModel.updateOne(
      { _id: cartId },
      { $pull: { products: { productId: productId } } }
    );

    res.status(200).send({ status: "OK", data: "Product removed from cart" });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.put("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const newProducts = req.body.products;

    await cartsModel.updateOne(
      { _id: cartId },
      { $set: { products: newProducts } }
    );
    res.status(200).send({ status: "OK", data: "Cart updated" });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const quantity = req.body.quantity || 1;

    const productIdObj = new mongoose.Types.ObjectId(productId);

    await cartsModel.updateOne(
      { _id: cartId, "products.productId": productIdObj },
      { $inc: { "products.$.quantity": quantity } }
    );

    res.status(200).send(`Se agrego el producto con id: ${productIdObj}`);
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.delete("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;

    await cartsModel.updateOne({ _id: cartId }, { $set: { products: [] } });

    res.status(200).send({ status: "OK", data: "Cart products deleted" });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

router.post("/:cid/purchase", async (req, res) => {
  try {
    const cartId = req.params.cid;
    const cart = await cartsModel.findOne({ _id: cartId });
    const PriceByProductArray = [];

    for (const product of cart.products) {
      const productInProducts = await productsModel
        .findOne({ _id: product.productId })
        .lean();

      if (product.quantity <= productInProducts.stock) {
        const stockToChange = productInProducts.stock - product.quantity;
        const updateProduct = await productsModel.findOneAndUpdate(
          { _id: product.productId },
          { stock: stockToChange }
        );
        PriceByProductArray.push(updateProduct.price * product.quantity);
      } else {
        await cartsModel.updateOne(
          { _id: cartId },
          { $pull: { products: { productId: product.productId } } }
        );
      }
    }

    const dateNow = new Date();
    const formatedDateNow = format(dateNow, "yyyy-MM-dd HH:mm:ss");

    await ticketModel.create({
      purchaseDatetime: formatedDateNow,
      amout: PriceByProductArray.reduce((a, b) => a + b, 0),
      // Como no va a leer el req.session voy a dejar mi correo mientras lo arreglo con el frontend
      purchaser: "kruznicolas@gmail.com",
    });

    await cartsModel.updateOne({ _id: cartId }, { status: "COMPLETED" });
    res.status(200).send({ status: "OK", data: "Purchase completed" });
  } catch (err) {
    res.status(400).send({ status: "ERR", data: err.message });
  }
});

export default router;
