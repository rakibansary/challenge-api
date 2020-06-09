/**
 * This service provides operations of challenge types.
 */

const _ = require('lodash')
const Joi = require('joi')
const uuid = require('uuid/v4')
const helper = require('../common/helper')
const logger = require('../common/logger')
const constants = require('../../app-constants')

/**
 * Search challenge types
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchChallengeTypes (criteria) {
  // TODO - move this to ES
  let records = await helper.scan('ChallengeType')
  const page = criteria.page || 1
  const perPage = criteria.perPage || 50

  if (criteria.name) records = _.filter(records, e => helper.partialMatch(criteria.name, e.name))
  if (criteria.description) records = _.filter(records, e => helper.partialMatch(criteria.description, e.description))
  if (criteria.abbreviation) records = _.filter(records, e => helper.partialMatch(criteria.abbreviation, e.abbreviation))
  if (!_.isUndefined(criteria.isActive)) records = _.filter(records, e => (e.isActive === (criteria.isActive === 'true')))
  if (criteria.legacyId) records = _.filter(records, e => (e.legacyId === criteria.legacyId))

  const total = records.length
  const result = records.slice((page - 1) * perPage, page * perPage)

  return { total, page, perPage, result }
}

searchChallengeTypes.schema = {
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.number().integer().min(1).max(100).default(100),
    name: Joi.string(),
    description: Joi.string(),
    isActive: Joi.boolean(),
    abbreviation: Joi.string(),
    legacyId: Joi.number().integer().positive()
  })
}

/**
 * Create challenge type.
 * @param {Object} type the challenge type to created
 * @returns {Object} the created challenge type
 */
async function createChallengeType (type) {
  await helper.validateDuplicate('ChallengeType', 'name', type.name)
  await helper.validateDuplicate('ChallengeType', 'abbreviation', type.abbreviation)
  if (type.legacyId) {
    await helper.validateDuplicate('ChallengeType', 'legacyId', type.legacyId)
  }
  const ret = await helper.create('ChallengeType', _.assign({ id: uuid() }, type))
  // post bus event
  await helper.postBusEvent(constants.Topics.ChallengeTypeCreated, ret)
  return ret
}

createChallengeType.schema = {
  type: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    isActive: Joi.boolean().required(),
    abbreviation: Joi.string().required(),
    legacyId: Joi.number().integer().positive()
  }).required()
}

/**
 * Get challenge type.
 * @param {String} id the challenge type id
 * @returns {Object} the challenge type with given id
 */
async function getChallengeType (id) {
  const ret = await helper.getById('ChallengeType', id)
  return ret
}

getChallengeType.schema = {
  id: Joi.id()
}

/**
 * Fully update challenge type.
 * @param {String} id the challenge type id
 * @param {Object} data the challenge type data to be updated
 * @returns {Object} the updated challenge type
 */
async function fullyUpdateChallengeType (id, data) {
  const type = await helper.getById('ChallengeType', id)
  if (type.name.toLowerCase() !== data.name.toLowerCase()) {
    await helper.validateDuplicate('ChallengeType', 'name', data.name)
  }
  if (type.abbreviation.toLowerCase() !== data.abbreviation.toLowerCase()) {
    await helper.validateDuplicate('ChallengeType', 'abbreviation', data.abbreviation)
  }
  if (data.legacyId && type.legacyId !== data.legacyId) {
    await helper.validateDuplicate('ChallengeType', 'legacyId', data.legacyId)
  }
  if (_.isUndefined(data.description)) {
    type.description = undefined
  }
  if (_.isUndefined(data.legacyId)) {
    type.legacyId = undefined
  }
  const ret = await helper.update(type, data)
  // post bus event
  await helper.postBusEvent(constants.Topics.ChallengeTypeUpdated, ret)
  return ret
}

fullyUpdateChallengeType.schema = {
  id: Joi.id(),
  data: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    isActive: Joi.boolean().required(),
    abbreviation: Joi.string().required(),
    legacyId: Joi.number().integer().positive()
  }).required()
}

/**
 * Partially update challenge type.
 * @param {String} id the challenge type id
 * @param {Object} data the challenge type data to be updated
 * @returns {Object} the updated challenge type
 */
async function partiallyUpdateChallengeType (id, data) {
  const type = await helper.getById('ChallengeType', id)
  if (data.name && type.name.toLowerCase() !== data.name.toLowerCase()) {
    await helper.validateDuplicate('ChallengeType', 'name', data.name)
  }
  if (data.abbreviation && type.abbreviation.toLowerCase() !== data.abbreviation.toLowerCase()) {
    await helper.validateDuplicate('ChallengeType', 'abbreviation', data.abbreviation)
  }
  if (data.legacyId && type.legacyId !== data.legacyId) {
    await helper.validateDuplicate('ChallengeType', 'legacyId', data.legacyId)
  }
  const ret = await helper.update(type, data)
  // post bus event
  await helper.postBusEvent(constants.Topics.ChallengeTypeUpdated, _.assignIn({ id }, data))
  return ret
}

partiallyUpdateChallengeType.schema = {
  id: Joi.id(),
  data: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    isActive: Joi.boolean(),
    abbreviation: Joi.string(),
    legacyId: Joi.number().integer().positive()
  }).required()
}

module.exports = {
  searchChallengeTypes,
  createChallengeType,
  getChallengeType,
  fullyUpdateChallengeType,
  partiallyUpdateChallengeType
}

// logger.buildService(module.exports)
