import { createClient } from "redis";

class RedisCache {
  constructor(mongo, redis) {
    this.redisClient = createClient(redis);
    this.mongo = mongo;
  }

  fetchOne = async (schema, objectId, key) => {
    let document;

    document = await this.redisClient.hGet(schema.collection.name, key);

    if (!document) {
      document = await schema.findOne({ [objectId]: key });

      if (document) {
        this.redisClient.hSet(
          schema.collection.name,
          key ? key : document._id.id,
          JSON.stringify(document)
        );
      }
    }

    return document;
  };

  fetchAll = async (schema, key) => {
    let documents = [];

    documents = await this.redisClient.hGetAll(schema.collection.name);
    if (!documents) {
      documents = await schema.find();
      // if documents is not null or empty cache them all
      if (documents && Array.isArray(documents)) {
        for (document in documents) {
          this.redisClient.hSet(
            schema.collection.name,
            key ? key : document._id.id,
            JSON.stringify(document)
          );
        }
      }
    }
    return documents;
  };

  /**
   * @param {Object} [options] Function options
   * @param {String|null} [options.expireIn] specify the durtion before the entry expires
   */
  save = async (schema, key) => {
    // cache to redis
    this.redisClient.hSet(
      schema.collection.name,
      key ? key : schema._id.id,
      JSON.stringify(schema)
    );
    // save to mongo
    schema.save();
  };
}

export default RedisCache;
