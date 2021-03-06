const logger = require("../utils/logger");
const { User, Group } = require("../models");
const CODE = require("../Helper/httpResponseCode");
const MESSAGE = require("../Helper/httpResponseMessage");
const { serverError } = require("../constants/commonConstants");
const { generateUniqueID } = require("../Helper/commonFunction");
const { userPopulate } = require("../constants/populate");

exports.createGroup = async (req, res, payload) => {
  logger.info("ORM::Group");
  try {
    const groupData = new Group({
      name: payload.name,
      group_id: generateUniqueID(),
      createdBy: req.user._id,
      is_active: true,
    });
    const savedResponse = await groupData.save();
    await Group.updateOne(
      { _id: savedResponse._id },
      { $addToSet: { users: req.user._id } }
    );
    return res.status(CODE.NEW_RESOURCE_CREATED).send({
      message: MESSAGE.CREATE_SUCCESS,
      data: savedResponse,
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.getAllGroup = async (req, res, skip, limit, filter) => {
  logger.info("ORM::getAllGroup");
  try {
    const groupList = await Group.find(filter)
      .sort({ created_on: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .populate(userPopulate);
    const totalGroups = await Group.find(filter).countDocuments();
    return res.status(CODE.EVERYTHING_IS_OK).send({
      message: MESSAGE.SUCCESSFULLY_DONE,
      data: groupList,
      totalGroups: totalGroups,
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.getGroupById = async (req, res, groupId) => {
  logger.info("ORM::getGroupById");
  try {
    const groupData = await Group.find({
      _id: groupId,
      is_active: true,
    }).populate(userPopulate);
    return res.status(CODE.EVERYTHING_IS_OK).send({
      message: MESSAGE.SUCCESSFULLY_DONE,
      data: groupData,
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.deleteGroup = async (req, res, groupId) => {
  logger.info("ORM::deleteGroup");
  try {
    await Group.findByIdAndUpdate(groupId, {
      is_active: false,
    });
    return res.status(CODE.EVERYTHING_IS_OK).send({
      message: MESSAGE.DELETE_SUCCESS,
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: serverError });
  }
};

exports.joinGroup = async (req, res, groupId) => {
  logger.info("ORM::joinGroup");
  try {
    await Group.updateOne(
      { _id: groupId },
      { $addToSet: { users: req.user._id } }
    );
    return res
      .status(CODE.EVERYTHING_IS_OK)
      .send({ message: MESSAGE.SUCCESSFULLY_DONE });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: MESSAGE.INTERNAL_SERVER_ERROR });
  }
};

exports.removeGroup = async (req, res, groupId) => {
  logger.info("ORM::removeGroup");
  try {
    await Group.updateOne({ _id: groupId }, { $pull: { users: req.user._id } });
    return res
      .status(CODE.EVERYTHING_IS_OK)
      .send({ message: MESSAGE.SUCCESSFULLY_DONE });
  } catch (error) {
    logger.error(error);
    return res
      .status(CODE.INTERNAL_SERVER_ERROR)
      .send({ message: MESSAGE.INTERNAL_SERVER_ERROR });
  }
};
