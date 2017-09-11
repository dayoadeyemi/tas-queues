"use strict";

// Load required Node modules
const Joi       = require('joi');
const assert    = require('assert');
const Promise   = require('bluebird');

const { Db } = require('mongodb')
const configs = require('api-plugin-configs');
const utils = require('api-plugin-utils');

/**
 * @class Agnostic
 */
const Agnostic  = require('./agnostics/Agnostic');

const DATE_INTERVAL_MAP = {
    year: "%Y-01-01T00:00:00.000",
    month: "%Y-%m-01T00:00:00.000",
    day: "%Y-%m-%dT00:00:00.000",
    hour: "%Y-%m-%dT%H:00:00.000",
    minutes: "%Y-%m-%dT%H:%M:00.000",
    seconds: "%Y-%m-%dT%H:%M:%S.000",
    milliseconds: "%Y-%m-%dT%H:%M:%S.%L",
};
/**
 * @typedef {Object} PropertySelector
 * @prop {string} fieldId
 * @prop {'year'|'month'|'day'|'dayOfMonth'|'hour'|'minute'|'second'} dateInterval
 */
const PROPERTY_SELECTOR_SCHEMA = Joi.object({
    fieldId: Joi.string().required(), // id or list fieldId to to filter on
    values: Joi.array().items(Joi.string()), // only accept values in this array, accept all if empty
    subFieldId: Joi.string(), // id of nested field to use
    subFieldProp: Joi.string(), // property to pull
    dateInterval: Joi.string(), // date interval for returning histogram
    size: Joi.string(), // number of buckets to return
});

/**
 * @typedef {Object} PivotParams
 * @prop {PropertySelector} [group]
 * @prop {PropertySelector} [split]
 * @prop {Object} [filter]
 */
const PIVOT_PARAMS_SCHEMA = {
    group: PROPERTY_SELECTOR_SCHEMA,
    split: PROPERTY_SELECTOR_SCHEMA,
    filter: Joi.object().default({}),
}

/**
 * 
 * @param {PropertySelector} propertySelector 
 * @returns 
 */
function mapSelectorToFieldId(propertySelector){
    if (!propertySelector) return null;
    if (propertySelector.dateInterval) {
        return {
            $dateToString: {
                format: DATE_INTERVAL_MAP[propertySelector.dateInterval],
                date: '$'+propertySelector.fieldId
            }
        };
    }
    return '$'+propertySelector.fieldId;
}
/**
 *
 * @class BeameryCollection
 */
class BeameryCollection {

    /**
     * @constructor BeameryCollection
     * @param {Db} client
     * @param {string}      name    Name of the collection in mongo
     */
    constructor(client, name) {

        assert.equal(typeof name, 'string', 'BeameryCollection name must be a string');

        this.__INTERNAL__           = { client };

        // Initializing the helper agnostic functions
        this.__get                  = new Agnostic(this, this._read);
        this.__getOne               = new Agnostic(this, this._readOne);
        this.__update               = new Agnostic(this, this._update);
        this.__updateOne            = new Agnostic(this, this._updateOne);
        this.__unset                = new Agnostic(this, this._unset);
        this.__remove               = new Agnostic(this, this._delete);
        this.__removeMany           = new Agnostic(this, this._deleteMany);
        this.__create               = new Agnostic(this, this._createOne);
        this.__createMany           = new Agnostic(this, this._createMany);
        this.__stream               = new Agnostic(this, this._stream);
        this.__aggregate            = new Agnostic(this, this._aggregate);
        this.__upsert               = new Agnostic(this, this._upsert);
        this.__count                = new Agnostic(this, this._count);
        this.__addToSet             = new Agnostic(this, this._addToSet);

        // Initializing main variables(collection and schema names)
        this.name                   = name;

        // Attaching the main common libs used all around
        this.debug                  = require('debug')(`ORM-${name}`);

        this.configs                = configs;
        this.utils                  = utils;

    }
    get get() { return this.__get }
    get getOne() { return this.__getOne }
    get update() { return this.__update }
    get updateOne() { return this.__updateOne }
    get unset() { return this.__unset }
    get remove() { return this.__remove }
    get removeMany() { return this.__removeMany }
    get create() { return this.__create }
    get createMany() { return this.__createMany }
    get stream() { return this.__stream }
    get aggregate() { return this.__aggregate }
    get upsert() { return this.__upsert }
    get count() { return this.__count }
    get addToSet() { return this.__addToSet }

    /**
     * @typedef Bucket
     * @prop {string} id
     * @prop {string} value
     * @prop {Bucket[]} buckets
     */
    /**
     * Allow pivot table style queries for admin routes
     * 
     * @param {PivotParams} params 
     * @param {any[]} [pipeline] pre applied pipeline for joining
     * @returns {Promise<Bucket[]>}
     * 
     * @memberOf BeameryCollection
     */
    getPivotResults(params, pipeline){
        pipeline = pipeline || [];

        return BeameryCollection.validate({
            group: PROPERTY_SELECTOR_SCHEMA,
            split: PROPERTY_SELECTOR_SCHEMA,
            filter: Joi.object().default({}),
        }, params)
        .then(valid => {
            const _id = {
                group: mapSelectorToFieldId(valid.group),
                split: mapSelectorToFieldId(valid.split)
            }
            pipeline.push({
                $match: valid.filter
            }, {
                $group: {
                    _id, count: { $sum: 1 }
                }
            });
            ['group','split'].forEach($ => {
                if (_id[$] === '$companyId') {
                    pipeline.push({
                        $lookup: {
                            from: 'companies',
                            localField: '_id.' + $,
                            foreignField: 'id',
                            as: 'company'
                        }
                    }, {
                        $unwind: {
                            path: '$company'
                        }
                    }, {
                        $project: {
                            '_id.group': $ ==='group' ? '$company.name' : '$_id.group',
                            '_id.split': $ ==='split' ? '$company.name' : '$_id.split',
                            count: '$count',
                        }
                    });
                }
            })

            pipeline.push({
                $group: {
                    _id: "$_id.group",
                    value: { $sum: "$count" },
                    buckets: { $push: {
                        id: "$_id.split",
                        value: "$count",
                        buckets: []
                    } }
                }
            });
            return this.collection.aggregate(pipeline).toArray()
        })
        .map($ => {
            $.id = $._id;
            delete $._id;
            return $;
        })
    }

    /**
     * Create a flat query from a nested one
     *
     * @static
     * @memberof BeameryCollection
     * @param {Object} query
     * @param {Object?} output
     * @param {string?} prefix
     * @returns {Object} flatQuery
     */
    static flattenQuery(query, output, prefix){

        output = output || {};
        prefix = prefix || '';

        for (let key in query) {
            if (query.hasOwnProperty(key)) {
                const value = query[key];
                if (typeof value === 'object') BeameryCollection.flattenQuery(value, output, prefix+key +'.');
                else output[prefix+key] = value;

            }
        }
        return output;
    }

    /**
     * Validate params based on a (joi) schema
     *
     * @template S
     * @static
     * @memberof BeameryCollection
     * @param {Object} schema
     * @param {S} params
     * @param {*} [options]
     * @returns {Promise<S>}
     */
    static validate(schema, params, options){

        const validation = Joi.validate(params, schema, options || {});

        if (validation.error) return Promise.reject(validation.error);
        else return Promise.resolve(validation.value);
    }

    /**
     * Generic create function/method for MongoDB documents based on passed query object
     *
     *  const SCHEMA = {
     *      doc    : this.schema.create
     *  };
     *
     * @member _createOne
     * @template T
     * @param  {{doc:T}}                     params    { doc } doc=Document to be created
     * @returns {Promise<T>}  results
    */
    _createOne(params) {
        const SCHEMA = {
            doc    : this.schema.create || Joi.object()
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);
        return Promise.resolve(this.collection.insertOne(validation.value.doc))
            .then(result =>  result.ops[0]);
    }

    /**
     * Generic create many function/method for MongoDB documents based on passed query object
     * Generic create function/method for MongoDB documents based on passed query object
     *
     *  const SCHEMA = {
     *      doc    : this.schema.create
     *  };
     *
     * @member _createOne
     * @template T
     * @memberof BeameryCollection
     * @param  {{doc: T[]}} params 
     * @param params.doc Document to be created
     * @returns {Promise<Object<string>>}  results
     * @private
     */
    _createMany(params) {

        const SCHEMA = {
            doc    : this.schema.createMany || Joi.array().items(Joi.object())
        };
        const validation = Joi.validate(params, SCHEMA);

        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection.insertMany(validation.value.doc))
            .then(result => result.insertedIds);
    }

    /**
     * INTERNAL FOR TESTS
     * Like _read but returns cursor and not data
     *
     *  const SCHEMA = {
     *      query     : Joi.object().required(),
     *      projection: Joi.object().default({}),
     *      limit     : Joi.number().integer().default(0),
     *      skip      : Joi.number().integer().default(0),
     *      offset    : Joi.number().integer().default(0),
     *      sort      : Joi.object().default({})
     *  };
     *
     * @method find
     * @template T
     * @memberof BeameryCollection
     * @param  {Object}          params       Object containing the MongoDB query, collection, and projection
     * @private
     */
    _readCursor(params) {
        return this.collection
            .find(params.query, params.projection)
            .sort(params.sort)
            .limit(params.limit)
            .skip(params.skip);
    }

    /**
     * Generic find method for MongoDB documents based on passed query object
     * The find method can filter, sort and project results
     * Since findOne has been deprecated since v2.1 this function with limit(1) will do the trick
     *
     *  const SCHEMA = {
     *      query     : this.schema.read || Joi.object().required(),
     *      projection: Joi.object().default({}),
     *      limit     : Joi.number().integer().default(0),
     *      skip      : Joi.number().integer().default(0),
     *      offset    : Joi.number().integer().default(0),
     *      sort      : Joi.object().default({})
     *  };
     *
     * @method _read
     * @template T
     * @memberof BeameryCollection
     * @param  {Object}          params       Object containing the MongoDB query, collection, and projection
     * @returns {Promise<T[]>}  results
     * @private
     */

    _read(params) {

        const SCHEMA = {
            query     : Joi.object().required(),
            projection: Joi.object().default({}),
            limit     : Joi.number().integer().default(0),
            skip      : Joi.number().integer().default(0),
            offset    : Joi.number().integer().default(0),
            sort      : Joi.object().default({})
        };

        return BeameryCollection.validate(SCHEMA, params)
            .then(validated =>
                this._readCursor(validated)
                    .toArray())
    }

    /**
     * Generic find method for MongoDB documents based on passed query object
     * The find method return a object of result or null
     * Since findOne has been deprecated since v2.1 this function with limit(1) will do the trick
     *
     *  const SCHEMA = {
     *      query     : Joi.object().required(),
     *      projection: Joi.object().default({})
     *  };
     *
     * @method _readOne
     * @template T
     * @memberof BeameryCollection
     * @param  {Object}          params       Object containing the MongoDB query, collection, and projection
     * @returns {Promise<T>}  results
     * @private
     */
    _readOne(params) {

        const SCHEMA = {
            query     : Joi.object().required(),
            projection: Joi.object().default({})
        };

        return BeameryCollection.validate(SCHEMA, params)
            .then($ => this.collection
                .find($.query, $.projection)
                .limit(1)
                .toArray()
                .then(result => (result.length > 0) ? result[0] : null)
        );
    }

    /**
     * Generic update function/method for MongoDB documents based on passed query object
     *
     *  const SCHEMA = {
     *      query  : Joi.object().required(),
     *      doc    : Joi.object().required(),
     *      options: Joi.object().default({})
     *  };
     *
     * @method _update
     * @template T
     * @memberof BeameryCollection
     * @param  {{query:Object,doc?:Partial<T>,options?:Object}}             params      Object containing the properties; collection, query, update, and options
     * @private
    */
    _update(params) {
        const SCHEMA = {
            query  : Joi.object().required(),
            doc    : this.schema.update || Joi.object(),
            options: Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);

        if (validation.error) return Promise.reject(validation.error);
        return Promise.resolve(this.collection
            .updateMany(validation.value.query,
                { $set: validation.value.doc },
                validation.value.options));
    }

    /**
     * Generic update function/method for MongoDB documents based on passed query object
     * The difference bween this and _update is that this updats only one document at a time
     * and returns the updated document back
     *
     *  const SCHEMA = {
     *      query  : Joi.object().required(),
     *      doc    : Joi.object().required(),
     *      options: Joi.object().default({})
     *  };
     *
     * @method _updateOne
     * @memberof BeameryCollection
     * @param  {Object}             params      Object containing the properties; collection, query, update, and options
     * @returns {Promise<Object>}   results
     * @private
    */
    _updateOne(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            doc    : this.schema.update || Joi.object(),
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection.findOneAndUpdate(validation.value.query, {
            $set: validation.value.doc
        }, {
            returnOriginal: false
        }));
    }

    /**
     * Generic add to set method for MongoDB documents
     *
     *  const SCHEMA = {
     *      query  : Joi.object().required(),
     *      doc    : Joi.object().required(),
     *      options: Joi.object().default({})
     *  };
     *
     * @method _addToSet
     * @memberof BeameryCollection
     * @param  {Object}             params      Object containing the properties; collection, query, update, and options
     * @returns {Promise<Object>}   results
     * @private
    */
    _addToSet(params) {
        // Build out the schema for validation with Joi
        const SCHEMA = {
            query  : Joi.object().required(),
            doc    : this.schema.update || Joi.object(),
            options: Joi.object().default({})
        };

        // Validate based on config schema
        const validation = Joi.validate(params, SCHEMA);

        // Reject if issues
        if (validation.error) return Promise.reject(validation.error);

        // Execute the update operation
        return Promise.resolve(this.collection.updateMany(
            validation.value.query,
            { $addToSet: validation.value.doc },
            validation.value.options
        ));
    }

    /**
     * Generic update function/method for MongoDB documents based on passed query object
     * This method will create a documet if it does not exist with upsert
     *
     *  const SCHEMA = {
     *      query  : Joi.object().required(),
     *      doc    : Joi.object().required(),
     *      options: Joi.object().default({})
     *  };
     *
     * @method _upsert
     * @template T
     * @memberof BeameryCollection
     * @param  {{doc:T,query:any}}             params      Object containing the properties; collection, query, update, and options
     * @returns {Promise<T>}   results
     * @private
    */
    _upsert(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            doc    : this.schema.create
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection
            .findOneAndReplace(validation.value.query, validation.value.doc, {
                upsert: true,
                returnOriginal: false
            }))
            // always return the document upserted
            .then($ => $.value || Object.assign({ _id: $.lastErrorObject.upserted }, validation.value.doc))
    }

    /**
     * Generic unset function/method for MongoDB documents based on passed query object
     *
     *  const SCHEMA = {
     *      query  : Joi.object().required(),
     *      doc    : Joi.array().items(Joi.string()).required(),
     *      options: Joi.object().default({})
     *  };
     *
     * @method _unset
     * @memberof BeameryCollection
     * @param  {{query:any,options?:any,doc:string[]}}             params      Object containing the properties; collection, query, update, and options
     * @returns {Promise<Object>}   results
     * @private
     */
    _unset(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            doc    : Joi.array().items(Joi.string()).required(),
            options: Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        let unset = {};

        // Mapping a unset object
        validation.value.doc.forEach((item)=>{
            unset[item] = '';
        });

        return Promise.resolve(this.collection
            .updateMany(validation.value.query,
            { $unset: unset },
            validation.value.options));
    }

    /**
     * Generic remove function/method for MongoDB documents based on passed
     * query object
     *   const SCHEMA = {
     *       query  : Joi.object().required(),
     *       options: Joi.object().default({})
     *   }
     *
     * @method _delete
     * @memberof BeameryCollection
     * @param   {{query:any,options?:any}} params containing the MongoDB query,
     * collection, and projection
     * @returns {Promise<Object>} results
     * @private
    */
    _delete(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            options: Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection
            .deleteMany(validation.value.query, validation.value.options));
    }

    /**
     * Generic remove function/method for MongoDB documents based on passed query object
     *   const SCHEMA = {
     *       query  : Joi.object().required(),
     *       options: Joi.object().default({})
     *   }
     *
     * @method _count
     * @memberof BeameryCollection
     * @param   {{query:any,projection?:any,options?:any}} params Object containing the MongoDB query, collection, and projection
     * @returns {Promise<Object>} results
     * @private
     */
    _count(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            projection: Joi.object().default({}),
            options: Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection
            .find(validation.value.query, validation.value.projection, validation.value.options)
            .count());
    }

    /**
     * Generic remove function/method for MongoDB documents based on passed query object
     *   const SCHEMA = {
     *       query  : Joi.object().required(),
     *       options: Joi.object().default({})
     *   }
     *
     * @method _deleteMany
     * @memberof BeameryCollection
     * @param   {{query:any,projection?:any,options?:any}} params Object containing the MongoDB query, collection, and projection
     * @private
     */
    _deleteMany(params) {

        const SCHEMA = {
            query  : Joi.object().required(),
            options: Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        return Promise.resolve(this.collection
            .deleteMany(validation.value.query, validation.value.options));
    }

    /**
     * Stream query results out of MongoDB documents based on passed query object and emit them
     *
     *   const SCHEMA = {
     *       query     : Joi.object().required(),
     *       projection: Joi.object().default({}),
     *       limit     : Joi.number().integer().default(0),
     *       skip      : Joi.number().integer().default(0),
     *       offset    : Joi.number().integer().default(0),
     *       sort      : Joi.object().default({})
     *   };
     *
     * @method _stream
     * @memberof BeameryCollection
     * @param {{query:any,projection?:any,options?:any}} params Object containing the MongoDB query, collection, and projection
     * @private
     * @todo only return a promise, very dangerous as is
    */
    _stream(params) {

        const SCHEMA = {
            query     : Joi.object().required(),
            projection: Joi.object().default({}),
            limit     : Joi.number().integer().default(0),
            skip      : Joi.number().integer().default(0),
            offset    : Joi.number().integer().default(0),
            sort      : Joi.object().default({})
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        // Query the collection
        return this.collection.find(validation.value.query, validation.value.projection).stream();
    }

    /**
     * Aggregate aggregate query wrapper for vacancies, It's used by teams to get the count of vacancies in a team
     *
     *   const SCHEMA = {
     *       pipeline: Joi.array().items(Joi.object()).required()
     *   }
     *
     * @method aggregate
     * @memberof BeameryCollection
     * @param {{pipeline:Array<Object>}} params the database document to be
     * unified
     * @returns {Promise<Object>}
     * @private
     */

    _aggregate(params) {

        const SCHEMA = {
            pipeline: Joi.array().items(Joi.object()).required()
        };

        const validation = Joi.validate(params, SCHEMA);
        if (validation.error) return Promise.reject(validation.error);

        //Pls leave the code as it is -> ".aggregate" not support a Promise as result and ".toArray()"
        return new Promise( (resolve, reject) => this.collection.aggregate(validation.value.pipeline, (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        }));
    }
    /**
     * the field to use as the Id
     * @member {string} idField
     */
    get idField() {
        return 'id';
    }

    /**
     * the schema to use as the validation schema
     * @member {Object} schema
     */
    get schema(){
        return configs.validation.collections[this.name] || {
            create: Joi.object().unknown(),
            update: Joi.object().unknown(),
            read: Joi.object().unknown(),
        }
    }

    /**
     * @member {Collection} collection
     * @private
     */
    get collection(){
        return this.__INTERNAL__.client.collection(this.name);
    }
}
module.exports = BeameryCollection;