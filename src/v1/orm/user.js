const logger = require("../utils/logger");
const { User, PurchaseItem } = require("../models");
const CODE = require("../Helper/httpResponseCode");
const MESSAGE = require("../Helper/httpResponseMessage");
const bcrypt = require("bcrypt");
const { serverError } = require("../constants/commonConstants");
const { generateToken } = require("../Helper/commonFunction");

exports.login = async (req, res, email, password) => {
  logger.info("ORM::login");
  try {
    const isUserExist = await User.findOne({
      $or: [{ email: { $eq: email } }, { number: { $eq: parseInt(email) } }],
    });
    if (!isUserExist) {
      return res
        .status(CODE.NOT_FOUND)
        .send({ message: MESSAGE.NO_VALID_RECORD_FOUND });
    }
    const match = await bcrypt.compare(password, isUserExist.password);
    if (!match) {
      return res
        .status(CODE.UNAUTHORIZED)
        .send({ message: MESSAGE.NO_VALID_RECORD_FOUND });
    }
    const token = await generateToken(isUserExist);
    return res.status(CODE.EVERYTHING_IS_OK).send({
      message: `User ${MESSAGE.SUCCESSFULLY_DONE}`,
      data: {
        _id: isUserExist._id,
        fullName: isUserExist.fullName,
        email: isUserExist.email,
        number: isUserExist.number,
        is_active: isUserExist.is_active,
        created_on: isUserExist.created_on,
        modified_on: isUserExist.modified_on,
        token,
      },
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.register = async (req, res, payload) => {
  logger.info("ORM::register");
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(payload.password, salt);
    const userRegisterData = new User({
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      number: payload.number,
    });
    const registeredUser = await userRegisterData.save();
    return res.status(CODE.NEW_RESOURCE_CREATED).send({
      message: `User ${MESSAGE.CREATE_SUCCESS}`,
      data: {
        _id: registeredUser._id,
        fullName: registeredUser.fullName,
        email: registeredUser.email,
        number: registeredUser.number,
        is_active: registeredUser.is_active,
        created_on: registeredUser.created_on,
        modified_on: registeredUser.modified_on,
      },
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.getUserList = async (req, res, filter) => {
  logger.info("ORM::getUserList");
  try {
    const userListID = await PurchaseItem.distinct("createdBy", {
      groupId: filter.groupId,
    });
    const userList = await User.find(
      { _id: { $in: userListID } },
      { password: 0, __v: 0 }
    );
    return res.status(CODE.EVERYTHING_IS_OK).send({
      message: `User list ${MESSAGE.FETCH_SUCCESS}`,
      data: userList,
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};
