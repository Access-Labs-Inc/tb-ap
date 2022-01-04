import reddis

EXPIRE_TIME = 10 * 60  # in seconds

redis_client = redis.Redis()  # set url


def redis_set_nonce(nonce, user_address):
    redis_client.set("nonce:" + user_address, nonce, ex=EXPIRE_TIME)


def redis_get_nonce(user_address):
    return redis_client.get("nonce:" + user_address)
